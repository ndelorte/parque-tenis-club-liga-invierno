import { describe, expect, it } from "vitest"
import { buildBracketTree, type BracketTree, type BracketTreeMatchInput, type BracketTreeParticipant } from "../bracketTree"

const participants: Record<string, BracketTreeParticipant> = {
  p1: { name: "Jugador 1", seed: 1 },
  p2: { name: "Jugador 2", seed: 8 },
  p3: { name: "Jugador 3", seed: 4 },
  p4: { name: "Jugador 4", seed: 5 },
  p5: { name: "Jugador 5", seed: 3 },
  p6: { name: "Jugador 6", seed: 6 },
  p7: { name: "Jugador 7", seed: 2 },
  p8: { name: "Jugador 8", seed: 7 },
}

const participants13: Record<string, BracketTreeParticipant> = {
  ...participants,
  p9: { name: "Jugador 9", seed: null },
  p10: { name: "Jugador 10", seed: null },
  p11: { name: "Jugador 11", seed: null },
  p12: { name: "Jugador 12", seed: null },
  p13: { name: "Jugador 13", seed: null },
}

// Quién avanza de un BracketTreeMatch ya armado: el winnerId, o (bye) el
// único lado presente sin necesidad de winnerId cargado.
function advancerOf(m: { winnerId: string | null; isBye: boolean; a: { id: string } | null }): string | null {
  if (m.winnerId) return m.winnerId
  if (m.isBye) return m.a?.id ?? null
  return null
}

// Para cada partido (r,p) con r>1, quien avanza de (r-1,2p) tiene que ser su
// lado A y quien avanza de (r-1,2p+1) su lado B (mismo chequeo que
// isLinkedByPosition, pero sobre el árbol YA construido — sirve tanto para
// el camino por posiciones como para el reconstruido).
function expectFedByWinners(tree: BracketTree) {
  for (let i = 1; i < tree.rounds.length; i++) {
    const round = tree.rounds[i]
    const prevRound = tree.rounds[i - 1]
    for (const m of round.matches) {
      const feederA = prevRound.matches.find((pm) => pm.position === m.position * 2)
      const feederB = prevRound.matches.find((pm) => pm.position === m.position * 2 + 1)
      if (m.a) expect(feederA && advancerOf(feederA)).toBe(m.a.id)
      if (m.b) expect(feederB && advancerOf(feederB)).toBe(m.b.id)
    }
  }
}

function match(overrides: Partial<BracketTreeMatchInput> & Pick<BracketTreeMatchInput, "id" | "round_number" | "position">): BracketTreeMatchInput {
  return {
    participant_a_id: null,
    participant_b_id: null,
    score: null,
    winner_id: null,
    status: "pending",
    is_walkover: false,
    ...overrides,
  }
}

describe("buildBracketTree", () => {
  it("arma el árbol de un cuadro de 8 sin byes", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "played" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4", winner_id: "p3", score: "6-1 6-2", status: "played" }),
      match({ id: "r1-2", round_number: 1, position: 2, participant_a_id: "p5", participant_b_id: "p6", winner_id: "p5", score: "6-2 6-3", status: "played" }),
      match({ id: "r1-3", round_number: 1, position: 3, participant_a_id: "p7", participant_b_id: "p8", winner_id: "p7", score: "6-3 6-4", status: "played" }),
      match({ id: "r2-0", round_number: 2, position: 0, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-4 6-4", status: "played" }),
      match({ id: "r2-1", round_number: 2, position: 1, participant_a_id: "p5", participant_b_id: "p7", winner_id: "p7", score: "3-6 6-3 7-6", status: "played" }),
      match({ id: "r3-0", round_number: 3, position: 0, participant_a_id: "p1", participant_b_id: "p7", winner_id: "p1", score: "6-4 6-4", status: "played" }),
    ]

    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.rounds.map((r) => r.label)).toEqual(["Cuartos de final", "Semifinales", "Final"])
    expect(tree!.champion).toEqual({ id: "p1", name: "Jugador 1" })
    expect(tree!.finalScore).toBe("6-4 6-4")
    expect(tree!.rounds[0].matches).toHaveLength(4)
    expect(tree!.rounds[1].matches).toHaveLength(2)
    expect(tree!.rounds[2].matches).toHaveLength(1)
  })

  it("marca como bye un partido de 1ª ronda con un solo participante", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: null }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4" }),
      match({ id: "r2-0", round_number: 2, position: 0 }),
    ]
    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.rounds[0].matches[0].isBye).toBe(true)
    expect(tree!.rounds[0].matches[1].isBye).toBe(false)
    // Ronda 2 con un lado vacío (todavía no definido) no es bye.
    expect(tree!.rounds[1].matches[0].isBye).toBe(false)
    expect(tree!.champion).toBeNull()
    expect(tree!.finalScore).toBeNull()
  })

  it("marca W.O. desde is_walkover", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "walkover", is_walkover: true }),
    ]
    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.rounds[0].matches[0].isWalkover).toBe(true)
    expect(tree!.champion).toEqual({ id: "p1", name: "Jugador 1" })
  })

  it("devuelve null si las rondas no tienen huecos consecutivos (falta la ronda 2)", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4" }),
      match({ id: "r3-0", round_number: 3, position: 0 }),
    ]
    expect(buildBracketTree(matches, participants)).toBeNull()
  })

  it("devuelve null si la 1ª ronda no tiene una cantidad potencia de 2 (cuadro de zonas importado)", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p1", participant_b_id: "p3" }),
      match({ id: "r1-2", round_number: 1, position: 2, participant_a_id: "p2", participant_b_id: "p3" }),
    ]
    expect(buildBracketTree(matches, participants)).toBeNull()
  })

  it("devuelve null si una ronda no tiene la mitad exacta de partidos que la anterior", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4" }),
      match({ id: "r1-2", round_number: 1, position: 2, participant_a_id: "p5", participant_b_id: "p6" }),
      match({ id: "r1-3", round_number: 1, position: 3, participant_a_id: "p7", participant_b_id: "p8" }),
      match({ id: "r2-0", round_number: 2, position: 0 }),
      match({ id: "r2-1", round_number: 2, position: 1 }),
      match({ id: "r2-2", round_number: 2, position: 2 }),
    ]
    expect(buildBracketTree(matches, participants)).toBeNull()
  })

  it("devuelve null si hay huecos en las posiciones de una ronda", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2" }),
      match({ id: "r1-1", round_number: 1, position: 2, participant_a_id: "p3", participant_b_id: "p4" }),
    ]
    expect(buildBracketTree(matches, participants)).toBeNull()
  })

  it("devuelve null con lista vacía", () => {
    expect(buildBracketTree([], participants)).toBeNull()
  })

  it("arma el árbol de un cuadro de 16 (etiqueta Octavos de final en la 1ª ronda)", () => {
    const round1 = Array.from({ length: 8 }, (_, i) =>
      match({ id: `r1-${i}`, round_number: 1, position: i, participant_a_id: `p${i}`, participant_b_id: `p${i + 8}` }),
    )
    const round2 = Array.from({ length: 4 }, (_, i) => match({ id: `r2-${i}`, round_number: 2, position: i }))
    const round3 = Array.from({ length: 2 }, (_, i) => match({ id: `r3-${i}`, round_number: 3, position: i }))
    const round4 = [match({ id: "r4-0", round_number: 4, position: 0 })]
    const tree = buildBracketTree([...round1, ...round2, ...round3, ...round4], {})
    expect(tree).not.toBeNull()
    expect(tree!.rounds.map((r) => r.label)).toEqual([
      "Octavos de final",
      "Cuartos de final",
      "Semifinales",
      "Final",
    ])
  })

  it("reconstruye desde los resultados un cuadro de 13 inscriptos estilo Challonge (solo partidos jugados, sin byes, position = orden de la API)", () => {
    // Árbol real (16, 3 byes): p1-bye | p2-p3 | p4-p5 | p6-bye | p7-p8 | p9-p10 | p11-bye | p12-p13
    // r2: p1-p2(w:p1) | p4-p6(w:p4) | p7-p9(w:p7) | p11-p12(w:p11)
    // r3: p1-p4(w:p1) | p7-p11(w:p7)
    // final: p1-p7(w:p1)
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-a", round_number: 1, position: 0, participant_a_id: "p12", participant_b_id: "p13", winner_id: "p12", score: "6-2 6-3", status: "played" }),
      match({ id: "r1-b", round_number: 1, position: 1, participant_a_id: "p2", participant_b_id: "p3", winner_id: "p2", score: "6-1 6-0", status: "played" }),
      match({ id: "r1-c", round_number: 1, position: 2, participant_a_id: "p9", participant_b_id: "p10", winner_id: "p9", score: "6-4 6-2", status: "played" }),
      match({ id: "r1-d", round_number: 1, position: 3, participant_a_id: "p7", participant_b_id: "p8", winner_id: "p7", score: "7-6 6-4", status: "played" }),
      match({ id: "r1-e", round_number: 1, position: 4, participant_a_id: "p4", participant_b_id: "p5", winner_id: "p4", score: "6-3 6-3", status: "played" }),
      match({ id: "r2-a", round_number: 2, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-2 6-1", status: "played" }),
      match({ id: "r2-b", round_number: 2, position: 1, participant_a_id: "p11", participant_b_id: "p12", winner_id: "p11", score: "6-4 3-6 7-6", status: "played" }),
      match({ id: "r2-c", round_number: 2, position: 2, participant_a_id: "p7", participant_b_id: "p9", winner_id: "p7", score: "6-3 6-2", status: "played" }),
      match({ id: "r2-d", round_number: 2, position: 3, participant_a_id: "p4", participant_b_id: "p6", winner_id: "p4", score: "6-1 6-1", status: "played" }),
      match({ id: "r3-a", round_number: 3, position: 0, participant_a_id: "p7", participant_b_id: "p11", winner_id: "p7", score: "6-4 6-3", status: "played" }),
      match({ id: "r3-b", round_number: 3, position: 1, participant_a_id: "p1", participant_b_id: "p4", winner_id: "p1", score: "6-2 6-2", status: "played" }),
      match({ id: "r4-a", round_number: 4, position: 0, participant_a_id: "p1", participant_b_id: "p7", winner_id: "p1", score: "6-4 6-3", status: "played" }),
    ]

    const tree = buildBracketTree(matches, participants13)
    expect(tree).not.toBeNull()
    expect(tree!.rounds.map((r) => r.matches.length)).toEqual([8, 4, 2, 1])
    expect(tree!.champion).toEqual({ id: "p1", name: "Jugador 1" })
    expect(tree!.finalScore).toBe("6-4 6-3")

    const byes = tree!.rounds[0].matches.filter((m) => m.isBye)
    expect(byes).toHaveLength(3)
    expect(byes.map((m) => m.a?.id).sort()).toEqual(["p1", "p11", "p6"])
    expect(tree!.rounds[0].matches.filter((m) => !m.isBye)).toHaveLength(5)

    expectFedByWinners(tree!)
  })

  it("detecta el mal enlace por posición en un cuadro de 8 con cantidades correctas pero posiciones mezcladas, y lo reconstruye igual desde los resultados", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "m1", round_number: 1, position: 2, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "played" }),
      match({ id: "m2", round_number: 1, position: 0, participant_a_id: "p3", participant_b_id: "p4", winner_id: "p3", score: "6-1 6-2", status: "played" }),
      match({ id: "m3", round_number: 1, position: 3, participant_a_id: "p5", participant_b_id: "p6", winner_id: "p5", score: "6-2 6-3", status: "played" }),
      match({ id: "m4", round_number: 1, position: 1, participant_a_id: "p7", participant_b_id: "p8", winner_id: "p7", score: "6-3 6-4", status: "played" }),
      match({ id: "m5", round_number: 2, position: 1, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-4 6-4", status: "played" }),
      match({ id: "m6", round_number: 2, position: 0, participant_a_id: "p7", participant_b_id: "p5", winner_id: "p7", score: "3-6 6-3 7-6", status: "played" }),
      match({ id: "m7", round_number: 3, position: 0, participant_a_id: "p1", participant_b_id: "p7", winner_id: "p1", score: "6-4 6-4", status: "played" }),
    ]

    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.champion).toEqual({ id: "p1", name: "Jugador 1" })
    expect(tree!.rounds.map((r) => r.matches.length)).toEqual([4, 2, 1])
    expectFedByWinners(tree!)
  })

  it("arma el árbol de un cuadro nativo del panel (posiciones correctas, byes como partidos) igual que antes", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: null, winner_id: null }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4", winner_id: "p3", score: "6-2 6-3", status: "played" }),
      match({ id: "r2-0", round_number: 2, position: 0, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-4 6-4", status: "played" }),
    ]

    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.rounds[0].matches[0].isBye).toBe(true)
    expect(tree!.champion).toEqual({ id: "p1", name: "Jugador 1" })
    expectFedByWinners(tree!)
  })

  it("un cuadro en curso nativo (rondas futuras sin participantes todavía) sigue funcionando por posiciones", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "played" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4" }),
      match({ id: "r1-2", round_number: 1, position: 2, participant_a_id: "p5", participant_b_id: "p6" }),
      match({ id: "r1-3", round_number: 1, position: 3, participant_a_id: "p7", participant_b_id: "p8" }),
      match({ id: "r2-0", round_number: 2, position: 0 }),
      match({ id: "r2-1", round_number: 2, position: 1 }),
      match({ id: "r3-0", round_number: 3, position: 0 }),
    ]

    const tree = buildBracketTree(matches, participants)
    expect(tree).not.toBeNull()
    expect(tree!.champion).toBeNull()
    expect(tree!.rounds[1].matches[0].a).toBeNull()
    expect(tree!.rounds[1].matches[0].b).toBeNull()
  })

  it("devuelve null con datos inconsistentes: dos partidos en la última ronda (dos finales)", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "played" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4", winner_id: "p3", score: "6-1 6-2", status: "played" }),
      match({ id: "r2-0", round_number: 2, position: 0, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-4 6-4", status: "played" }),
      match({ id: "r2-1", round_number: 2, position: 1, participant_a_id: "p5", participant_b_id: "p6", winner_id: "p5", score: "6-2 6-2", status: "played" }),
    ]
    expect(buildBracketTree(matches, participants)).toBeNull()
  })

  it("devuelve null con datos inconsistentes: un partido real que no alimenta a nadie en la cadena de la final", () => {
    const matches: BracketTreeMatchInput[] = [
      match({ id: "r1-0", round_number: 1, position: 0, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0", status: "played" }),
      match({ id: "r1-1", round_number: 1, position: 1, participant_a_id: "p3", participant_b_id: "p4", winner_id: "p3", score: "6-1 6-2", status: "played" }),
      match({ id: "r1-2", round_number: 1, position: 2, participant_a_id: "p5", participant_b_id: "p6", winner_id: "p5", score: "6-2 6-3", status: "played" }),
      match({ id: "r1-3", round_number: 1, position: 3, participant_a_id: "p7", participant_b_id: "p8", winner_id: "p7", score: "6-3 6-4", status: "played" }),
      // Partido "huérfano": no lo alimenta nadie hacia la final ni sus datos
      // encajan como ronda 1 de un árbol más grande (rompe también la
      // potencia de 2 del camino por posiciones).
      match({ id: "orphan", round_number: 1, position: 4, participant_a_id: "p9", participant_b_id: "p10", winner_id: "p9", score: "6-0 6-0", status: "played" }),
      match({ id: "r2-0", round_number: 2, position: 0, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-4 6-4", status: "played" }),
      match({ id: "r2-1", round_number: 2, position: 1, participant_a_id: "p5", participant_b_id: "p7", winner_id: "p7", score: "3-6 6-3 7-6", status: "played" }),
      match({ id: "r3-0", round_number: 3, position: 0, participant_a_id: "p1", participant_b_id: "p7", winner_id: "p1", score: "6-4 6-4", status: "played" }),
    ]
    expect(buildBracketTree(matches, participants13)).toBeNull()
  })
})
