import { describe, it, expect } from "vitest"
import { generateBracket } from "../generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import { computeSlotUpdates, isPanelGeneratedBracket, type BracketSlotMatch } from "../syncBracketSlots"
import { emptyRepechaje, get, participants, play, slots, sync, toRows } from "./bracketTestUtils"

describe("computeSlotUpdates — eliminación simple", () => {
  // 10 inscriptos → cuadro de 16: 6 byes (seeds 1-6) + 2 partidos reales.
  // 1ª ronda de arriba abajo: 1-bye | 8-9 | 4-bye | 5-bye | 6-bye | 3-bye | 7-10 | 2-bye.
  const ps = participants(10)
  const initial = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")

  it("los byes de 1ª ronda avanzan solos", () => {
    const m = sync("single_elimination", ps, initial)
    expect(slots(get(m, "main-2-0"))).toEqual(["p1", null])
    expect(slots(get(m, "main-2-1"))).toEqual(["p4", "p5"])
    expect(slots(get(m, "main-2-2"))).toEqual(["p6", "p3"])
    expect(slots(get(m, "main-2-3"))).toEqual([null, "p2"])
  })

  it("el ganador de un partido real avanza a su lugar", () => {
    let m = sync("single_elimination", ps, initial)
    m = sync("single_elimination", ps, play(m, "main-1-6", "p7"))
    expect(slots(get(m, "main-2-3"))).toEqual(["p7", "p2"])
  })

  it("corregir un resultado reemplaza al que avanzó y borra en cascada lo que ya había jugado", () => {
    let m = sync("single_elimination", ps, initial)
    m = sync("single_elimination", ps, play(m, "main-1-6", "p7"))
    m = sync("single_elimination", ps, play(m, "main-1-1", "p8"))
    m = sync("single_elimination", ps, play(m, "main-2-3", "p7"))
    m = sync("single_elimination", ps, play(m, "main-2-2", "p3"))
    m = sync("single_elimination", ps, play(m, "main-3-1", "p7"))
    expect(slots(get(m, "main-4-0"))).toEqual([null, "p7"])

    // Se corrige: en realidad ganó p10 en 1ª ronda.
    m = sync("single_elimination", ps, play(m, "main-1-6", "p10"))
    expect(slots(get(m, "main-2-3"))).toEqual(["p10", "p2"])
    expect(get(m, "main-2-3").winnerId).toBeNull()
    expect(slots(get(m, "main-3-1"))).toEqual(["p3", null])
    expect(get(m, "main-3-1").winnerId).toBeNull()
    expect(slots(get(m, "main-4-0"))).toEqual([null, null])
  })

  it("es idempotente: una vez sincronizado no genera más cambios", () => {
    let m = sync("single_elimination", ps, initial)
    m = sync("single_elimination", ps, play(m, "main-1-6", "p7"))
    expect(computeSlotUpdates("single_elimination", ps, m)).toEqual([])
  })
})

describe("computeSlotUpdates — round robin + final (N=4)", () => {
  const ps = participants(4)
  const initial = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
  const zone = initial.filter((m) => m.round === 1)

  // Gana siempre el mejor sembrado → tabla p1, p2, p3, p4.
  function playZoneBySeed(matches: BracketSlotMatch[]) {
    return zone.reduce((acc, z) => play(acc, z.id, z.participantAId!), matches)
  }

  it("la final queda vacía hasta que termina la zona", () => {
    const m = sync("round_robin_with_final", ps, play(initial, zone[0].id, zone[0].participantAId!))
    expect(slots(get(m, "main-2-0"))).toEqual([null, null])
  })

  it("con la zona terminada, la final la juegan los 2 primeros", () => {
    const m = sync("round_robin_with_final", ps, playZoneBySeed(initial))
    expect(slots(get(m, "main-2-0"))).toEqual(["p1", "p2"])
  })

  it("corregir un resultado de zona cambia a los finalistas y borra la final ya jugada", () => {
    let m = sync("round_robin_with_final", ps, playZoneBySeed(initial))
    m = sync("round_robin_with_final", ps, play(m, "main-2-0", "p1"))

    // p3 le ganó a p1 y a p2 → p3 pasa a ser 2° (o 1°) y entra a la final.
    const p1p3 = zone.find((z) => slots(z).includes("p1") && slots(z).includes("p3"))!
    const p2p3 = zone.find((z) => slots(z).includes("p2") && slots(z).includes("p3"))!
    m = play(play(m, p1p3.id, "p3"), p2p3.id, "p3")
    m = sync("round_robin_with_final", ps, m)

    const final = get(m, "main-2-0")
    expect(slots(final)).toContain("p3")
    expect(final.winnerId).toBeNull()
    expect(final.score).toBeNull()
  })
})

describe("computeSlotUpdates — zonas + llave (N=6-7)", () => {
  // Serpentina: zona A = p1, p4, p5; zona B = p2, p3, p6.
  const ps = participants(6)
  const initial = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
  const zoneMatches = initial.filter((m) => m.round === 1)
  const matchBetween = (a: string, b: string) =>
    zoneMatches.find((z) => slots(z).includes(a) && slots(z).includes(b))!

  function playZonesBySeed(matches: BracketSlotMatch[]) {
    return zoneMatches.reduce((acc, z) => play(acc, z.id, z.participantAId!), matches)
  }

  it("con las 2 zonas terminadas arma las semis cruzadas (1°A-2°B, 1°B-2°A)", () => {
    const m = sync("groups_then_knockout", ps, playZonesBySeed(initial))
    expect(slots(get(m, "main-2-0"))).toEqual(["p1", "p3"])
    expect(slots(get(m, "main-2-1"))).toEqual(["p2", "p4"])
    expect(slots(get(m, "main-3-0"))).toEqual([null, null])
  })

  it("con las 2 semis jugadas arma la final", () => {
    let m = sync("groups_then_knockout", ps, playZonesBySeed(initial))
    m = play(play(m, "main-2-0", "p1"), "main-2-1", "p4")
    m = sync("groups_then_knockout", ps, m)
    expect(slots(get(m, "main-3-0"))).toEqual(["p1", "p4"])
  })

  it("corregir un resultado de zona cambia el clasificado, borra su semi y la final", () => {
    let m = sync("groups_then_knockout", ps, playZonesBySeed(initial))
    m = play(play(m, "main-2-0", "p1"), "main-2-1", "p4")
    m = sync("groups_then_knockout", ps, m)
    m = sync("groups_then_knockout", ps, play(m, "main-3-0", "p1"))

    // En realidad p5 le ganó a p4 → zona A: p1, p5, p4.
    m = sync("groups_then_knockout", ps, play(m, matchBetween("p4", "p5").id, "p5"))

    expect(slots(get(m, "main-2-0"))).toEqual(["p1", "p3"])
    expect(get(m, "main-2-0").winnerId).toBe("p1") // esa semi no cambió
    expect(slots(get(m, "main-2-1"))).toEqual(["p2", "p5"])
    expect(get(m, "main-2-1").winnerId).toBeNull()
    expect(slots(get(m, "main-3-0"))).toEqual([null, null])
    expect(get(m, "main-3-0").winnerId).toBeNull()
  })
})

describe("isPanelGeneratedBracket", () => {
  it.each([4, 5, 6, 7, 10])("reconoce el cuadro que arma el motor para %i inscriptos", (n) => {
    const ps = participants(n)
    const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
    expect(isPanelGeneratedBracket(ps, rows, CIRCUITO_FORMAT_SPEC)).toBe(true)
  })

  it("lo sigue reconociendo con resultados cargados, lugares propagados y repechaje", () => {
    const ps = participants(10)
    let m = sync("single_elimination", ps, toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main"))
    m = sync("single_elimination", ps, play(play(m, "main-1-6", "p7"), "main-1-1", "p9"))
    expect(isPanelGeneratedBracket(ps, [...m, ...emptyRepechaje(m)], CIRCUITO_FORMAT_SPEC)).toBe(true)
  })

  it("rechaza un cuadro con otra 1ª ronda (ej. import de Challonge)", () => {
    const ps = participants(4)
    const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
    const swapped = rows.map((r) => (r.id === "main-1-0" ? { ...r, participantAId: r.participantBId, participantBId: r.participantAId } : r))
    expect(isPanelGeneratedBracket(ps, swapped, CIRCUITO_FORMAT_SPEC)).toBe(false)
  })

  it("rechaza un cuadro de eliminación sin filas de bye (así los guarda Challonge)", () => {
    const ps = participants(10)
    const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
      .filter((r) => !(r.round === 1 && !r.participantBId))
    expect(isPanelGeneratedBracket(ps, rows, CIRCUITO_FORMAT_SPEC)).toBe(false)
  })

  it("rechaza categorías con menos de 4 inscriptos (no tienen formato)", () => {
    expect(isPanelGeneratedBracket(participants(3), [], CIRCUITO_FORMAT_SPEC)).toBe(false)
  })
})
