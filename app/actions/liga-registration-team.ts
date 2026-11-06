"use server"

// Gestión de inscripciones y equipos desde el panel (Fase V3): la "ficha" del
// equipo. Toda action valida el rol admin en la primera línea
// (admin-guard.test.ts). Los cambios de varios pasos pasan por RPC de la
// migración 015, que hace el cambio y escribe el historial en la misma
// transacción. `actor` es el email del admin.
//
// Nada de acá toca series ni la tabla de posiciones: qué pasa con los partidos
// de un equipo dado de baja es una regla deportiva y no se infiere.

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminActor } from "@/lib/auth/requireAdmin"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildRegistrationSchema, captainPhoneSchema, notesSchema, playerSchema, teamNameSchema } from "@/lib/liga/registration/schema"
import { isValidDni, normalizeDni } from "@/lib/liga/registration/normalizeDni"
import { suggestPlayerMatches, toDisplayName } from "@/lib/liga/registration/suggestPlayerMatches"
import { fetchKnownPlayers } from "@/lib/liga/registration/fetchKnownPlayers"
import { insertRegistration } from "@/lib/liga/registration/insertRegistration"
import { DRAWN_CATEGORY_BLOCK, isCategoryDrawn } from "@/lib/liga/registration/isCategoryDrawn"
import { DEFAULT_MAX_PLAYERS, DEFAULT_MIN_PLAYERS } from "@/lib/liga/registration/availability"
import { buildRegistrationsCsv, statusLabelForCsv, type RegistrationCsvRow } from "@/lib/liga/registration/csv"
import {
  captainChanged,
  categoryChanged,
  describeInfoChanges,
  describePlayerListChanges,
  playerCorrected,
  registrationReopened,
  teamWithdrawn,
  type EditablePlayer,
  type HistoryEvent,
} from "@/lib/liga/registration/history"
import type { DetailCandidate } from "@/app/actions/liga-registrations"

type Result = { success: boolean; error?: string }
const NO_AUTH = "No autorizado"
const GENERIC = "No se pudo guardar el cambio"

type Admin = ReturnType<typeof createAdminClient>

function revalidate() {
  revalidatePath("/panel-liga")
  revalidatePath("/ligas-invierno-verano", "layout")
}

function fail(error: { message?: string } | null | undefined, fallback = GENERIC): Result {
  return { success: false, error: error?.message || fallback }
}

async function getRegistration(supabase: Admin, id: string) {
  const { data } = await supabase
    .from("liga_registrations")
    .select("id, tournament_id, category_id, team_name, captain_phone, notes, status, team_id, categories(name)")
    .eq("id", id)
    .maybeSingle()
  return data as
    | {
        id: string
        tournament_id: string
        category_id: string
        team_name: string
        captain_phone: string
        notes: string | null
        status: "pending" | "approved" | "rejected" | "withdrawn"
        team_id: string | null
        categories: { name: string } | null
      }
    | null
}

// ——— Datos generales ———

const infoSchema = z.object({ teamName: teamNameSchema, captainPhone: captainPhoneSchema, notes: notesSchema })

export async function updateRegistrationInfo(registrationId: string, input: z.input<typeof infoSchema>): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const parsed = infoSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const supabase = createAdminClient()
  const reg = await getRegistration(supabase, registrationId)
  if (!reg) return { success: false, error: "La inscripción no existe" }
  const next = { teamName: parsed.data.teamName.replace(/\s+/g, " "), captainPhone: parsed.data.captainPhone, notes: parsed.data.notes || null }
  const events = describeInfoChanges({ teamName: reg.team_name, captainPhone: reg.captain_phone, notes: reg.notes }, next)
  if (events.length === 0) return { success: true }

  const { error } = await supabase.rpc("update_liga_registration_info", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_team_name: next.teamName,
    p_captain_phone: next.captainPhone,
    p_notes: next.notes,
    p_events: events,
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// ——— Categoría ———

export async function changeRegistrationCategory(registrationId: string, categoryId: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  if (!z.string().uuid().safeParse(categoryId).success) return { success: false, error: "Elegí una categoría" }

  const supabase = createAdminClient()
  const reg = await getRegistration(supabase, registrationId)
  if (!reg) return { success: false, error: "La inscripción no existe" }
  if (reg.category_id === categoryId) return { success: true }

  // Bloqueo del lado del servidor (la RPC también lo chequea): con el cuadro
  // sorteado no se mueve un equipo de categoría.
  if (reg.status === "approved" && ((await isCategoryDrawn(supabase, reg.category_id)) || (await isCategoryDrawn(supabase, categoryId)))) {
    return { success: false, error: DRAWN_CATEGORY_BLOCK }
  }
  const { data: target } = await supabase
    .from("categories")
    .select("name")
    .eq("id", categoryId)
    .eq("tournament_id", reg.tournament_id)
    .maybeSingle()
  if (!target) return { success: false, error: "La categoría no es de esta edición" }

  const { error } = await supabase.rpc("change_liga_registration_category", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_category_id: categoryId,
    p_events: [categoryChanged(reg.categories?.name ?? "—", target.name)],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// ——— Jugadores de una solicitud pendiente ———

const editablePlayersSchema = z
  .array(
    playerSchema.extend({
      id: z.string().uuid().nullable(),
      isCaptain: z.boolean(),
    }),
  )
  .min(1, "Cargá al menos un jugador")
  .max(50, "Demasiados jugadores")
  .superRefine((list, ctx) => {
    if (list.filter((p) => p.isCaptain).length !== 1) {
      ctx.addIssue({ code: "custom", message: "Marcá un capitán (y solo uno)" })
    }
    const seen = new Set<string>()
    list.forEach((p, index) => {
      const dni = normalizeDni(p.dni)
      if (seen.has(dni)) ctx.addIssue({ code: "custom", path: [index, "dni"], message: "Este DNI está repetido en la inscripción" })
      seen.add(dni)
    })
  })

export type EditablePlayerInput = z.input<typeof editablePlayersSchema>[number]

export async function savePendingPlayers(registrationId: string, players: EditablePlayerInput[]): Promise<Result & { fieldErrors?: Record<string, string> }> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const parsed = editablePlayersSchema.safeParse(players)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".")
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message
    }
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos", fieldErrors }
  }

  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from("liga_registration_players")
    .select("id, first_name, last_name, dni, is_captain, sort_order")
    .eq("registration_id", registrationId)
    .order("sort_order")
  const before: EditablePlayer[] = ((current ?? []) as Array<{ id: string; first_name: string; last_name: string; dni: string; is_captain: boolean }>).map((r) => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    dni: r.dni,
    isCaptain: r.is_captain,
  }))
  const after: EditablePlayer[] = parsed.data.map((p) => ({
    id: p.id,
    firstName: p.firstName.replace(/\s+/g, " "),
    lastName: p.lastName.replace(/\s+/g, " "),
    dni: normalizeDni(p.dni),
    isCaptain: p.isCaptain,
  }))
  const events = describePlayerListChanges(before, after)

  const { error } = await supabase.rpc("save_liga_registration_players", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_players: after.map((p) => ({ id: p.id, first_name: p.firstName, last_name: p.lastName, dni: p.dni, is_captain: p.isCaptain })),
    p_events: events,
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// ——— Reabrir / baja ———

export async function reopenRegistration(registrationId: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const supabase = createAdminClient()
  const { error } = await supabase.rpc("reopen_liga_registration", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_events: [registrationReopened()],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

export async function withdrawTeam(registrationId: string, reason?: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const cleanReason = (reason ?? "").trim().slice(0, 300)
  const supabase = createAdminClient()
  const event: HistoryEvent = teamWithdrawn()
  if (cleanReason) event.summary += `. Motivo: ${cleanReason}`
  const { error } = await supabase.rpc("withdraw_liga_team", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_events: [event],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// ——— Plantel de un equipo aprobado ———

export type AddCandidate = DetailCandidate & { inTeam: boolean }
export type AddCheck = {
  success: boolean
  error?: string
  exact: AddCandidate | null
  candidates: AddCandidate[]
}

// Misma validación de la V1 para un jugador que se suma: DNI exacto →
// nombres parecidos → elegir uno o crear nuevo.
export async function checkPlayerToAdd(registrationId: string, input: z.input<typeof playerSchema>): Promise<AddCheck> {
  const actor = await requireAdminActor()
  const empty = { exact: null, candidates: [] }
  if (!actor) return { success: false, error: NO_AUTH, ...empty }
  const parsed = playerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos", ...empty }

  const supabase = createAdminClient()
  const reg = await getRegistration(supabase, registrationId)
  if (!reg || reg.status !== "approved" || !reg.team_id) {
    return { success: false, error: "El plantel se edita una vez aprobada la inscripción", ...empty }
  }
  const dni = normalizeDni(parsed.data.dni)
  const known = await fetchKnownPlayers(supabase)
  const matches = suggestPlayerMatches({ ...parsed.data, dni }, known)

  const ids = [...(matches.exact ? [matches.exact.id] : []), ...matches.candidates.map((c) => c.player.id)]
  const otherTeamByPlayer = new Map<string, string>()
  const inTeam = new Set<string>()
  if (ids.length > 0) {
    const { data } = await supabase
      .from("team_players")
      .select("player_id, team_id, teams!inner(name, category_id)")
      .eq("active", true)
      .eq("teams.active", true)
      .in("player_id", ids)
    for (const m of (data ?? []) as unknown as Array<{ player_id: string; team_id: string; teams: { name: string; category_id: string } }>) {
      if (m.team_id === reg.team_id) inTeam.add(m.player_id)
      else if (m.teams.category_id === reg.category_id) otherTeamByPlayer.set(m.player_id, m.teams.name)
    }
  }
  const toCandidate = (k: { id: string; displayName: string; dni: string | null }, match: DetailCandidate["match"]): AddCandidate => ({
    id: k.id,
    displayName: k.displayName,
    match,
    dniMismatch: k.dni !== null && k.dni !== dni,
    otherTeam: otherTeamByPlayer.get(k.id) ?? null,
    inTeam: inTeam.has(k.id),
  })
  return {
    success: true,
    exact: matches.exact ? toCandidate(matches.exact, "dni") : null,
    candidates: matches.candidates.map((c) => toCandidate(c.player, c.match)),
  }
}

const addPlayerSchema = playerSchema.extend({
  mode: z.enum(["existing", "new"]),
  playerId: z.string().uuid().nullable(),
})

export async function addTeamPlayer(registrationId: string, input: z.input<typeof addPlayerSchema>): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  const parsed = addPlayerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const { mode, playerId } = parsed.data
  if (mode === "existing" && !playerId) return { success: false, error: "Elegí el jugador" }

  const supabase = createAdminClient()
  let displayName = toDisplayName(parsed.data)
  if (mode === "existing") {
    const { data: player } = await supabase.from("players").select("display_name").eq("id", playerId!).maybeSingle()
    if (!player) return { success: false, error: "El jugador no existe" }
    displayName = player.display_name
  }

  const { error } = await supabase.rpc("add_liga_team_player", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_dni: normalizeDni(parsed.data.dni),
    p_mode: mode,
    p_player_id: mode === "existing" ? playerId : null,
    p_events: [{ kind: "player_added", summary: `Se agregó a ${displayName}` }],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

async function displayNameOf(supabase: Admin, playerId: string): Promise<string | null> {
  const { data } = await supabase.from("players").select("display_name").eq("id", playerId).maybeSingle()
  return data?.display_name ?? null
}

export async function removeTeamPlayer(registrationId: string, playerId: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  if (!z.string().uuid().safeParse(playerId).success) return { success: false, error: "Jugador inválido" }
  const supabase = createAdminClient()
  const name = await displayNameOf(supabase, playerId)
  if (!name) return { success: false, error: "El jugador no existe" }
  const { error } = await supabase.rpc("remove_liga_team_player", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_player_id: playerId,
    p_events: [{ kind: "player_removed", summary: `Se quitó a ${name}` }],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

export async function setTeamCaptain(registrationId: string, playerId: string): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  if (!z.string().uuid().safeParse(playerId).success) return { success: false, error: "Jugador inválido" }
  const supabase = createAdminClient()
  const reg = await getRegistration(supabase, registrationId)
  if (!reg?.team_id) return { success: false, error: "La inscripción no tiene equipo" }
  const { data: team } = await supabase.from("teams").select("captain_name").eq("id", reg.team_id).maybeSingle()
  const next = await displayNameOf(supabase, playerId)
  if (!next) return { success: false, error: "El jugador no existe" }
  if (team?.captain_name === next) return { success: true }
  const { error } = await supabase.rpc("set_liga_team_captain", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_player_id: playerId,
    p_events: [captainChanged(team?.captain_name ?? null, next)],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// Corrige nombre / apellido / DNI. La ficha del jugador es una sola (Liga y
// Circuito): la UI avisa antes de guardar.
export async function correctTeamPlayer(registrationId: string, playerId: string, input: z.input<typeof playerSchema>): Promise<Result> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }
  if (!z.string().uuid().safeParse(playerId).success) return { success: false, error: "Jugador inválido" }
  const parsed = playerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const next = { firstName: parsed.data.firstName.replace(/\s+/g, " "), lastName: parsed.data.lastName.replace(/\s+/g, " "), dni: normalizeDni(parsed.data.dni) }
  if (!isValidDni(next.dni)) return { success: false, error: "El DNI tiene que tener 7 u 8 dígitos" }

  const supabase = createAdminClient()
  const [{ data: player }, { data: priv }] = await Promise.all([
    supabase.from("players").select("first_name, last_name, display_name").eq("id", playerId).maybeSingle(),
    supabase.from("player_private").select("dni").eq("player_id", playerId).maybeSingle(),
  ])
  if (!player) return { success: false, error: "El jugador no existe" }
  // Un DNI que ya es de otro jugador no se pisa (la RPC también lo chequea).
  const { data: owner } = await supabase.from("player_private").select("player_id").eq("dni", next.dni).neq("player_id", playerId).maybeSingle()
  if (owner) return { success: false, error: `El DNI ${next.dni} ya es de otro jugador: no se puede pisar.` }

  const before = {
    firstName: player.last_name ? player.first_name : player.display_name,
    lastName: player.last_name ?? "",
    dni: priv?.dni ?? "(sin cargar)",
  }
  const unchanged = before.firstName === next.firstName && before.lastName === next.lastName && before.dni === next.dni
  if (unchanged) return { success: true }
  const event = playerCorrected(before, next)

  const { error } = await supabase.rpc("correct_liga_team_player", {
    p_registration_id: registrationId,
    p_actor: actor,
    p_player_id: playerId,
    p_first_name: next.firstName,
    p_last_name: next.lastName,
    p_dni: next.dni,
    p_events: event ? [event] : [],
  })
  if (error) return fail(error)
  revalidate()
  return { success: true }
}

// ——— Carga manual ———

export type ManualRegistrationResult =
  | { success: true; teamName: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

// Misma validación que el formulario público, pero con guardia admin: puede
// saltear el estado abierto/cerrado y la fecha de cierre. Entra como pendiente.
export async function createManualRegistration(input: unknown): Promise<ManualRegistrationResult> {
  const actor = await requireAdminActor()
  if (!actor) return { success: false, error: NO_AUTH }

  const supabase = createAdminClient()
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, registration_min_players, registration_max_players")
    .eq("status", "active")
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!tournament) return { success: false, error: "No hay una edición activa" }

  const min = tournament.registration_min_players ?? DEFAULT_MIN_PLAYERS
  const max = Math.max(min, tournament.registration_max_players ?? DEFAULT_MAX_PLAYERS)
  const parsed = buildRegistrationSchema({ min, max }).safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".")
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message
    }
    return { success: false, error: "Revisá los datos marcados en el formulario.", fieldErrors }
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .eq("tournament_id", tournament.id)
    .maybeSingle()
  if (!category) {
    return { success: false, error: "Revisá los datos marcados en el formulario.", fieldErrors: { categoryId: "Elegí una categoría válida" } }
  }

  const id = await insertRegistration(supabase, tournament.id, parsed.data, actor, "Se cargó a mano desde el panel")
  if (!id) return { success: false, error: "No se pudo guardar la inscripción. Probá de nuevo." }
  revalidatePath("/panel-liga")
  return { success: true, teamName: parsed.data.teamName }
}

// ——— Exportar a planilla ———

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export async function exportRegistrationsCsv(tournamentId: string): Promise<Result & { csv?: string; filename?: string }> {
  if (!(await requireAdminActor())) return { success: false, error: NO_AUTH }
  if (!z.string().uuid().safeParse(tournamentId).success) return { success: false, error: "Edición inválida" }
  const supabase = createAdminClient()

  const { data: tournament } = await supabase.from("tournaments").select("name, season, slug").eq("id", tournamentId).maybeSingle()
  if (!tournament) return { success: false, error: "La edición no existe" }

  const { data: regs, error } = await supabase
    .from("liga_registrations")
    .select(
      "id, team_name, captain_phone, notes, status, team_id, created_at, categories(name), liga_registration_players(first_name, last_name, dni, is_captain, sort_order)",
    )
    .eq("tournament_id", tournamentId)
  if (error) return { success: false, error: "No se pudo leer las inscripciones" }
  type RegRow = {
    id: string
    team_name: string
    captain_phone: string
    notes: string | null
    status: string
    team_id: string | null
    created_at: string
    categories: { name: string } | null
    liga_registration_players: Array<{ first_name: string; last_name: string; dni: string; is_captain: boolean; sort_order: number }>
  }
  const rows = (regs ?? []) as unknown as RegRow[]

  // Equipos creados: el plantel real (team_players + DNI privado).
  const teamIds = rows.filter((r) => (r.status === "approved" || r.status === "withdrawn") && r.team_id).map((r) => r.team_id as string)
  type TpRow = { team_id: string; player_id: string; is_captain: boolean; active: boolean; players: { first_name: string; last_name: string; display_name: string } | null }
  const tps: TpRow[] = []
  for (const ids of chunk(teamIds, 50)) {
    const { data } = await supabase
      .from("team_players")
      .select("team_id, player_id, is_captain, active, players(first_name, last_name, display_name)")
      .in("team_id", ids)
    tps.push(...((data ?? []) as unknown as TpRow[]))
  }
  const dniById = new Map<string, string>()
  for (const ids of chunk([...new Set(tps.map((t) => t.player_id))], 100)) {
    const { data } = await supabase.from("player_private").select("player_id, dni").in("player_id", ids)
    for (const r of (data ?? []) as Array<{ player_id: string; dni: string }>) dniById.set(r.player_id, r.dni)
  }

  const edition = `${tournament.name} ${tournament.season}`
  const csvRows: RegistrationCsvRow[] = []
  for (const r of rows) {
    const base = {
      edition,
      category: r.categories?.name ?? "",
      team: r.team_name,
      statusLabel: statusLabelForCsv(r.status),
      captainPhone: r.captain_phone,
      notes: r.notes ?? "",
    }
    if ((r.status === "approved" || r.status === "withdrawn") && r.team_id) {
      const members = tps.filter((t) => t.team_id === r.team_id && (r.status === "withdrawn" || t.active))
      for (const m of members) {
        const hasSplit = !!m.players?.last_name
        csvRows.push({
          ...base,
          isCaptain: m.is_captain,
          firstName: hasSplit ? (m.players?.first_name ?? "") : "",
          lastName: hasSplit ? (m.players?.last_name ?? "") : (m.players?.display_name ?? ""),
          dni: dniById.get(m.player_id) ?? "",
        })
      }
    } else {
      for (const p of [...r.liga_registration_players].sort((a, b) => a.sort_order - b.sort_order)) {
        csvRows.push({ ...base, isCaptain: p.is_captain, firstName: p.first_name, lastName: p.last_name, dni: p.dni })
      }
    }
  }
  csvRows.sort(
    (a, b) =>
      a.category.localeCompare(b.category, "es") ||
      a.team.localeCompare(b.team, "es") ||
      Number(b.isCaptain) - Number(a.isCaptain) ||
      a.lastName.localeCompare(b.lastName, "es"),
  )

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date())
  return { success: true, csv: buildRegistrationsCsv(csvRows), filename: `inscripciones-${tournament.slug}-${today}.csv` }
}
