import { createPublicClient } from "@/lib/supabase/public"
import { getArgentinaYear, getFinalMasterYearOverride } from "@/lib/final-master/year"
import { pickCurrentFinalMasterEdition } from "@/lib/final-master/currentEdition"
import { getAnnualCircuitRanking } from "@/lib/data/circuito/ranking"
import { getMmCategories } from "@/lib/data/mid-master"
import type { DbMmCategory, DbMmEdition, DbMmParticipant } from "@/lib/data/mid-master/types"
import { FINAL_MASTER_SLUG_PREFIX, finalMasterSlug } from "@/lib/final-master/categories"
import { isDrawComplete, isPlayedMatch, orderByRanking, type FinalMasterEntryRanking } from "@/lib/final-master/draw"

// Lecturas del Final Master. Usa las tablas del Mid Master (ver
// supabase/migrations/018_final_master.sql). El cliente público alcanza: la
// lectura de mid_master_* es pública (RLS, migración 017) y el ranking también.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function supabase(): any {
  return createPublicClient()
}

// La migración 018 no corrió (falta una columna): el panel muestra un aviso.
export class FinalMasterSchemaError extends Error {
  constructor() {
    super("Falta correr la migración 018 (supabase/migrations/018_final_master.sql).")
    this.name = "FinalMasterSchemaError"
  }
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "42703" || /column .* does not exist|player_id|player_2_id/i.test(error.message ?? "")
}

export async function getFinalMasterEdition(year: number): Promise<DbMmEdition | null> {
  const { data, error } = await supabase()
    .from("mid_master_editions")
    .select("*")
    .eq("slug", finalMasterSlug(year))
    .maybeSingle()
  if (error) {
    console.error("[final-master] getFinalMasterEdition:", JSON.stringify(error))
    return null
  }
  return (data as DbMmEdition) ?? null
}

// Edición vigente del Final Master: con override (FINAL_MASTER_YEAR) la de ese
// año; si no, la más reciente no terminada con año >= año AR - 1; si no hay, la
// del año AR (puede ser null). Ver lib/final-master/currentEdition.ts.
export async function getCurrentFinalMasterEdition(): Promise<DbMmEdition | null> {
  const override = getFinalMasterYearOverride()
  if (override !== null) return getFinalMasterEdition(override)
  const { data, error } = await supabase()
    .from("mid_master_editions")
    .select("*")
    .like("slug", `${FINAL_MASTER_SLUG_PREFIX}%`)
  if (error) {
    console.error("[final-master] getCurrentFinalMasterEdition:", JSON.stringify(error))
    return null
  }
  return pickCurrentFinalMasterEdition((data ?? []) as DbMmEdition[], { override: null, arYear: getArgentinaYear() })
}

export interface FinalMasterCategorySummary {
  category: DbMmCategory
  entriesCount: number
  // Hay algo armado (zonas asignadas o partidos), completo o no.
  hasDraw: boolean
  // Armado completo: todos con zona, fixture de zonas, 2 semis y final.
  drawComplete: boolean
  playedMatches: number
}

export async function getFinalMasterCategorySummaries(editionId: string): Promise<FinalMasterCategorySummary[]> {
  const categories = await getMmCategories(editionId)
  if (categories.length === 0) return []
  const ids = categories.map((c) => c.id)

  const [parts, matches, groups] = await Promise.all([
    supabase().from("mid_master_participants").select("category_id, group_name, player_id").in("category_id", ids),
    supabase()
      .from("mid_master_matches")
      .select("category_id, group_id, phase, status, winner_participant_id, score")
      .in("category_id", ids),
    supabase().from("mid_master_groups").select("id, name").in("category_id", ids),
  ])
  if (parts.error) {
    if (isMissingColumn(parts.error)) throw new FinalMasterSchemaError()
    throw new Error(`No se pudieron leer los inscriptos: ${parts.error.message}`)
  }
  if (matches.error) throw new Error(`No se pudieron leer los partidos: ${matches.error.message}`)
  if (groups.error) throw new Error(`No se pudieron leer las zonas: ${groups.error.message}`)

  const partRows = (parts.data ?? []) as Array<{ category_id: string; group_name: string | null }>
  const matchRows = (matches.data ?? []) as Array<{
    category_id: string
    group_id: string | null
    phase: string
    status: string
    winner_participant_id: string | null
    score: string | null
  }>
  const groupName = new Map<string, string>(
    ((groups.data ?? []) as Array<{ id: string; name: string }>).map((g) => [g.id, g.name.trim().toUpperCase()]),
  )

  return categories.map((category) => {
    const ps = partRows.filter((p) => p.category_id === category.id)
    const ms = matchRows.filter((m) => m.category_id === category.id)
    const zoneMatchCounts: Record<string, number> = {}
    for (const m of ms) {
      if (m.group_id === null) continue
      const name = groupName.get(m.group_id)
      if (name) zoneMatchCounts[name] = (zoneMatchCounts[name] ?? 0) + 1
    }
    return {
      category,
      entriesCount: ps.length,
      hasDraw: ps.some((p) => p.group_name !== null) || ms.length > 0,
      drawComplete: isDrawComplete({
        participantZones: ps.map((p) => p.group_name),
        zoneMatchCounts,
        semifinals: ms.filter((m) => m.group_id === null && m.phase === "semifinal").length,
        finals: ms.filter((m) => m.group_id === null && m.phase === "final").length,
      }),
      playedMatches: ms.filter(isPlayedMatch).length,
    }
  })
}

export interface FinalMasterEntry extends FinalMasterEntryRanking {
  name: string
  playerId: string | null
  player2Id: string | null
  seed: number | null
  groupName: string | null
}

// Calcula ranking y orden de los inscriptos a partir de sus filas. Separado de
// la lectura para que la action de sorteo lo use con participantes leídos con
// el cliente admin.
export async function rankFinalMasterEntries(
  participants: DbMmParticipant[],
  categorySlug: string,
  year: number,
  // true (sorteo): si falla la lectura del ranking lanza en vez de tratarlo
  // como "nadie tiene ranking".
  options?: { throwOnError?: boolean },
): Promise<FinalMasterEntry[]> {
  const ranking = await getAnnualCircuitRanking(year, categorySlug, undefined, options)
  const byPlayer = new Map<string, { points: number; position: number }>()
  ranking.entries.forEach((e, i) => byPlayer.set(e.playerId, { points: e.points, position: i + 1 }))

  const entries: FinalMasterEntry[] = participants.map((p) => {
    const found = [p.player_id, p.player_2_id]
      .filter((id): id is string => !!id)
      .map((id) => byPlayer.get(id))
      .filter((r): r is { points: number; position: number } => !!r)
    return {
      id: p.id,
      name: p.name,
      playerId: p.player_id ?? null,
      player2Id: p.player_2_id ?? null,
      seed: p.seed ?? null,
      groupName: p.group_name,
      loadOrder: p.display_order ?? 999,
      rankingPoints: found.reduce((sum, r) => sum + r.points, 0),
      rankingPosition: found.length > 0 ? Math.min(...found.map((r) => r.position)) : null,
    }
  })
  return orderByRanking(entries)
}

export async function getFinalMasterEntries(category: DbMmCategory, year: number): Promise<FinalMasterEntry[]> {
  const { data, error } = await supabase()
    .from("mid_master_participants")
    .select("*")
    .eq("category_id", category.id)
    .order("display_order", { ascending: true })
  if (error) {
    if (isMissingColumn(error)) throw new FinalMasterSchemaError()
    throw new Error(`No se pudieron leer los inscriptos: ${error.message}`)
  }
  return rankFinalMasterEntries((data ?? []) as DbMmParticipant[], category.slug, year)
}
