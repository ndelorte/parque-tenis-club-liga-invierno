import { describe, expect, it } from "vitest"
import { buildBracketTree, type BracketTreeMatchInput } from "../bracketTree"

const participants = {
  p1: { name: "Jugador 1", seed: 1 },
  p2: { name: "Jugador 2", seed: 2 },
}

function finalMatch(overrides: Partial<BracketTreeMatchInput>): BracketTreeMatchInput {
  return {
    id: "f",
    round_number: 1,
    position: 0,
    participant_a_id: "p1",
    participant_b_id: "p2",
    score: null,
    winner_id: null,
    status: "played",
    is_walkover: false,
    ...overrides,
  }
}

describe("buildBracketTree: finalScore desde el lado del campeón", () => {
  it("gana A: el score queda como está guardado", () => {
    const tree = buildBracketTree([finalMatch({ winner_id: "p1", score: "6-4 6-2" })], participants)
    expect(tree!.finalScore).toBe("6-4 6-2")
  })

  it("gana B: el score se invierte", () => {
    const tree = buildBracketTree([finalMatch({ winner_id: "p2", score: "0-6 2-6" })], participants)
    expect(tree!.finalScore).toBe("6-0 6-2")
  })

  it("sin ganador o sin score: null", () => {
    expect(buildBracketTree([finalMatch({})], participants)!.finalScore).toBeNull()
    expect(buildBracketTree([finalMatch({ winner_id: "p2", score: null })], participants)!.finalScore).toBeNull()
  })
})
