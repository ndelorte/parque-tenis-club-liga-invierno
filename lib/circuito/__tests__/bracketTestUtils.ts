// Helpers compartidos por los tests del motor de cuadros: simulan contra
// memoria lo que hace lib/data/circuito (insertar el cuadro, cargar un
// resultado, sincronizar lugares) sin Supabase.
import { desiredRepechajeLineCount, repechajeShape } from "../repechajePlan"
import { computeSlotUpdates, type BracketSlotMatch, type SlotUpdate } from "../syncBracketSlots"
import type { CircuitoBracket, CircuitoParticipant, DrawFormatKind } from "../types"

export function participants(n: number): CircuitoParticipant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seed: i + 1 }))
}

// Mismo volcado que lib/data/circuito/bracket.ts:insertCircuitoBracket.
export function toRows(bracket: CircuitoBracket, bracketType: "main" | "repechaje"): BracketSlotMatch[] {
  return bracket.rounds.flatMap((roundMatches, roundIdx) =>
    roundMatches.map((m, position) => ({
      id: `${bracketType}-${roundIdx + 1}-${position}`,
      bracket: bracketType,
      round: roundIdx + 1,
      position,
      zone: m.group,
      participantAId: m.participantA?.id ?? null,
      participantBId: m.participantB?.id ?? null,
      winnerId: null,
      score: null,
    })),
  )
}

export function apply(matches: BracketSlotMatch[], updates: SlotUpdate[]): BracketSlotMatch[] {
  return matches.map((m) => {
    const u = updates.find((x) => x.matchId === m.id)
    if (!u) return m
    return {
      ...m,
      participantAId: u.participantAId,
      participantBId: u.participantBId,
      ...(u.clearResult ? { winnerId: null, score: null } : {}),
    }
  })
}

export function sync(format: DrawFormatKind, ps: CircuitoParticipant[], matches: BracketSlotMatch[]) {
  return apply(matches, computeSlotUpdates(format, ps, matches))
}

// Carga el resultado de un partido: gana `winnerId` por 6-0 6-0.
export function play(matches: BracketSlotMatch[], id: string, winnerId: string): BracketSlotMatch[] {
  return matches.map((m) => {
    if (m.id !== id) return m
    if (winnerId !== m.participantAId && winnerId !== m.participantBId) {
      throw new Error(`${winnerId} no juega ${id}`)
    }
    return { ...m, winnerId, score: winnerId === m.participantAId ? "6-0 6-0" : "0-6 0-6" }
  })
}

export const get = (matches: BracketSlotMatch[], id: string) => matches.find((m) => m.id === id)!
export const slots = (m: BracketSlotMatch) => [m.participantAId, m.participantBId]

// Filas vacías del repechaje, como las deja lib/data/circuito/bracket.ts:ensureRepechajeStructure.
export function emptyRepechaje(main: BracketSlotMatch[]): BracketSlotMatch[] {
  return repechajeShape(desiredRepechajeLineCount(main)).flatMap((count, roundIdx) =>
    Array.from({ length: count }, (_, position) => ({
      id: `repechaje-${roundIdx + 1}-${position}`,
      bracket: "repechaje" as const,
      round: roundIdx + 1,
      position,
      zone: null,
      participantAId: null,
      participantBId: null,
      winnerId: null,
      score: null,
    })),
  )
}
