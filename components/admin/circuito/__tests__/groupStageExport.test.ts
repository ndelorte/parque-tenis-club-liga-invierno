import { describe, expect, it } from "vitest"
import { buildGroupStageExport, isGroupFormat, type GroupStageMatchInput } from "../groupStageExport"

type Zone = "A" | "B" | null

let seq = 0
function match(
  round: number,
  position: number,
  a: string | null,
  b: string | null,
  opts: { zone?: Zone; score?: string; winner?: string } = {},
): GroupStageMatchInput {
  const played = !!opts.winner
  return {
    id: `m${++seq}`,
    round_number: round,
    position,
    zone: opts.zone ?? null,
    participant_a_id: a,
    participant_b_id: b,
    score: opts.score ?? null,
    winner_id: opts.winner ?? null,
    status: played ? "played" : "scheduled",
    is_walkover: false,
  }
}

function participants(n: number) {
  return Object.fromEntries(
    Array.from({ length: n }, (_, i) => [`p${i + 1}`, { name: `Jugador ${i + 1}`, seed: i + 1 }]),
  )
}

// Todos contra todos entre los ids; gana siempre el de menor número (p1 > p2 > ...).
function roundRobin(ids: string[], zone: Zone, playedCount = Infinity) {
  const out: GroupStageMatchInput[] = []
  let pos = 0
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const played = out.length < playedCount
      out.push(
        match(1, pos++, ids[i], ids[j], { zone, ...(played ? { score: "6-2 6-2", winner: ids[i] } : {}) }),
      )
    }
  }
  return out
}

describe("isGroupFormat", () => {
  it("reconoce los 3 formatos con grupos", () => {
    expect(isGroupFormat("round_robin_with_final")).toBe(true)
    expect(isGroupFormat("round_robin_pure")).toBe(true)
    expect(isGroupFormat("groups_then_knockout")).toBe(true)
  })
  it("no incluye eliminación simple ni importados", () => {
    expect(isGroupFormat("single_elimination")).toBe(false)
    expect(isGroupFormat(null)).toBe(false)
  })
})

describe("buildGroupStageExport — 4 inscriptos (round_robin_with_final)", () => {
  const ids = ["p1", "p2", "p3", "p4"]
  const final = match(2, 0, null, null)

  it("un solo grupo, 2 clasifican y final con cruces escritos", () => {
    const data = buildGroupStageExport("round_robin_with_final", [...roundRobin(ids, null), final], participants(4))
    expect(data.groups).toHaveLength(1)
    expect(data.groups[0].name).toBe("Grupo único")
    expect(data.groups[0].qualifies).toBe(2)
    expect(data.groups[0].total).toBe(6)
    expect(data.knockout).not.toBeNull()
    expect(data.placeholders[final.id]).toEqual(["1º del grupo", "2º del grupo"])
    expect(data.champion).toBeNull()
  })

  it("sin partidos jugados ordena por seed", () => {
    const data = buildGroupStageExport(
      "round_robin_with_final",
      [...roundRobin(["p3", "p1", "p4", "p2"], null, 0), final],
      participants(4),
    )
    expect(data.groups[0].played).toBe(0)
    expect(data.groups[0].rows.map((r) => r.id)).toEqual(["p1", "p2", "p3", "p4"])
  })

  it("ordena por victorias y cuenta jugados", () => {
    // p4 le gana a todos; el resto, p2 > p3 > p1 por tener el mismo score que el motor no define: solo chequeo el líder.
    const ms = [
      match(1, 0, "p1", "p4", { score: "2-6 2-6", winner: "p4" }),
      match(1, 1, "p2", "p4", { score: "2-6 2-6", winner: "p4" }),
      match(1, 2, "p3", "p4", { score: "2-6 2-6", winner: "p4" }),
      match(1, 3, "p1", "p2"),
      match(1, 4, "p1", "p3"),
      match(1, 5, "p2", "p3"),
    ]
    const data = buildGroupStageExport("round_robin_with_final", [...ms, final], participants(4))
    expect(data.groups[0].rows[0].id).toBe("p4")
    expect(data.groups[0].played).toBe(3)
    expect(data.groups[0].total).toBe(6)
  })
})

describe("buildGroupStageExport — 5 inscriptos (round_robin_pure)", () => {
  const ids = ["p1", "p2", "p3", "p4", "p5"]

  it("sin llave y sin campeón si falta algún partido", () => {
    const data = buildGroupStageExport("round_robin_pure", roundRobin(ids, null, 9), participants(5))
    expect(data.knockout).toBeNull()
    expect(data.placeholders).toEqual({})
    expect(data.groups[0].qualifies).toBe(1)
    expect(data.groups[0].played).toBe(9)
    expect(data.groups[0].total).toBe(10)
    expect(data.champion).toBeNull()
  })

  it("campeón = 1º del grupo cuando se jugaron los 10 partidos", () => {
    const data = buildGroupStageExport("round_robin_pure", roundRobin(ids, null), participants(5))
    expect(data.groups[0].played).toBe(10)
    expect(data.champion).toEqual({ id: "p1", name: "Jugador 1" })
    expect(data.groups[0].rows.map((r) => r.id)).toEqual(ids)
  })

  it("sin nada jugado ordena por seed", () => {
    const data = buildGroupStageExport("round_robin_pure", roundRobin(["p5", "p3", "p1", "p4", "p2"], null, 0), participants(5))
    expect(data.groups[0].rows.map((r) => r.id)).toEqual(ids)
    expect(data.champion).toBeNull()
  })
})

describe("buildGroupStageExport — 6-7 inscriptos (groups_then_knockout)", () => {
  const semi1 = match(2, 0, null, null)
  const semi2 = match(2, 1, null, null)
  const final = match(3, 0, null, null)
  const zoneA = roundRobin(["p1", "p3", "p5"], "A")
  const zoneB = roundRobin(["p2", "p4", "p6"], "B", 0)

  it("arma Grupo A y Grupo B, 2 clasifican por grupo", () => {
    const data = buildGroupStageExport("groups_then_knockout", [...zoneA, ...zoneB, semi1, semi2, final], participants(6))
    expect(data.groups.map((g) => g.name)).toEqual(["Grupo A", "Grupo B"])
    expect(data.groups.every((g) => g.qualifies === 2)).toBe(true)
    expect(data.groups.every((g) => g.total === 3)).toBe(true)
    expect(data.champion).toBeNull()
  })

  it("semis cruzadas y final con ganadores de semi", () => {
    const data = buildGroupStageExport("groups_then_knockout", [...zoneA, ...zoneB, semi1, semi2, final], participants(6))
    expect(data.knockout?.rounds).toHaveLength(2)
    expect(data.placeholders[semi1.id]).toEqual(["1º Grupo A", "2º Grupo B"])
    expect(data.placeholders[semi2.id]).toEqual(["1º Grupo B", "2º Grupo A"])
    expect(data.placeholders[final.id]).toEqual(["Ganador semi 1", "Ganador semi 2"])
  })

  it("cada grupo cuenta sus jugados y ordena por victorias o seed", () => {
    const data = buildGroupStageExport("groups_then_knockout", [...zoneA, ...zoneB, semi1, semi2, final], participants(6))
    const [a, b] = data.groups
    expect(a.played).toBe(3)
    expect(a.rows.map((r) => r.id)).toEqual(["p1", "p3", "p5"])
    expect(b.played).toBe(0)
    expect(b.rows.map((r) => r.id)).toEqual(["p2", "p4", "p6"]) // por seed
  })

  it("con 7 inscriptos un grupo tiene 4 jugadores y 6 partidos", () => {
    const four = roundRobin(["p1", "p3", "p5", "p7"], "A", 0)
    const data = buildGroupStageExport("groups_then_knockout", [...four, ...zoneB, semi1, semi2, final], participants(7))
    expect(data.groups[0].rows).toHaveLength(4)
    expect(data.groups[0].total).toBe(6)
    expect(data.groups[1].total).toBe(3)
  })
})
