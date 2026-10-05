import { describe, it, expect } from "vitest"
import { generateBracket } from "../generateBracket"
import { buildBracketTree } from "../bracketTree"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import { desiredRepechajeLineCount, repechajeLineCount, repechajeShape, repechajeSources } from "../repechajePlan"
import { emptyRepechaje, get, participants, play, slots, sync, toRows } from "./bracketTestUtils"

const mainFor = (n: number) => toRows(generateBracket(participants(n), CIRCUITO_FORMAT_SPEC), "main")
const start = (n: number) => {
  const ps = participants(n)
  const main = sync("single_elimination", ps, mainFor(n))
  return { ps, rows: sync("single_elimination", ps, [...main, ...emptyRepechaje(main)]) }
}
const step = (ps: ReturnType<typeof participants>, rows: ReturnType<typeof mainFor>, id: string, winner: string) =>
  sync("single_elimination", ps, play(rows, id, winner))

describe("forma del repechaje", () => {
  it.each([
    [8, 4, [2, 1]],
    [9, 8, [4, 2, 1]],
    [10, 8, [4, 2, 1]],
    [12, 8, [4, 2, 1]],
    [16, 8, [4, 2, 1]],
  ])("%i inscriptos → %i lugares", (n, lines, shape) => {
    const sources = repechajeSources(mainFor(n))
    expect(repechajeLineCount(sources.length)).toBe(lines)
    expect(repechajeShape(lines)).toEqual(shape)
  })
})

describe("repechaje por primer partido perdido", () => {
  it("sin bye (8): los perdedores de 1ª ronda van entrando en el lugar de su partido", () => {
    const { ps, rows: r0 } = start(8)
    // 1ª ronda de 8: 1-8 | 4-5 | 3-6 | 2-7
    let rows = step(ps, r0, "main-1-0", "p1")
    expect(slots(get(rows, "repechaje-1-0"))).toEqual(["p8", null])
    rows = step(ps, rows, "main-1-1", "p4")
    expect(slots(get(rows, "repechaje-1-0"))).toEqual(["p8", "p5"])
    rows = step(ps, rows, "main-1-3", "p7")
    expect(slots(get(rows, "repechaje-1-1"))).toEqual([null, "p2"])
  })

  it("el ganador del repechaje avanza", () => {
    const { ps, rows: r0 } = start(8)
    let rows = step(ps, r0, "main-1-0", "p1")
    rows = step(ps, rows, "main-1-1", "p4")
    rows = step(ps, rows, "repechaje-1-0", "p5")
    expect(slots(get(rows, "repechaje-2-0"))[0]).toBe("p5")
  })

  it("con bye (10): quien arrancó con bye y pierde en 2ª ronda entra al repechaje", () => {
    const { ps, rows: r0 } = start(10)
    // R1 real: p8-p9 (main-1-1) y p7-p10 (main-1-6). R2: p1 v W(8-9) (main-2-0).
    let rows = step(ps, r0, "main-1-1", "p8")
    expect(slots(get(rows, "repechaje-1-0"))).toEqual(["p9", null])
    rows = step(ps, rows, "main-2-0", "p8") // gana el que ya había jugado; pierde p1 (venía de bye)
    // p1 es primer partido perdido → entra en la línea del origen main-2-0
    const lines = ["repechaje-1-0", "repechaje-1-1", "repechaje-1-2", "repechaje-1-3"].flatMap((id) => slots(get(rows, id)))
    expect(lines).toContain("p1")
  })

  it("en 2ª ronda, el que ya había ganado su primer partido no entra al repechaje", () => {
    const { ps, rows: r0 } = start(10)
    let rows = step(ps, r0, "main-1-1", "p8")
    rows = step(ps, rows, "main-2-0", "p1") // pierde p8, que ya había jugado
    const all = ["repechaje-1-0", "repechaje-1-1", "repechaje-1-2", "repechaje-1-3"].flatMap((id) => slots(get(rows, id)))
    expect(all).not.toContain("p8")
    expect(all).toContain("p9")
  })

  it("corregir un resultado de 1ª ronda cambia quién está en el repechaje", () => {
    const { ps, rows: r0 } = start(8)
    let rows = step(ps, r0, "main-1-0", "p1")
    expect(slots(get(rows, "repechaje-1-0"))[0]).toBe("p8")
    rows = step(ps, rows, "main-1-0", "p8")
    expect(slots(get(rows, "repechaje-1-0"))[0]).toBe("p1")
  })

  it("un lugar que nunca se va a llenar deja pasar solo a su rival (9: 5 orígenes en 8 lugares)", () => {
    const { ps, rows: r0 } = start(9)
    // Orígenes: main-1-1 (p8-p9) y los 4 partidos de 2ª ronda con bye.
    let rows = step(ps, r0, "main-1-1", "p8")
    const stateOf = (id: string) => slots(get(rows, id))
    expect(stateOf("repechaje-1-0")).toEqual(["p9", null])
    // El 5° origen (main-2-3) lo pierde un jugador que venía de bye → línea 4.
    const m23 = get(rows, "main-2-3")
    rows = step(ps, rows, "main-2-3", m23.participantAId!)
    const loser = m23.participantBId!
    expect(stateOf("repechaje-1-2")).toEqual([loser, null])
    // Las líneas 5-7 son vacías: ese partido no se juega, pasa directo a la 2ª ronda.
    expect(stateOf("repechaje-2-1")[0]).toBe(loser)
  })

  it("un intercambio manual en el repechaje se respeta cuando llegan más perdedores", () => {
    const { ps, rows: r0 } = start(8)
    let rows = step(ps, r0, "main-1-0", "p1") // p8 → línea 0
    rows = step(ps, rows, "main-1-1", "p4") // p5 → línea 1
    rows = step(ps, rows, "main-1-2", "p3") // p6 → línea 2
    // el organizador intercambia p8 (línea 0) con p6 (línea 2)
    rows = rows.map((m) => {
      if (m.id === "repechaje-1-0") return { ...m, participantAId: "p6" }
      if (m.id === "repechaje-1-1") return { ...m, participantAId: "p8" }
      return m
    })
    rows = step(ps, rows, "main-1-3", "p2") // llega p7 → línea 3
    expect(slots(get(rows, "repechaje-1-0"))).toEqual(["p6", "p5"])
    expect(slots(get(rows, "repechaje-1-1"))).toEqual(["p8", "p7"])
  })

  it("si el que se movió deja de ser elegible (se corrige el resultado), vuelve a su lugar natural", () => {
    const { ps, rows: r0 } = start(8)
    let rows = step(ps, r0, "main-1-0", "p1") // p8
    rows = step(ps, rows, "main-1-1", "p4") // p5
    rows = rows.map((m) => (m.id === "repechaje-1-0" ? { ...m, participantAId: "p5", participantBId: "p8" } : m))
    rows = step(ps, rows, "main-1-0", "p8") // ahora pierde p1
    expect(slots(get(rows, "repechaje-1-0")).sort()).toEqual(["p1", "p5"])
  })

  it("principal completo: el repechaje es un cuadro de tamaño justo entre los que perdieron su primer partido", () => {
    for (let n = 8; n <= 24; n++) {
      for (let trial = 0; trial < 4; trial++) {
        const ps = participants(n)
        let rows = sync("single_elimination", ps, mainFor(n))
        const played = new Set<string>()
        const expected = new Set<string>()
        for (let round = 1; round <= 6; round++) {
          for (const m of rows.filter((x) => x.bracket === "main" && x.round === round)) {
            const cur = get(rows, m.id)
            if (!cur.participantAId || !cur.participantBId || cur.winnerId) continue
            const aWins = Math.random() < 0.5
            const winner = aWins ? cur.participantAId : cur.participantBId
            const loser = aWins ? cur.participantBId : cur.participantAId
            if (!played.has(loser)) expected.add(loser)
            played.add(cur.participantAId)
            played.add(cur.participantBId)
            rows = sync("single_elimination", ps, play(rows, cur.id, winner))
          }
        }
        // como lo deja la capa de datos: forma según lo que corresponde ahora
        rows = sync("single_elimination", ps, [...rows.filter((r) => r.bracket === "main"), ...emptyRepechaje(rows)])

        const r1 = rows.filter((r) => r.bracket === "repechaje" && r.round === 1)
        const inR1 = r1.flatMap((r) => slots(r)).filter(Boolean) as string[]
        expect([...inR1].sort()).toEqual([...expected].sort())
        expect(r1.length * 2).toBe(expected.size < 2 ? 0 : 2 ** Math.ceil(Math.log2(expected.size)))

        // cada match de la 1ª ronda con un solo jugador es un bye ya resuelto: ese jugador está en la 2ª ronda
        const r2ids = rows.filter((r) => r.bracket === "repechaje" && r.round === 2).flatMap((r) => slots(r))
        for (const m of r1) {
          const [a, b] = slots(m)
          if (a && !b) expect(r2ids).toContain(a)
        }
      }
    }
  })

  it("12 inscriptos con 6 perdedores de primer partido → cuadro de 8 con 2 byes para los mejores sembrados", () => {
    const ps = participants(12)
    let rows = sync("single_elimination", ps, mainFor(12))
    // R1 real: 4 partidos; ganan los de mejor seed → pierden p9..p12.
    for (const m of rows.filter((x) => x.bracket === "main" && x.round === 1 && x.participantAId && x.participantBId)) {
      rows = sync("single_elimination", ps, play(rows, m.id, m.participantAId!))
    }
    // R2: pierden dos de los que venían de bye (p3 y p4); el resto gana.
    for (const m of rows.filter((x) => x.bracket === "main" && x.round === 2)) {
      const cur = get(rows, m.id)
      const pair = [cur.participantAId!, cur.participantBId!]
      const loser = pair.find((id) => id === "p3" || id === "p4")
      const byeSeedWins = [...pair].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))[0]
      rows = sync("single_elimination", ps, play(rows, cur.id, loser ? pair.find((id) => id !== loser)! : byeSeedWins))
    }
    rows = sync("single_elimination", ps, [...rows.filter((r) => r.bracket === "main"), ...emptyRepechaje(rows)])
    const r1 = rows.filter((r) => r.bracket === "repechaje" && r.round === 1)
    expect(r1).toHaveLength(4)
    const withBye = r1.filter((r) => slots(r).filter(Boolean).length === 1)
    expect(withBye).toHaveLength(2)
    // los byes son para los 2 de mejor seed entre los 6 (p3 y p4)
    expect(withBye.flatMap((r) => slots(r)).filter(Boolean).sort()).toEqual(["p3", "p4"])
  })
})

describe("el repechaje siempre se puede dibujar como cuadro horizontal", () => {
  it("en cualquier momento del torneo (8 a 24 inscriptos, resultados al azar) buildBracketTree arma el árbol", () => {
    const withoutTree: string[] = []
    for (let n = 8; n <= 24; n++) {
      for (let trial = 0; trial < 4; trial++) {
        const ps = participants(n)
        let rows = sync("single_elimination", ps, mainFor(n))
        rows = sync("single_elimination", ps, [...rows, ...emptyRepechaje(rows)])
        for (let round = 1; round <= 6; round++) {
          for (const m of rows.filter((x) => x.bracket === "main" && x.round === round)) {
            const cur = get(rows, m.id)
            if (!cur.participantAId || !cur.participantBId || cur.winnerId) continue
            rows = sync("single_elimination", ps, play(rows, cur.id, Math.random() < 0.5 ? cur.participantAId : cur.participantBId))
            // la capa de datos rehace la forma cuando corresponde
            const rep0 = rows.filter((x) => x.bracket === "repechaje")
            const current = [...new Set(rep0.map((x) => x.round))].sort().map((r) => rep0.filter((x) => x.round === r).length)
            if (JSON.stringify(repechajeShape(desiredRepechajeLineCount(rows))) !== JSON.stringify(current)) {
              rows = sync("single_elimination", ps, [...rows.filter((x) => x.bracket === "main"), ...emptyRepechaje(rows)])
            }
            const input = rows
              .filter((x) => x.bracket === "repechaje")
              .map((r) => ({
                id: r.id, round_number: r.round, position: r.position, participant_a_id: r.participantAId,
                participant_b_id: r.participantBId, score: r.score, winner_id: r.winnerId, status: "pending", is_walkover: false,
              }))
            if (input.length > 0 && !buildBracketTree(input, {}, { fromPanel: true })) withoutTree.push(`N=${n}`)
          }
        }
      }
    }
    expect(withoutTree).toEqual([])
  })
})
