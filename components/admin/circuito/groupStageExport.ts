// Arma los datos de la imagen de una categoría con fase de grupos (4, 5 y 6-7
// inscriptos): las tablas de todos contra todos y, si hay, el tramo de
// eliminación (final o semis + final) con los cruces escritos ("1º Grupo A").
// Solo organiza partidos ya generados; el orden de cada grupo sale de
// calculateZoneStandings (mismo desempate que el motor).

import { buildBracketTree, type BracketTree, type BracketTreeMatchInput, type BracketTreeParticipant, type BracketTreeSide } from "@/lib/circuito/bracketTree"
import { calculateZoneStandings, type ZoneMatchResult } from "@/lib/circuito/calculateZoneStandings"
import type { DrawFormatKind } from "@/lib/circuito/types"

export interface GroupStageMatchInput extends BracketTreeMatchInput {
  zone: "A" | "B" | null
}

export interface GroupMatch {
  aId: string
  bId: string
  score: string | null // del lado de A (como se carga en el panel)
  winnerId: string | null
  isWalkover: boolean
}

export interface GroupTable {
  name: string // "Grupo A", "Grupo único"
  rows: BracketTreeSide[] // en orden de posición (o de seed si no se jugó nada)
  matches: GroupMatch[]
  played: number
  total: number
  qualifies: number // cuántos clasifican (se resaltan cuando ya hay partidos jugados)
}

export interface GroupStageExport {
  groups: GroupTable[]
  knockout: BracketTree | null
  // Texto para los lugares todavía sin definir del tramo de eliminación,
  // por id de partido: [lado A, lado B].
  placeholders: Record<string, [string, string]>
  // Solo para todos contra todos sin final (5 inscriptos): 1º del grupo
  // cuando se jugaron todos los partidos.
  champion: { id: string; name: string } | null
}

type GroupFormat = Exclude<DrawFormatKind, "single_elimination">

export function isGroupFormat(format: DrawFormatKind | null): format is GroupFormat {
  return format === "round_robin_with_final" || format === "round_robin_pure" || format === "groups_then_knockout"
}

function buildGroup(
  name: string,
  matches: GroupStageMatchInput[],
  participants: Record<string, BracketTreeParticipant>,
  qualifies: number,
): GroupTable {
  const ids = [...new Set(matches.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id))]
  const results: ZoneMatchResult[] = matches
    .filter((m) => m.winner_id && m.score && m.participant_a_id && m.participant_b_id)
    .map((m) => ({ participantAId: m.participant_a_id!, participantBId: m.participant_b_id!, winnerId: m.winner_id!, score: m.score! }))
  const order = calculateZoneStandings(
    ids.map((id) => ({ id, seed: participants[id]?.seed ?? null })),
    results,
  )
  return {
    name,
    rows: order.map((p) => ({ id: p.id, name: participants[p.id]?.name ?? "?", seed: participants[p.id]?.seed ?? null })),
    matches: matches
      .filter((m) => m.participant_a_id && m.participant_b_id)
      .map((m) => ({
        aId: m.participant_a_id!,
        bId: m.participant_b_id!,
        score: m.score,
        winnerId: m.winner_id,
        isWalkover: m.is_walkover,
      })),
    played: results.length,
    total: (ids.length * (ids.length - 1)) / 2,
    qualifies,
  }
}

export function buildGroupStageExport(
  format: GroupFormat,
  matches: GroupStageMatchInput[],
  participants: Record<string, BracketTreeParticipant>,
): GroupStageExport {
  const zoneMatches = matches.filter((m) => m.round_number === 1)
  const later = matches
    .filter((m) => m.round_number >= 2)
    .map((m) => ({ ...m, round_number: m.round_number - 1 }))
  const knockout = later.length > 0 ? buildBracketTree(later, participants, { fromPanel: true }) : null

  if (format === "groups_then_knockout") {
    const groups = (["A", "B"] as const).map((z) =>
      buildGroup(`Grupo ${z}`, zoneMatches.filter((m) => m.zone === z), participants, 2),
    )
    const placeholders: Record<string, [string, string]> = {}
    if (knockout) {
      const [semis, final] = knockout.rounds
      // Semis cruzadas, como las arma syncBracketSlots: 1ºA–2ºB y 1ºB–2ºA.
      if (semis?.matches[0]) placeholders[semis.matches[0].id] = ["1º Grupo A", "2º Grupo B"]
      if (semis?.matches[1]) placeholders[semis.matches[1].id] = ["1º Grupo B", "2º Grupo A"]
      if (final?.matches[0]) placeholders[final.matches[0].id] = ["Ganador semi 1", "Ganador semi 2"]
    }
    return { groups, knockout, placeholders, champion: null }
  }

  const group = buildGroup("Grupo único", zoneMatches, participants, format === "round_robin_with_final" ? 2 : 1)
  if (format === "round_robin_with_final") {
    const placeholders: Record<string, [string, string]> = {}
    const final = knockout?.rounds[0]?.matches[0]
    if (final) placeholders[final.id] = ["1º del grupo", "2º del grupo"]
    return { groups: [group], knockout, placeholders, champion: null }
  }

  const done = group.total > 0 && group.played === group.total
  const first = group.rows[0]
  return { groups: [group], knockout: null, placeholders: {}, champion: done && first ? { id: first.id, name: first.name } : null }
}
