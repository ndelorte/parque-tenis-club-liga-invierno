"use server"

import { revalidatePath } from "next/cache"
import { isRequestFromAdmin } from "@/lib/auth/requireAdmin"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  FINAL_MASTER_CATEGORIES,
  finalMasterSlug,
  isFinalMasterSlug,
} from "@/lib/final-master/categories"
import { hasPendingPartner, pairName, PENDING_PARTNER_MESSAGE } from "@/lib/final-master/partner"
import {
  FINAL_MASTER_MAX_ENTRIES,
  FINAL_MASTER_MIN_ENTRIES,
  PLAYED_MATCH_OR_FILTER,
  drawFinalMaster,
  roundRobinPairs,
} from "@/lib/final-master/draw"
import { rankFinalMasterEntries, getFinalMasterCategorySummaries } from "@/lib/data/final-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import type { DbMmCategory, DbMmEdition, DbMmGroup, DbMmParticipant } from "@/lib/data/mid-master/types"

type ActionResult = { ok: true } | { ok: false; error: string }

const UNAUTHORIZED: ActionResult = { ok: false, error: "No autorizado." }

// Supabase sin tipado estricto para tablas mid_master_*
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return createAdminClient() as any }

function revalidateAll() {
  revalidatePath("/panel-circuito", "layout")
  revalidatePath("/circuito-del-parque", "layout")
}

const CONCURRENT_ERROR = "Otro cambio se hizo al mismo tiempo; recargá la página."
const READ_ERROR = "No se pudo verificar el estado de los cuadros; probá de nuevo."

function fail(message: string, error?: { message?: string; code?: string } | null): ActionResult {
  // 23505 = violación de unicidad (índices de las migraciones 019 y 020): dos cambios simultáneos.
  if (error?.code === "23505") return { ok: false, error: CONCURRENT_ERROR }
  return { ok: false, error: error?.message ? `${message} (${error.message})` : message }
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "jugador"
  )
}

// Categoría + edición, validando que sea de un Final Master.
async function loadCategory(
  categoryId: string,
): Promise<{ category: DbMmCategory; edition: DbMmEdition } | { error: string }> {
  const { data: category, error: catError } = await db().from("mid_master_categories").select("*").eq("id", categoryId).maybeSingle()
  if (catError) return { error: "No se pudo leer la categoría; probá de nuevo." }
  if (!category) return { error: "No se encontró la categoría." }
  const { data: edition, error: edError } = await db().from("mid_master_editions").select("*").eq("id", category.edition_id).maybeSingle()
  if (edError) return { error: "No se pudo leer la edición; probá de nuevo." }
  if (!edition || !isFinalMasterSlug(edition.slug)) {
    return { error: "La categoría no pertenece a un Final Master." }
  }
  return { category: category as DbMmCategory, edition: edition as DbMmEdition }
}

// Fail-closed: null si la consulta falla (el llamador aborta; nunca se asume false).
async function hasDraw(categoryId: string): Promise<boolean | null> {
  const [parts, matches] = await Promise.all([
    db().from("mid_master_participants").select("id").eq("category_id", categoryId).not("group_name", "is", null).limit(1),
    db().from("mid_master_matches").select("id").eq("category_id", categoryId).limit(1),
  ])
  if (parts.error || matches.error) return null
  return (parts.data?.length ?? 0) > 0 || (matches.data?.length ?? 0) > 0
}

// ── Edición ──────────────────────────────────────────────────

export async function createFinalMasterEditionAction(year: number): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { ok: false, error: "Año inválido." }
  const sb = db()
  const slug = finalMasterSlug(year)

  const { data: existingEdition, error: edReadError } = await sb.from("mid_master_editions").select("*").eq("slug", slug).maybeSingle()
  if (edReadError) return fail("No se pudo leer la edición.", edReadError)
  let edition = existingEdition
  if (!edition) {
    const { data, error } = await sb
      .from("mid_master_editions")
      .insert({ slug, name: "Final Master", year, status: "upcoming" })
      .select("*")
      .single()
    if (error || !data) return fail("No se pudo crear la edición.", error)
    edition = data
  }

  const { data: existingCats, error: catsError } = await sb
    .from("mid_master_categories")
    .select("id, slug")
    .eq("edition_id", edition.id)
  if (catsError) return fail("No se pudieron leer las categorías.", catsError)
  const have = new Set((existingCats ?? []).map((c: { slug: string }) => c.slug))

  const missing = FINAL_MASTER_CATEGORIES.map((def, i) => ({ def, order: i + 1 })).filter(({ def }) => !have.has(def.rankingSlug))
  if (missing.length > 0) {
    const { error } = await sb.from("mid_master_categories").insert(
      missing.map(({ def, order }) => ({
        edition_id: edition.id,
        name: def.name,
        slug: def.rankingSlug,
        type: def.type,
        display_order: order,
        group_size: 4,
        is_active: true,
      })),
    )
    if (error) return fail("No se pudieron crear las categorías.", error)
  }

  // Las dos zonas de cada categoría (las que falten).
  const { data: cats, error: catsReadError } = await sb.from("mid_master_categories").select("id").eq("edition_id", edition.id)
  if (catsReadError) return fail("No se pudieron leer las categorías.", catsReadError)
  const catIds = (cats ?? []).map((c: { id: string }) => c.id)
  const { data: groups, error: groupsError } = await sb
    .from("mid_master_groups")
    .select("category_id, name")
    .in("category_id", catIds)
  if (groupsError) return fail("No se pudieron leer las zonas.", groupsError)
  const haveGroup = new Set((groups ?? []).map((g: { category_id: string; name: string }) => `${g.category_id}|${g.name}`))
  const newGroups = catIds.flatMap((id: string) =>
    [
      { name: "A", display_order: 1 },
      { name: "B", display_order: 2 },
    ]
      .filter((g) => !haveGroup.has(`${id}|${g.name}`))
      .map((g) => ({ category_id: id, ...g })),
  )
  if (newGroups.length > 0) {
    const { error } = await sb.from("mid_master_groups").insert(newGroups)
    if (error) return fail("No se pudieron crear las zonas.", error)
  }

  revalidateAll()
  return { ok: true }
}

// ── Inscriptos ───────────────────────────────────────────────

export async function addFinalMasterEntryAction(
  categoryId: string,
  playerId: string,
  player2Id?: string | null,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const loaded = await loadCategory(categoryId)
  if ("error" in loaded) return { ok: false, error: loaded.error }
  const { category } = loaded

  const isDouble = normalizeType(category.type) === "doubles"
  if (!playerId) return { ok: false, error: "Elegí un jugador." }
  // En dobles el compañero es opcional: sin él queda "A confirmar".
  const partnerId = isDouble && player2Id ? player2Id : null
  if (partnerId && partnerId === playerId) {
    return { ok: false, error: "Los dos jugadores de la pareja tienen que ser distintos." }
  }
  const ids = partnerId ? [playerId, partnerId] : [playerId]

  const drawn = await hasDraw(categoryId)
  if (drawn === null) return { ok: false, error: READ_ERROR }
  if (drawn) return { ok: false, error: "Los cuadros ya están armados. Primero deshacé los cuadros." }

  const { data: existing, error: existingError } = await sb
    .from("mid_master_participants")
    .select("id, player_id, player_2_id, display_order")
    .eq("category_id", categoryId)
  if (existingError) return fail("No se pudieron leer los inscriptos.", existingError)
  const rows = (existing ?? []) as Array<{ player_id: string | null; player_2_id: string | null; display_order: number | null }>

  if (rows.length >= FINAL_MASTER_MAX_ENTRIES) {
    return { ok: false, error: `La categoría ya tiene el máximo de ${FINAL_MASTER_MAX_ENTRIES} inscriptos.` }
  }
  const taken = new Set(rows.flatMap((r) => [r.player_id, r.player_2_id]).filter((x): x is string => !!x))
  if (ids.some((id) => taken.has(id))) {
    return { ok: false, error: "Ese jugador ya está inscripto en la categoría." }
  }

  const { data: players, error: playersError } = await sb.from("players").select("id, display_name").in("id", ids)
  if (playersError) return fail("No se pudieron leer los jugadores.", playersError)
  const nameOf = (id: string) => (players ?? []).find((p: { id: string }) => p.id === id)?.display_name as string | undefined
  const names = ids.map(nameOf)
  if (names.some((n) => !n)) return { ok: false, error: "No se encontró alguno de los jugadores." }
  const name = isDouble ? pairName(names[0] as string, names[1]) : (names[0] as string)

  const displayOrder = rows.reduce((max, r) => Math.max(max, r.display_order ?? 0), 0) + 1
  const { error } = await sb.from("mid_master_participants").insert({
    category_id: categoryId,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    player_id: playerId,
    player_2_id: partnerId,
    display_order: displayOrder,
    group_name: null,
    is_active: true,
  })
  if (error) return fail("No se pudo agregar al inscripto.", error)

  revalidateAll()
  return { ok: true }
}

// Elige (o cambia) el compañero de una pareja de dobles. Solo sin cuadros armados:
// con cuadros hay que deshacerlos primero (el orden sale del ranking de los dos).
// El cruce player_id/player_2_id entre filas lo valida esta action (un solo admin);
// la migración 020 solo cubre player_2_id duplicado.
export async function setFinalMasterPartnerAction(participantId: string, player2Id: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  if (!player2Id) return { ok: false, error: "Elegí el compañero." }
  const { data: participant, error: partError } = await sb
    .from("mid_master_participants")
    .select("id, category_id, player_id")
    .eq("id", participantId)
    .maybeSingle()
  if (partError) return fail("No se pudo leer al inscripto.", partError)
  if (!participant) return { ok: false, error: "No se encontró al inscripto." }
  const loaded = await loadCategory(participant.category_id)
  if ("error" in loaded) return { ok: false, error: loaded.error }
  const { category } = loaded
  if (normalizeType(category.type) !== "doubles") {
    return { ok: false, error: "Solo las categorías de dobles tienen compañero." }
  }
  const drawn = await hasDraw(participant.category_id)
  if (drawn === null) return { ok: false, error: READ_ERROR }
  if (drawn) return { ok: false, error: "Los cuadros ya están armados. Primero deshacé los cuadros." }
  if (!participant.player_id) return { ok: false, error: "La pareja no tiene jugador 1 cargado." }
  if (player2Id === participant.player_id) {
    return { ok: false, error: "Los dos jugadores de la pareja tienen que ser distintos." }
  }

  const { data: others, error: othersError } = await sb
    .from("mid_master_participants")
    .select("id, player_id, player_2_id")
    .eq("category_id", participant.category_id)
    .neq("id", participantId)
  if (othersError) return fail("No se pudieron leer los inscriptos.", othersError)
  const taken = new Set(
    ((others ?? []) as Array<{ player_id: string | null; player_2_id: string | null }>)
      .flatMap((r) => [r.player_id, r.player_2_id])
      .filter((x): x is string => !!x),
  )
  if (taken.has(player2Id)) return { ok: false, error: "Ese jugador ya está inscripto en la categoría." }

  const { data: players, error: playersError } = await sb
    .from("players")
    .select("id, display_name")
    .in("id", [participant.player_id, player2Id])
  if (playersError) return fail("No se pudieron leer los jugadores.", playersError)
  const nameOf = (id: string) => (players ?? []).find((p: { id: string }) => p.id === id)?.display_name as string | undefined
  const name1 = nameOf(participant.player_id)
  const name2 = nameOf(player2Id)
  if (!name1 || !name2) return { ok: false, error: "No se encontró alguno de los jugadores." }

  const name = pairName(name1, name2)
  const { data: updated, error } = await sb
    .from("mid_master_participants")
    .update({ player_2_id: player2Id, name, slug: `${slugify(name)}-${Date.now().toString(36)}` })
    .eq("id", participantId)
    .select("id")
  if (error) return fail("No se pudo guardar el compañero.", error)
  if (!updated || updated.length === 0) return { ok: false, error: "La pareja ya no existe; recargá la página." }

  revalidateAll()
  return { ok: true }
}

export async function removeFinalMasterEntryAction(participantId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const { data: participant, error: partError } = await sb
    .from("mid_master_participants")
    .select("id, category_id")
    .eq("id", participantId)
    .maybeSingle()
  if (partError) return fail("No se pudo leer al inscripto.", partError)
  if (!participant) return { ok: false, error: "No se encontró al inscripto." }
  const loaded = await loadCategory(participant.category_id)
  if ("error" in loaded) return { ok: false, error: loaded.error }
  const drawn = await hasDraw(participant.category_id)
  if (drawn === null) return { ok: false, error: READ_ERROR }
  if (drawn) return { ok: false, error: "Los cuadros ya están armados. Primero deshacé los cuadros." }
  const { error } = await sb.from("mid_master_participants").delete().eq("id", participantId)
  if (error) return fail("No se pudo quitar al inscripto.", error)
  revalidateAll()
  return { ok: true }
}

// ── Cuadros ──────────────────────────────────────────────────

// Jugado = status played/walkover, o ganador o resultado cargados (isPlayedMatch).
// Fail-closed: null si la consulta falla.
async function hasPlayedMatches(categoryId: string): Promise<boolean | null> {
  const { data, error } = await db()
    .from("mid_master_matches")
    .select("id")
    .eq("category_id", categoryId)
    .or(PLAYED_MATCH_OR_FILTER)
    .limit(1)
  if (error) return null
  return (data?.length ?? 0) > 0
}

export async function drawFinalMasterCategoryAction(categoryId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const loaded = await loadCategory(categoryId)
  if ("error" in loaded) return { ok: false, error: loaded.error }
  const { category, edition } = loaded

  const played = await hasPlayedMatches(categoryId)
  if (played === null) return { ok: false, error: READ_ERROR }
  if (played) return { ok: false, error: "Ya hay partidos jugados: no se pueden rearmar los cuadros." }

  const { data: parts, error: partsError } = await sb
    .from("mid_master_participants")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true })
  if (partsError) return fail("No se pudieron leer los inscriptos.", partsError)
  const participants = (parts ?? []) as DbMmParticipant[]
  if (participants.length < FINAL_MASTER_MIN_ENTRIES || participants.length > FINAL_MASTER_MAX_ENTRIES) {
    return {
      ok: false,
      error: `Para armar los cuadros hacen falta entre ${FINAL_MASTER_MIN_ENTRIES} y ${FINAL_MASTER_MAX_ENTRIES} inscriptos (hay ${participants.length}).`,
    }
  }

  const isDouble = normalizeType(category.type) === "doubles"
  if (isDouble && hasPendingPartner(participants)) {
    return { ok: false, error: PENDING_PARTNER_MESSAGE }
  }

  const { data: groupRows, error: groupsError } = await sb.from("mid_master_groups").select("*").eq("category_id", categoryId)
  if (groupsError) return fail("No se pudieron leer las zonas.", groupsError)
  const groups = (groupRows ?? []) as DbMmGroup[]
  const groupA = groups.find((g) => g.name.trim().toUpperCase() === "A")
  const groupB = groups.find((g) => g.name.trim().toUpperCase() === "B")
  if (!groupA || !groupB) return { ok: false, error: "La categoría no tiene las zonas A y B. Creá de nuevo el Final Master." }

  // El ranking se lee con throwOnError: si falla no se sortea (sería como si
  // nadie tuviera ranking y quedarían ordenados por orden de carga).
  let ranked
  try {
    ranked = await rankFinalMasterEntries(participants, category.slug, edition.year, { throwOnError: true })
  } catch {
    return { ok: false, error: "No se pudo leer el ranking; probá de nuevo." }
  }
  let draw
  try {
    draw = drawFinalMaster(ranked)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo hacer el sorteo." }
  }

  // Parte de cero: borra los partidos de un armado anterior.
  const { error: delError } = await sb.from("mid_master_matches").delete().eq("category_id", categoryId)
  if (delError) return fail("No se pudieron borrar los partidos anteriores.", delError)

  for (const d of draw) {
    const { error } = await sb.from("mid_master_participants").update({ seed: d.seed, group_name: d.zone }).eq("id", d.id)
    if (error) return fail("No se pudieron asignar las zonas.", error)
  }

  const zoneIds = (zone: "A" | "B") => draw.filter((d) => d.zone === zone).map((d) => d.id) // ya en orden de seed
  const sizeA = zoneIds("A").length
  const sizeB = zoneIds("B").length
  const { error: sizeError } = await sb
    .from("mid_master_categories")
    .update({ group_size: Math.max(sizeA, sizeB) })
    .eq("id", categoryId)
  if (sizeError) return fail("No se pudo actualizar el tamaño de las zonas.", sizeError)

  const zoneMatches = ([["A", groupA], ["B", groupB]] as const).flatMap(([zone, group]) =>
    roundRobinPairs(zoneIds(zone)).map(([p1, p2], i) => ({
      category_id: categoryId,
      group_id: group.id,
      phase: "group",
      match_order: i + 1,
      participant_1_id: p1,
      participant_2_id: p2,
      status: "pending",
    })),
  )
  const { error: zoneError } = await sb.from("mid_master_matches").insert(zoneMatches)
  if (zoneError) return fail("No se pudieron crear los partidos de zona.", zoneError)

  // Semis y final en llamadas separadas y en orden (el orden de carga fija
  // created_at, que es el desempate si match_order faltara).
  const knockout = [
    { phase: "semifinal", match_order: 1 },
    { phase: "semifinal", match_order: 2 },
    { phase: "final", match_order: 1 },
  ]
  for (const k of knockout) {
    const { error } = await sb.from("mid_master_matches").insert({
      category_id: categoryId,
      group_id: null,
      phase: k.phase,
      match_order: k.match_order,
      participant_1_id: null,
      participant_2_id: null,
      status: "pending",
    })
    if (error) return fail("No se pudo crear el cuadro final.", error)
  }

  revalidateAll()
  return { ok: true }
}

export async function undoFinalMasterDrawAction(categoryId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const loaded = await loadCategory(categoryId)
  if ("error" in loaded) return { ok: false, error: loaded.error }
  const played = await hasPlayedMatches(categoryId)
  if (played === null) return { ok: false, error: READ_ERROR }
  if (played) return { ok: false, error: "Ya hay partidos jugados: no se pueden deshacer los cuadros." }
  const { error: delError } = await sb.from("mid_master_matches").delete().eq("category_id", categoryId)
  if (delError) return fail("No se pudieron borrar los partidos.", delError)
  const { error } = await sb
    .from("mid_master_participants")
    .update({ group_name: null, seed: null })
    .eq("category_id", categoryId)
  if (error) return fail("No se pudieron liberar las zonas.", error)
  revalidateAll()
  return { ok: true }
}

// ── Publicación ──────────────────────────────────────────────

export async function publishFinalMasterAction(editionId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const { data: edition, error: edError } = await sb.from("mid_master_editions").select("*").eq("id", editionId).maybeSingle()
  if (edError) return fail("No se pudo leer el Final Master.", edError)
  if (!edition || !isFinalMasterSlug(edition.slug)) return { ok: false, error: "No se encontró el Final Master." }

  let summaries
  try {
    summaries = await getFinalMasterCategorySummaries(editionId)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudieron leer las categorías." }
  }

  const withEntries = summaries.filter((s) => s.entriesCount > 0)
  if (!withEntries.some((s) => s.drawComplete)) {
    return { ok: false, error: "Para publicar hace falta al menos una categoría con los cuadros armados." }
  }
  const problems = withEntries
    .map((s) => {
      if (s.entriesCount < FINAL_MASTER_MIN_ENTRIES || s.entriesCount > FINAL_MASTER_MAX_ENTRIES) {
        return `${s.category.name} (${s.entriesCount} inscriptos)`
      }
      if (!s.hasDraw) return `${s.category.name} (sin cuadros)`
      if (!s.drawComplete) return `${s.category.name} (cuadros incompletos: deshacé y volvé a armar)`
      return null
    })
    .filter((x): x is string => x !== null)
  if (problems.length > 0) {
    return {
      ok: false,
      error: `Faltan completar estas categorías: ${problems.join(", ")}. Cada categoría con inscriptos necesita entre ${FINAL_MASTER_MIN_ENTRIES} y ${FINAL_MASTER_MAX_ENTRIES} y los cuadros armados (las que no tienen inscriptos no se publican).`,
    }
  }

  const { error } = await sb.from("mid_master_editions").update({ status: "active" }).eq("id", editionId)
  if (error) return fail("No se pudo publicar el torneo.", error)
  revalidateAll()
  return { ok: true }
}

export async function unpublishFinalMasterAction(editionId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const sb = db()
  const { data: edition, error: edError } = await sb.from("mid_master_editions").select("slug").eq("id", editionId).maybeSingle()
  if (edError) return fail("No se pudo leer el Final Master.", edError)
  if (!edition || !isFinalMasterSlug(edition.slug)) return { ok: false, error: "No se encontró el Final Master." }
  const { error } = await sb.from("mid_master_editions").update({ status: "upcoming" }).eq("id", editionId)
  if (error) return fail("No se pudo despublicar el torneo.", error)
  revalidateAll()
  return { ok: true }
}
