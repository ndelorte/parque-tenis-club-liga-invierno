import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateRankingPoints, type CircuitoBracketMatchResult } from "@/lib/circuito/calculateRankingPoints"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { isGrandSlamMonth } from "@/lib/circuito/pointsTable"
import type { CircuitoParticipant } from "@/lib/circuito/types"
import type { CircuitoParticipantRow } from "./types"

// Único escritor de circuito_ranking_points (patrón calcado de
// lib/data/standings.ts:recalculateAndPersistStandings). Reforzado por
// lib/data/__tests__/circuito-ranking-write-boundary.test.ts.
export async function recalculateAndPersistCircuitRanking(categoryId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: category } = await supabase
    .from("circuito_categories")
    .select("draw_size, edition_id")
    .eq("id", categoryId)
    .maybeSingle()
  if (!category?.draw_size) return

  const rule = selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
  if (!rule) return

  const { data: edition } = await supabase
    .from("circuito_editions")
    .select("month")
    .eq("id", category.edition_id)
    .maybeSingle()
  if (!edition) return

  const { data: participantRows } = await supabase
    .from("circuito_participants")
    .select("*")
    .eq("category_id", categoryId)
  const participantsRaw = (participantRows ?? []) as CircuitoParticipantRow[]
  const participants: CircuitoParticipant[] = participantsRaw.map((p) => ({ id: p.id, seed: p.seed }))
  if (participants.length === 0) return

  const { data: matchRows } = await supabase.from("circuito_matches").select("*").eq("category_id", categoryId)
  const matches: CircuitoBracketMatchResult[] = (matchRows ?? []).map((m) => ({
    bracket: m.bracket,
    round: m.round_number,
    zone: m.zone,
    participantAId: m.participant_a_id,
    participantBId: m.participant_b_id,
    winnerId: m.winner_id,
    score: m.score,
  }))

  const pointsByParticipant = calculateRankingPoints({
    format: rule.format,
    participants,
    matches,
    isGrandSlam: isGrandSlamMonth(edition.month),
  })

  // Un participante de dobles acredita los puntos a los 2 jugadores; el
  // ranking es por jugador (circuito_ranking_points.player_id), no por pareja.
  const pointsByPlayer = new Map<string, number>()
  for (const p of participantsRaw) {
    const points = pointsByParticipant.get(p.id) ?? 0
    if (points === 0) continue
    if (p.player_id) pointsByPlayer.set(p.player_id, points)
    if (p.player_2_id) pointsByPlayer.set(p.player_2_id, points)
  }

  if (pointsByPlayer.size === 0) return

  const rows = [...pointsByPlayer.entries()].map(([playerId, points]) => ({
    playerId,
    categoryId,
    editionId: category.edition_id,
    points,
  }))

  await upsertCircuitoRankingPoints(rows)
}

export interface CircuitoRankingPointsInput {
  playerId: string
  categoryId: string
  editionId: string
  points: number
}

// Único punto de escritura real de circuito_ranking_points — tanto el
// recálculo en vivo (arriba) como el import histórico de Challonge
// (scripts/import-challonge.ts, Sprint C7) pasan por acá, así el invariante
// que reforzamos con circuito-ranking-write-boundary.test.ts sigue siendo
// cierto aunque el import calcule los puntos de otra forma (desde
// final_rank de Challonge en vez de circuito_matches).
export async function upsertCircuitoRankingPoints(rows: CircuitoRankingPointsInput[]): Promise<void> {
  if (rows.length === 0) return
  const supabase = createAdminClient()

  const payload = rows.map((r) => ({
    player_id: r.playerId,
    category_id: r.categoryId,
    edition_id: r.editionId,
    points: r.points,
    computed_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("circuito_ranking_points")
    .upsert(payload, { onConflict: "player_id,category_id,edition_id" })
  if (error) throw new Error(`Error al actualizar el ranking del circuito: ${error.message}`)
}

export interface CircuitoRankingEntry {
  playerId: string
  playerName: string
  points: number
}

export async function getCircuitRanking(editionId: string, categoryId?: string): Promise<CircuitoRankingEntry[]> {
  const supabase = await createClient()
  let query = supabase
    .from("circuito_ranking_points")
    .select("player_id, points, players(display_name)")
    .eq("edition_id", editionId)

  if (categoryId) query = query.eq("category_id", categoryId)

  const { data, error } = await query
  if (error || !data) return []

  const totals = new Map<string, { name: string; points: number }>()
  for (const row of data as unknown as Array<{ player_id: string; points: number; players: { display_name: string } | null }>) {
    const current = totals.get(row.player_id)
    const name = row.players?.display_name ?? "—"
    totals.set(row.player_id, { name, points: (current?.points ?? 0) + row.points })
  }

  return [...totals.entries()]
    .map(([playerId, v]) => ({ playerId, playerName: v.name, points: v.points }))
    .sort((a, b) => b.points - a.points)
}

// Ranking anual de UNA categoría: reglas-circuito-del-parque.md — "el
// ranking anual suma los puntos de TODOS los torneos jugados en el año" (no
// hay esquema de "mejores N", no hay mínimo de torneos). categorySlug es
// obligatorio a propósito: sumar puntos entre categorías distintas no tiene
// sentido competitivo (no existe un ranking "general" cruzando categorías).
// Filtra por slug porque cada edición mensual crea sus propias filas de
// circuito_categories (incluso con el mismo slug) — no hay una categoría
// "canónica" única.
export async function getAnnualCircuitRanking(
  year: number,
  categorySlug: string,
): Promise<CircuitoRankingEntry[]> {
  const supabase = await createClient()
  const query = supabase
    .from("circuito_ranking_points")
    .select("player_id, points, players(display_name), circuito_categories!inner(slug), circuito_editions!inner(year)")
    .eq("circuito_editions.year", year)
    .eq("circuito_categories.slug", categorySlug)

  const { data, error } = await query
  if (error || !data) return []

  const totals = new Map<string, { name: string; points: number }>()
  for (const row of data as unknown as Array<{ player_id: string; points: number; players: { display_name: string } | null }>) {
    const current = totals.get(row.player_id)
    const name = row.players?.display_name ?? "—"
    totals.set(row.player_id, { name, points: (current?.points ?? 0) + row.points })
  }

  return [...totals.entries()]
    .map(([playerId, v]) => ({ playerId, playerName: v.name, points: v.points }))
    .sort((a, b) => b.points - a.points)
}
