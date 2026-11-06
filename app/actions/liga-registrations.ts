"use server"

// Panel de Inscripciones de la Liga (Fase V1). Todas las actions validan el
// rol admin en la primera línea (admin-guard.test.ts) y usan la service role:
// las tablas liga_registrations, liga_registration_players y player_private
// no tienen policies para anon/authenticated.

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isRequestFromAdmin, requireAdminActor } from "@/lib/auth/requireAdmin"
import { createAdminClient } from "@/lib/supabase/admin"
import { suggestPlayerMatches, type KnownPlayer } from "@/lib/liga/registration/suggestPlayerMatches"
import { fetchKnownPlayers } from "@/lib/liga/registration/fetchKnownPlayers"
import { isCategoryDrawn } from "@/lib/liga/registration/isCategoryDrawn"
import { registrationApproved, registrationRejected } from "@/lib/liga/registration/history"
import { DEFAULT_MAX_PLAYERS, DEFAULT_MIN_PLAYERS } from "@/lib/liga/registration/availability"
import { toWhatsappUrl } from "@/lib/phone/toWhatsappUrl"
import type { NameMatch } from "@/lib/players/similarNames"
import { listHistoricalPodiums } from "@/lib/data/podium-history"
import { buildMedalCandidates, candidateKey, preselectedKeys, type MedalCandidate } from "@/lib/liga/medals/candidates"

type Result = { success: boolean; error?: string }

const NO_AUTH = "No autorizado"

export type RegistrationStatus = "pending" | "approved" | "rejected" | "withdrawn"

// ——— Configuración de la edición ———

export type RegistrationSettings = {
  tournamentId: string
  tournamentName: string
  slug: string
  open: boolean
  deadline: string | null
  min: number | null
  max: number | null
  // Mínimo y máximo que usa el formulario (los configurados o los por defecto).
  effectiveMin: number
  effectiveMax: number
  categories: Array<{ id: string; name: string }>
}

export async function getRegistrationSettings(): Promise<RegistrationSettings | null> {
  if (!(await isRequestFromAdmin())) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("tournaments")
    .select("id, name, season, slug, registration_open, registration_deadline, registration_min_players, registration_max_players")
    .eq("status", "active")
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const { data: cats } = await supabase.from("categories").select("id, name").eq("tournament_id", data.id).order("name")
  const effectiveMin = data.registration_min_players ?? DEFAULT_MIN_PLAYERS
  return {
    tournamentId: data.id,
    tournamentName: `${data.name} ${data.season}`,
    slug: data.slug,
    open: data.registration_open,
    deadline: data.registration_deadline,
    min: data.registration_min_players,
    max: data.registration_max_players,
    effectiveMin,
    effectiveMax: Math.max(effectiveMin, data.registration_max_players ?? DEFAULT_MAX_PLAYERS),
    categories: (cats ?? []) as Array<{ id: string; name: string }>,
  }
}

const settingsSchema = z
  .object({
    tournamentId: z.string().uuid(),
    open: z.boolean(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").nullable(),
    min: z.number().int().min(1, "El mínimo tiene que ser al menos 1").max(50).nullable(),
    max: z.number().int().min(1, "El máximo tiene que ser al menos 1").max(50).nullable(),
  })
  .refine((v) => v.min === null || v.max === null || v.min <= v.max, "El mínimo no puede ser mayor que el máximo")

export async function updateRegistrationSettings(input: z.input<typeof settingsSchema>): Promise<Result> {
  if (!(await isRequestFromAdmin())) return { success: false, error: NO_AUTH }
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const { tournamentId, open, deadline, min, max } = parsed.data

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tournaments")
    .update({
      registration_open: open,
      registration_deadline: deadline,
      registration_min_players: min,
      registration_max_players: max,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tournamentId)
  if (error) return { success: false, error: "No se pudo guardar la configuración" }

  revalidatePath("/panel-liga")
  revalidatePath("/ligas-invierno-verano", "layout")
  return { success: true }
}

// ——— Listado ———

export type RegistrationListItem = {
  id: string
  teamName: string
  categoryName: string
  captainName: string
  captainPhone: string
  playersCount: number
  status: RegistrationStatus
  createdAt: string
}

export async function listRegistrations(tournamentId: string): Promise<RegistrationListItem[]> {
  if (!(await isRequestFromAdmin())) return []
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("liga_registrations")
    .select(
      "id, team_name, captain_phone, status, created_at, categories(name), liga_registration_players(first_name, last_name, is_captain)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false })

  type Row = {
    id: string
    team_name: string
    captain_phone: string
    status: RegistrationStatus
    created_at: string
    categories: { name: string } | null
    liga_registration_players: Array<{ first_name: string; last_name: string; is_captain: boolean }>
  }
  const items = ((data ?? []) as unknown as Row[]).map((r): RegistrationListItem => {
    const captain = r.liga_registration_players.find((p) => p.is_captain)
    return {
      id: r.id,
      teamName: r.team_name,
      categoryName: r.categories?.name ?? "—",
      captainName: captain ? `${captain.last_name} ${captain.first_name}` : "—",
      captainPhone: r.captain_phone,
      playersCount: r.liga_registration_players.length,
      status: r.status,
      createdAt: r.created_at,
    }
  })
  // Pendientes primero; dentro de cada estado, ya vienen de más nueva a más vieja.
  const rank: Record<RegistrationStatus, number> = { pending: 0, approved: 1, withdrawn: 2, rejected: 3 }
  return items.sort((a, b) => rank[a.status] - rank[b.status])
}

// ——— Detalle / validación ———

export type DetailCandidate = {
  id: string
  displayName: string
  match: NameMatch | "dni"
  // Tiene guardado un DNI distinto del anotado.
  dniMismatch: boolean
  // Ya está activo en este otro equipo de la misma categoría.
  otherTeam: string | null
}

export type DetailPlayer = {
  id: string
  firstName: string
  lastName: string
  dni: string
  isCaptain: boolean
  displayName: string
  resolution: "pending" | "existing" | "new"
  resolved: DetailCandidate | null
  // Match exacto por DNI (si hay).
  exact: DetailCandidate | null
  candidates: DetailCandidate[]
}

// Jugador del plantel de un equipo ya aprobado (team_players + player_private).
export type RosterPlayer = {
  playerId: string
  firstName: string
  lastName: string
  displayName: string
  dni: string | null
  isCaptain: boolean
  active: boolean
}

export type HistoryItem = { id: string; at: string; actor: string; kind: string; summary: string }

export type RegistrationDetail = {
  id: string
  teamName: string
  categoryId: string
  categoryName: string
  captainPhone: string
  // https://wa.me/... del capitán, o null si el teléfono no alcanza para armarlo.
  whatsappUrl: string | null
  notes: string | null
  status: RegistrationStatus
  rejectionReason: string | null
  createdAt: string
  teamId: string | null
  // Solicitud pendiente o rechazada: los jugadores como los anotó el capitán.
  players: DetailPlayer[]
  // Aprobada o dada de baja: el plantel real del equipo.
  roster: RosterPlayer[]
  // La categoría ya tiene series: el cuadro está sorteado.
  drawn: boolean
  categories: Array<{ id: string; name: string }>
  // Del más nuevo al más viejo.
  history: HistoryItem[]
}

export async function getRegistrationDetail(registrationId: string): Promise<RegistrationDetail | null> {
  if (!(await isRequestFromAdmin())) return null
  const supabase = createAdminClient()

  const { data: reg } = await supabase
    .from("liga_registrations")
    .select("id, tournament_id, team_name, captain_phone, notes, status, rejection_reason, created_at, team_id, category_id, categories(name)")
    .eq("id", registrationId)
    .maybeSingle()
  if (!reg) return null

  const { data: rawPlayers } = await supabase
    .from("liga_registration_players")
    .select("id, first_name, last_name, dni, is_captain, sort_order, resolved_player_id, resolution")
    .eq("registration_id", registrationId)
    .order("sort_order")
  type PlayerRow = {
    id: string
    first_name: string
    last_name: string
    dni: string
    is_captain: boolean
    resolved_player_id: string | null
    resolution: "pending" | "existing" | "new"
  }
  const rows = (rawPlayers ?? []) as PlayerRow[]
  const known = await fetchKnownPlayers(supabase)
  const knownById = new Map(known.map((k) => [k.id, k]))

  const suggestions = rows.map((row) =>
    suggestPlayerMatches({ firstName: row.first_name, lastName: row.last_name, dni: row.dni }, known),
  )

  // DNI exacto sobre un jugador pendiente: queda resuelto solo (el organizador
  // puede cambiarlo igual). Sin esto habría que tocar uno por uno.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const exact = suggestions[i].exact
    if (reg.status === "pending" && row.resolution === "pending" && exact) {
      await supabase
        .from("liga_registration_players")
        .update({ resolution: "existing", resolved_player_id: exact.id })
        .eq("id", row.id)
      row.resolution = "existing"
      row.resolved_player_id = exact.id
    }
  }

  // ¿Qué jugadores ya están activos en otro equipo de esta categoría?
  const involvedIds = new Set<string>()
  rows.forEach((row, i) => {
    if (row.resolved_player_id) involvedIds.add(row.resolved_player_id)
    if (suggestions[i].exact) involvedIds.add(suggestions[i].exact!.id)
    suggestions[i].candidates.forEach((c) => involvedIds.add(c.player.id))
  })
  const otherTeamByPlayer = new Map<string, string>()
  if (involvedIds.size > 0) {
    const { data: memberships } = await supabase
      .from("team_players")
      .select("player_id, teams!inner(name, category_id)")
      .eq("active", true)
      .eq("teams.category_id", reg.category_id)
      .eq("teams.active", true)
      .in("player_id", [...involvedIds])
    for (const m of (memberships ?? []) as unknown as Array<{ player_id: string; teams: { name: string } }>) {
      otherTeamByPlayer.set(m.player_id, m.teams.name)
    }
  }

  const toCandidate = (k: KnownPlayer, dni: string, match: DetailCandidate["match"]): DetailCandidate => ({
    id: k.id,
    displayName: k.displayName,
    match,
    dniMismatch: k.dni !== null && k.dni !== dni.replace(/\D/g, ""),
    otherTeam: otherTeamByPlayer.get(k.id) ?? null,
  })

  const players: DetailPlayer[] = rows.map((row, i) => {
    const s = suggestions[i]
    const resolvedKnown = row.resolved_player_id ? knownById.get(row.resolved_player_id) : undefined
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      dni: row.dni,
      isCaptain: row.is_captain,
      displayName: s.displayName,
      resolution: row.resolution,
      resolved: resolvedKnown ? toCandidate(resolvedKnown, row.dni, "dni") : null,
      exact: s.exact ? toCandidate(s.exact, row.dni, "dni") : null,
      candidates: s.candidates.map((c) => toCandidate(c.player, row.dni, c.match)),
    }
  })

  const hasTeam = (reg.status === "approved" || reg.status === "withdrawn") && !!reg.team_id
  const roster = hasTeam ? await fetchRoster(supabase, reg.team_id as string, reg.status === "approved") : []
  const [drawn, categoriesRes, historyRes] = await Promise.all([
    isCategoryDrawn(supabase, reg.category_id),
    supabase.from("categories").select("id, name").eq("tournament_id", reg.tournament_id).order("name"),
    supabase
      .from("liga_registration_events")
      .select("id, at, actor, kind, summary")
      .eq("registration_id", registrationId)
      .order("at", { ascending: false }),
  ])

  return {
    id: reg.id,
    teamName: reg.team_name,
    categoryId: reg.category_id,
    categoryName: (reg.categories as unknown as { name: string } | null)?.name ?? "—",
    captainPhone: reg.captain_phone,
    whatsappUrl: toWhatsappUrl(reg.captain_phone),
    notes: reg.notes,
    status: reg.status,
    rejectionReason: reg.rejection_reason ?? null,
    createdAt: reg.created_at,
    teamId: reg.team_id,
    players: hasTeam ? [] : players,
    roster,
    drawn,
    categories: (categoriesRes.data ?? []) as Array<{ id: string; name: string }>,
    history: (historyRes.data ?? []) as HistoryItem[],
  }
}

async function fetchRoster(supabase: ReturnType<typeof createAdminClient>, teamId: string, onlyActive: boolean): Promise<RosterPlayer[]> {
  let query = supabase
    .from("team_players")
    .select("player_id, is_captain, active, players(first_name, last_name, display_name)")
    .eq("team_id", teamId)
  if (onlyActive) query = query.eq("active", true)
  const { data } = await query
  type Row = {
    player_id: string
    is_captain: boolean
    active: boolean
    players: { first_name: string; last_name: string; display_name: string } | null
  }
  const rows = (data ?? []) as unknown as Row[]
  const { data: privates } = rows.length
    ? await supabase.from("player_private").select("player_id, dni").in("player_id", rows.map((r) => r.player_id))
    : { data: [] }
  const dniById = new Map(((privates ?? []) as Array<{ player_id: string; dni: string }>).map((r) => [r.player_id, r.dni]))
  return rows
    .map((r): RosterPlayer => ({
      playerId: r.player_id,
      // Los jugadores del panel viejo tienen todo el nombre en first_name.
      firstName: r.players?.last_name ? r.players.first_name : "",
      lastName: r.players?.last_name ? r.players.last_name : (r.players?.display_name ?? ""),
      displayName: r.players?.display_name ?? "—",
      dni: dniById.get(r.player_id) ?? null,
      isCaptain: r.is_captain,
      active: r.active,
    }))
    .sort((a, b) => Number(b.isCaptain) - Number(a.isCaptain) || a.displayName.localeCompare(b.displayName, "es"))
}

// ——— Resolución de cada jugador ———

export async function setPlayerResolution(
  registrationPlayerId: string,
  resolution: "existing" | "new" | "pending",
  playerId: string | null,
): Promise<Result> {
  if (!(await isRequestFromAdmin())) return { success: false, error: NO_AUTH }
  const supabase = createAdminClient()

  const { data: row } = await supabase
    .from("liga_registration_players")
    .select("id, registration_id, liga_registrations(status)")
    .eq("id", registrationPlayerId)
    .maybeSingle()
  const status = (row?.liga_registrations as unknown as { status: RegistrationStatus } | null)?.status
  if (!row || status !== "pending") return { success: false, error: "La inscripción ya fue revisada" }

  if (resolution === "existing") {
    if (!playerId) return { success: false, error: "Elegí el jugador" }
    const { data: player } = await supabase.from("players").select("id").eq("id", playerId).maybeSingle()
    if (!player) return { success: false, error: "El jugador no existe" }
    const { data: dup } = await supabase
      .from("liga_registration_players")
      .select("id")
      .eq("registration_id", row.registration_id)
      .eq("resolved_player_id", playerId)
      .neq("id", registrationPlayerId)
      .limit(1)
    if (dup && dup.length > 0) return { success: false, error: "Ese jugador ya está asignado a otra fila de la inscripción" }
  }

  const { error } = await supabase
    .from("liga_registration_players")
    .update({
      resolution,
      resolved_player_id: resolution === "existing" ? playerId : null,
    })
    .eq("id", registrationPlayerId)
  if (error) return { success: false, error: "No se pudo guardar" }
  return { success: true }
}

// ——— Aprobar / rechazar ———

// Medalla elegida por el organizador: categoría de origen del podio + puesto.
const medalInputSchema = z.object({
  categoryId: z.string().uuid(),
  place: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})
export type MedalInput = z.infer<typeof medalInputSchema>

// Un equipo lleva a lo sumo una medalla por categoría de origen.
const medalListSchema = z
  .array(medalInputSchema)
  .max(30, "Demasiadas medallas")
  .refine((list) => new Set(list.map((m) => m.categoryId)).size === list.length, "Hay dos medallas de la misma categoría")

export async function approveRegistration(
  registrationId: string,
  medals: MedalInput[] = [],
): Promise<Result & { teamId?: string }> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const parsedMedals = medalListSchema.safeParse(medals)
  if (!parsedMedals.success) return { success: false, error: parsedMedals.error.issues[0]?.message ?? "Medallas inválidas" }
  const supabase = createAdminClient()
  const { data: reg } = await supabase.from("liga_registrations").select("team_name").eq("id", registrationId).maybeSingle()

  // Una sola función SQL: crea equipo, jugadores nuevos, DNI, plantel y
  // medallas, marca la solicitud y deja el historial. Si algo falla se revierte todo.
  const { data, error } = await supabase.rpc("approve_liga_registration_logged", {
    p_registration_id: registrationId,
    p_medals: parsedMedals.data.map((m) => ({ source_category_id: m.categoryId, place: m.place })),
    p_actor: actor,
    p_events: [registrationApproved(reg?.team_name ?? "")],
  })
  if (error) return { success: false, error: error.message || "No se pudo aprobar la inscripción" }

  revalidatePath("/panel-liga")
  revalidatePath("/ligas-invierno-verano", "layout")
  return { success: true, teamId: data as string }
}

export async function rejectRegistration(registrationId: string, reason?: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const cleanReason = (reason ?? "").trim().slice(0, 500) || null
  const supabase = createAdminClient()
  const { error } = await supabase.rpc("reject_liga_registration", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_reason: cleanReason,
    p_events: [registrationRejected(cleanReason)],
  })
  if (error) return { success: false, error: error.message || "No se pudo rechazar la inscripción" }
  revalidatePath("/panel-liga")
  return { success: true }
}

// ¿La edición activa usa inscripción online? (abierta o con solicitudes). El
// panel "Jugadores" lo usa para avisar que el plantel se edita desde Inscripciones.
export async function hasOnlineRegistration(): Promise<boolean> {
  if (!(await isRequestFromAdmin())) return false
  const supabase = createAdminClient()
  const { data: t } = await supabase
    .from("tournaments")
    .select("id, registration_open")
    .eq("status", "active")
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!t) return false
  if (t.registration_open) return true
  const { count } = await supabase
    .from("liga_registrations")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", t.id)
  return (count ?? 0) > 0
}

// ——— Medallas de podios anteriores ———

export type MedalCandidates = {
  candidates: MedalCandidate[]
  // Claves (`categoryId:place`) tildadas de entrada. Pendiente: las
  // coincidencias exactas de nombre. Aprobada: las medallas que el equipo ya tiene.
  selected: string[]
}

export async function listMedalCandidates(registrationId: string): Promise<MedalCandidates | null> {
  if (!(await isRequestFromAdmin())) return null
  const supabase = createAdminClient()
  const { data: reg } = await supabase
    .from("liga_registrations")
    .select("team_name, status, team_id")
    .eq("id", registrationId)
    .maybeSingle()
  if (!reg || reg.status === "rejected") return null

  const candidates = buildMedalCandidates(await listHistoricalPodiums(), reg.team_name)
  if (reg.status === "pending" || !reg.team_id) return { candidates, selected: preselectedKeys(candidates) }

  const { data: current } = await supabase.from("team_medals").select("source_category_id, place").eq("team_id", reg.team_id)
  const selected = ((current ?? []) as Array<{ source_category_id: string; place: number }>).map((m) =>
    candidateKey({ categoryId: m.source_category_id, place: m.place as 1 | 2 | 3 }),
  )
  return { candidates, selected }
}

// Alta y baja de medallas de un equipo ya aprobado (el cruce por nombre puede
// fallar). Recibe solo las diferencias: lo que no se toca queda como está.
export async function saveTeamMedals(
  registrationId: string,
  changes: { add: MedalInput[]; removeCategoryIds: string[] },
): Promise<Result> {
  if (!(await isRequestFromAdmin())) return { success: false, error: NO_AUTH }
  const parsedAdd = medalListSchema.safeParse(changes.add)
  const parsedRemove = z.array(z.string().uuid()).max(30).safeParse(changes.removeCategoryIds)
  if (!parsedAdd.success) return { success: false, error: parsedAdd.error.issues[0]?.message ?? "Medallas inválidas" }
  if (!parsedRemove.success) return { success: false, error: "Medallas inválidas" }

  const supabase = createAdminClient()
  const { data: reg } = await supabase
    .from("liga_registrations")
    .select("status, team_id")
    .eq("id", registrationId)
    .maybeSingle()
  if (!reg || reg.status !== "approved" || !reg.team_id) {
    return { success: false, error: "Las medallas se editan una vez aprobada la inscripción" }
  }

  if (parsedRemove.data.length > 0) {
    const { error } = await supabase
      .from("team_medals")
      .delete()
      .eq("team_id", reg.team_id)
      .in("source_category_id", parsedRemove.data)
    if (error) return { success: false, error: "No se pudieron quitar las medallas" }
  }
  if (parsedAdd.data.length > 0) {
    const { error } = await supabase.from("team_medals").upsert(
      parsedAdd.data.map((m) => ({ team_id: reg.team_id, source_category_id: m.categoryId, place: m.place })),
      { onConflict: "team_id,source_category_id" },
    )
    if (error) return { success: false, error: "No se pudieron guardar las medallas" }
  }

  revalidatePath("/ligas-invierno-verano", "layout")
  return { success: true }
}
