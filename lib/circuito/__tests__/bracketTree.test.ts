import { describe, expect, it } from "vitest"
import { buildBracketTree, type BracketTreeMatchInput, type BracketTreeParticipant } from "../bracketTree"

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
})
