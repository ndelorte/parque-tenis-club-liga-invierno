import { describe, it, expect } from "vitest"
import { generateBracket } from "../generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import { calculateRankingPoints } from "../calculateRankingPoints"
import { isGrandSlamMonth } from "../pointsTable"
import type { BracketSlotMatch } from "../syncBracketSlots"
import type { CircuitoParticipant, DrawFormatKind } from "../types"
import { participants, play, sync, toRows } from "./bracketTestUtils"

// Flujo completo que corre al cargar cada resultado desde el panel
// (lib/data/circuito/matches.ts:submitCircuitoMatchResult): guardar el
// resultado → sincronizar el cuadro → recalcular puntos. Los valores
// esperados salen de la tabla de reglas-circuito-del-parque.md ("Puntos y
// ranking"), escritos acá a mano — no de pointsTable.ts — para que el test
// compare el código contra la normativa y no contra sí mismo.
const NORMATIVA = {
  grandSlam: { champion: 2000, runnerUp: 1300, semi: 800, quarters: 400, round16: 200, round32plus: 100 },
  normal: { champion: 1000, runnerUp: 650, semi: 400, quarters: 200, round16: 100, round32plus: 50 },
}

const seedOf = (id: string) => Number(id.slice(1))

function points(format: DrawFormatKind, ps: CircuitoParticipant[], matches: BracketSlotMatch[], month: number) {
  return calculateRankingPoints({
    format,
    participants: ps,
    matches: matches.map((m) => ({
      bracket: m.bracket,
      round: m.round,
      zone: m.zone,
      participantAId: m.participantAId,
      participantBId: m.participantBId,
      winnerId: m.winnerId,
      score: m.score,
    })),
    isGrandSlam: isGrandSlamMonth(month),
  })
}

// Carga un resultado y corre la sincronización, como el panel.
function submit(format: DrawFormatKind, ps: CircuitoParticipant[], matches: BracketSlotMatch[], id: string, winner: string) {
  return sync(format, ps, play(matches, id, winner))
}

// Juega todo lo que se pueda jugar, ronda por ronda, ganando siempre el mejor
// sembrado. `rounds` limita hasta qué ronda se juega.
function playAll(format: DrawFormatKind, ps: CircuitoParticipant[], matches: BracketSlotMatch[], rounds = Infinity) {
  let m = sync(format, ps, matches)
  for (;;) {
    const next = m
      .filter((x) => x.bracket === "main" && x.round <= rounds && x.participantAId && x.participantBId && !x.winnerId)
      .sort((x, y) => x.round - y.round)[0]
    if (!next) return m
    const winner = seedOf(next.participantAId!) < seedOf(next.participantBId!) ? next.participantAId! : next.participantBId!
    m = submit(format, ps, m, next.id, winner)
  }
}

// Cuántos jugadores recibió cada cantidad de puntos (sin contar los 0).
function distribution(pts: Map<string, number>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const v of pts.values()) if (v > 0) out[v] = (out[v] ?? 0) + 1
  return out
}

describe("ranking automático — eliminación simple (8+)", () => {
  // 20 inscriptos → cuadro de 32 (5 rondas): 12 byes y 4 partidos reales en 1ª ronda.
  const ps = participants(20)
  const initial = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")

  it("torneo normal completo: cada instancia recibe su puntaje de la normativa", () => {
    const n = NORMATIVA.normal
    const pts = points("single_elimination", ps, playAll("single_elimination", ps, initial), 10)
    expect(pts.get("p1")).toBe(n.champion)
    expect(distribution(pts)).toEqual({
      [n.champion]: 1,
      [n.runnerUp]: 1,
      [n.semi]: 2,
      [n.quarters]: 4,
      [n.round16]: 8,
      [n.round32plus]: 4, // los 4 que pierden en 16vos (1ª ronda)
    })
  })

  it("Grand Slam (mayo) usa la escala mayor", () => {
    const g = NORMATIVA.grandSlam
    const pts = points("single_elimination", ps, playAll("single_elimination", ps, initial), 5)
    expect(distribution(pts)).toEqual({
      [g.champion]: 1,
      [g.runnerUp]: 1,
      [g.semi]: 2,
      [g.quarters]: 4,
      [g.round16]: 8,
      [g.round32plus]: 4,
    })
  })

  it("se actualiza resultado por resultado: tras la 1ª ronda solo puntúan sus perdedores", () => {
    const pts = points("single_elimination", ps, playAll("single_elimination", ps, initial, 1), 10)
    expect(distribution(pts)).toEqual({ [NORMATIVA.normal.round32plus]: 4 })
  })

  it("corregir una semifinal saca los puntos del campeón/subcampeón hasta que se vuelva a jugar la final", () => {
    let m = playAll("single_elimination", ps, initial)
    const semi = m.find((x) => x.round === 4 && x.winnerId === "p1")!
    const rival = semi.participantAId === "p1" ? semi.participantBId! : semi.participantAId!
    m = submit("single_elimination", ps, m, semi.id, rival)

    const pts = points("single_elimination", ps, m, 10)
    expect(pts.get("p1")).toBe(NORMATIVA.normal.semi)
    expect([...pts.values()]).not.toContain(NORMATIVA.normal.champion)
    expect([...pts.values()]).not.toContain(NORMATIVA.normal.runnerUp)

    // Se vuelve a jugar la final, ahora con el rival de p1 en su lugar.
    const final = m.find((x) => x.round === 5)!
    expect([final.participantAId, final.participantBId]).toContain(rival)
    m = submit("single_elimination", ps, m, final.id, rival)
    expect(points("single_elimination", ps, m, 10).get(rival)).toBe(NORMATIVA.normal.champion)
  })
})

describe("ranking automático — formatos de zona", () => {
  it("N=4 (round robin + final): final 1°/2°, los otros 2 → 16vos o más", () => {
    const n = NORMATIVA.normal
    const ps = participants(4)
    const m = playAll("round_robin_with_final", ps, toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main"))
    const pts = points("round_robin_with_final", ps, m, 10)
    expect([1, 2, 3, 4].map((i) => pts.get(`p${i}`))).toEqual([n.champion, n.runnerUp, n.round32plus, n.round32plus])
  })

  it("N=5 (round robin puro): 1° campeón, 2° subcampeón, resto → 16vos o más", () => {
    const n = NORMATIVA.normal
    const ps = participants(5)
    const m = playAll("round_robin_pure", ps, toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main"))
    const pts = points("round_robin_pure", ps, m, 10)
    expect([1, 2, 3, 4, 5].map((i) => pts.get(`p${i}`))).toEqual([
      n.champion,
      n.runnerUp,
      n.round32plus,
      n.round32plus,
      n.round32plus,
    ])
  })

  it("N=7 (zonas + llave, Grand Slam): final, 2 semifinalistas y 3 que no pasan de zona", () => {
    const g = NORMATIVA.grandSlam
    const ps = participants(7)
    const m = playAll("groups_then_knockout", ps, toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main"))
    const pts = points("groups_then_knockout", ps, m, 9)
    expect(pts.get("p1")).toBe(g.champion)
    expect(distribution(pts)).toEqual({ [g.champion]: 1, [g.runnerUp]: 1, [g.semi]: 2, [g.round32plus]: 3 })
  })
})
