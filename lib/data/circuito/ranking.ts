import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateRankingPoints, type CircuitoBracketMatchResult } from "@/lib/circuito/calculateRankingPoints"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { isGrandSlamMonth } from "@/lib/circuito/pointsTable"
import { CIRCUITO_FIXED_CATEGORIES, orderRankedCategories, type RankedCategory } from "@/lib/circuito/fixedCategories"
import { buildAnnualRanking, type AnnualRanking } from "@/lib/circuito/buildAnnualRanking"
import type { CircuitoParticipant } from "@/lib/circuito/types"
import type { SupabaseClient } from "@supabase/supabase-js"
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

  const rows = [...pointsByPlayer.entries()].map(([playerId, points]) => ({
    playerId,
    categoryId,
    editionId: category.edition_id,
    points,
  }))

  await upsertCircuitoRankingPoints(rows)

  // El snapshot de la categoría es exactamente lo que da el recálculo: quien
  // ya no suma (se corrigió un resultado y quedó en 0, o dejó de estar en la
  // categoría) no puede conservar una fila vieja con puntos.
  let staleQuery = supabase.from("circuito_ranking_points").delete().eq("category_id", categoryId)
  if (pointsByPlayer.size > 0) {
    staleQuery = staleQuery.not("player_id", "in", `(${[...pointsByPlayer.keys()].join(",")})`)
  }
  const { error: staleError } = await staleQuery
  if (staleError) throw new Error(`Error al limpiar el ranking del circuito: ${staleError.message}`)
}

// Al unificar dos fichas de la misma persona (lib/players/mergePlayers.ts),
// pasa los puntos de `dropId` a `keepId`. La clave es (jugador, categoría,
// edición): si ambas fichas tienen puntos en el mismo torneo es la misma
// persona anotada dos veces, así que queda el mayor (no se suman: se contaría
// doble). Devuelve cuántas filas movió o descartó.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mergeRankingPoints(db: SupabaseClient<any, any, any>, keepId: string, dropId: string): Promise<number> {
  type Row = { id: string; category_id: string; edition_id: string; points: number }
  const read = async (playerId: string): Promise<Row[]> => {
    const { data, error } = await db
      .from("circuito_ranking_points")
      .select("id, category_id, edition_id, points")
      .eq("player_id", playerId)
    if (error) throw new Error(`Leyendo puntos: ${error.message}`)
    return (data ?? []) as Row[]
  }
  const [dropRows, keepRows] = [await read(dropId), await read(keepId)]

  for (const row of dropRows) {
    const existing = keepRows.find((k) => k.category_id === row.category_id && k.edition_id === row.edition_id)
    if (existing) {
      if (row.points > existing.points) {
        const { error } = await db.from("circuito_ranking_points").update({ points: row.points }).eq("id", existing.id)
        if (error) throw new Error(`Actualizando puntos: ${error.message}`)
      }
      const { error } = await db.from("circuito_ranking_points").delete().eq("id", row.id)
      if (error) throw new Error(`Quitando puntos duplicados: ${error.message}`)
    } else {
      const { error } = await db.from("circuito_ranking_points").update({ player_id: keepId }).eq("id", row.id)
      if (error) throw new Error(`Moviendo puntos: ${error.message}`)
    }
  }
  return dropRows.length
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
// "canónica" única. El orden y el desempate (OQ-38) los resuelve
// lib/circuito/buildAnnualRanking.ts.
// `beforeMonth`: solo cuenta los torneos de meses anteriores (el ranking
// "hasta ese momento", para sortear el cuadro de un torneo sin que cuenten ni
// ese torneo ni los que vienen después).
export async function getAnnualCircuitRanking(
  year: number,
  categorySlug: string,
  beforeMonth?: number,
): Promise<AnnualRanking> {
  const supabase = await createClient()
  const query = supabase
    .from("circuito_ranking_points")
    .select(
      "player_id, edition_id, points, players(display_name), circuito_categories!inner(slug), circuito_editions!inner(year, month, name)",
    )
    .eq("circuito_editions.year", year)
    .eq("circuito_categories.slug", categorySlug)
    .gt("points", 0)
  const { data, error } = await (beforeMonth === undefined ? query : query.lt("circuito_editions.month", beforeMonth))

  if (error || !data) return { entries: [], tournaments: [] }

  type Row = {
    player_id: string
    edition_id: string
    points: number
    players: { display_name: string } | null
    circuito_editions: { month: number; name: string } | null
  }
  return buildAnnualRanking(
    (data as unknown as Row[]).map((r) => ({
      playerId: r.player_id,
      playerName: r.players?.display_name ?? "—",
      editionId: r.edition_id,
      editionName: r.circuito_editions?.name ?? "—",
      month: r.circuito_editions?.month ?? 0,
      points: r.points,
    })),
  )
}

// Slugs de las categorías que tienen al menos un jugador con puntos en el
// ranking del año — las demás no se muestran en /ranking ni en
// /final-master. Un count por categoría (14 consultas livianas en paralelo)
// en vez de traer todas las filas del año: esas superan el límite de 1000
// filas por respuesta de PostgREST a medida que avanza el año.
// Categorías (fijas o agregadas a mano) con algún jugador con puntos en el año.
export async function getCircuitoCategoriesWithRanking(year: number): Promise<RankedCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_ranking_points")
    .select("circuito_categories!inner(name, slug, type), circuito_editions!inner(year)")
    .eq("circuito_editions.year", year)
    .gt("points", 0)
  if (error || !data) return []

  const found = new Map<string, RankedCategory>()
  for (const row of data as unknown as Array<{ circuito_categories: RankedCategory }>) {
    const c = row.circuito_categories
    found.set(c.slug, { name: c.name, slug: c.slug, type: c.type })
  }
  return orderRankedCategories([...found.values()])
}

export async function getCircuitoCategorySlugsWithRanking(year: number): Promise<Set<string>> {
  const supabase = await createClient()
  const slugs = await Promise.all(
    CIRCUITO_FIXED_CATEGORIES.map(async ({ slug }) => {
      const { count, error } = await supabase
        .from("circuito_ranking_points")
        .select("id, circuito_categories!inner(slug), circuito_editions!inner(year)", { count: "exact", head: true })
        .eq("circuito_editions.year", year)
        .eq("circuito_categories.slug", slug)
        .gt("points", 0)
      return !error && (count ?? 0) > 0 ? slug : null
    }),
  )
  return new Set(slugs.filter((slug): slug is string => slug !== null))
}
