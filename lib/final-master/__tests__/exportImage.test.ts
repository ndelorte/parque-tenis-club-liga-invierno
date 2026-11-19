import { describe, expect, it } from "vitest"
import type { DbMmMatch, DbMmParticipant } from "@/lib/data/mid-master/types"
import { PARTNER_TBD_LABEL } from "../partner"
import {
  FM,
  KO_CARD_H,
  buildFinalMasterExport,
  fitPairName,
  formatWhen,
  planLayout,
  type Measure,
} from "../exportImage"

// Cada carácter mide size * 0.5 (itálica un poco más ancha).
const measure: Measure = (t, size, italic) => t.length * size * (italic ? 0.55 : 0.5)
const text = (f: ReturnType<typeof fitPairName>) => f.segments.map((s) => s.text).join("")

describe("fitPairName", () => {
  it("entra sin cambios si hay lugar", () => {
    const f = fitPairName(measure, "Juan Pérez / A confirmar", 500, 20, 12)
    expect(f.size).toBe(20)
    expect(text(f)).toBe("Juan Pérez / A confirmar")
    expect(f.segments[2]).toEqual({ text: PARTNER_TBD_LABEL, tbd: true })
  })

  it("con compañero a confirmar nunca pierde 'A confirmar', aunque no entre", () => {
    for (const max of [400, 250, 160, 120, 90, 60, 30]) {
      for (const left of ["Juan Fernández", "Juan Fernández de la Cruz Altamirano Gómez", "X"]) {
        const f = fitPairName(measure, `${left} / ${PARTNER_TBD_LABEL}`, max, 21, 12)
        const last = f.segments[f.segments.length - 1]
        expect(last).toEqual({ text: PARTNER_TBD_LABEL, tbd: true })
        expect(text(f).endsWith(` / ${PARTNER_TBD_LABEL}`)).toBe(true)
      }
    }
  })

  it("acorta solo el jugador cargado y baja de la fuente mínima si hace falta", () => {
    const long = "Juan Fernández de la Cruz Altamirano"
    const f = fitPairName(measure, `${long} / ${PARTNER_TBD_LABEL}`, 200, 21, 12)
    expect(f.segments[0].text.endsWith("…")).toBe(true)
    expect(joined(f, 200)).toBeLessThanOrEqual(200)
    const tight = fitPairName(measure, `${long} / ${PARTNER_TBD_LABEL}`, 80, 21, 12)
    expect(tight.size).toBeLessThan(12)
    expect(tight.segments[2].text).toBe(PARTNER_TBD_LABEL)
  })

  it("pareja completa: se ven los dos apellidos", () => {
    const f = fitPairName(measure, "Michelángelo Fernández / Toroncolino Pérez", 180, 21, 12)
    const [l, , r] = f.segments
    expect(l.text.length).toBeGreaterThan(1)
    expect(r.text.length).toBeGreaterThan(1)
    expect(r.tbd).toBe(false)
    expect(joined(f, 180)).toBeLessThanOrEqual(180)
  })

  it("single: se recorta con puntos suspensivos", () => {
    const f = fitPairName(measure, "Alejandro Rodríguez Sánchez", 100, 20, 12)
    expect(text(f).endsWith("…")).toBe(true)
  })
})

function joined(f: ReturnType<typeof fitPairName>, _max: number) {
  void _max
  return f.segments.reduce((s, g) => s + measure(g.text, f.size, g.tbd), 0)
}

const p = (id: string, name: string, group: string | null, seed = 1): DbMmParticipant => ({
  id,
  category_id: "c",
  name,
  group_name: group,
  seed,
})
const m = (o: Partial<DbMmMatch>): DbMmMatch => ({
  id: "m",
  category_id: "c",
  group_id: "g",
  phase: "group",
  participant_1_id: null,
  participant_2_id: null,
  winner_participant_id: null,
  scheduled_date: null,
  scheduled_time: null,
  score: null,
  status: "pending",
  ...o,
})

describe("buildFinalMasterExport", () => {
  const parts = [
    p("1", "Ana Gómez / A confirmar", "A"),
    p("2", "Beto Ruiz / Carlos Paz", "A"),
    p("3", "Dani Soto / Eze Vera", "B"),
    p("4", "Fede Lima / Gus Mora", "B"),
  ]
  const input = (knockoutMatches: DbMmMatch[], zA: DbMmMatch[] = [], zB: DbMmMatch[] = []) => ({
    categoryName: "Caballeros 6ª Dobles",
    isDoubles: true,
    zones: [
      { name: "Zona A", participants: parts.slice(0, 2), matches: zA },
      { name: "Zona B", participants: parts.slice(2), matches: zB },
    ],
    knockoutMatches,
    allParticipants: parts,
  })

  it("sin resultados: nombres con A confirmar, nadie resaltado y cruces como placeholders", () => {
    const d = buildFinalMasterExport(input([], [m({ participant_1_id: "1", participant_2_id: "2" })]))
    expect(d.zones[0].rows.map((r) => r.name)).toContain(`Ana Gómez / ${PARTNER_TBD_LABEL}`)
    expect(d.zones[0].started).toBe(false)
    expect(d.zones[0].rows.every((r) => !r.advances)).toBe(true)
    expect(d.semis[0].a).toMatchObject({ name: null, placeholder: "1° Zona A" })
    expect(d.semis[1].b.placeholder).toBe("2° Zona A")
    expect(d.final.a.placeholder).toBe("Ganador semifinal 1")
    expect(d.champion).toBeNull()
  })

  it("con resultados: orden por standings, score por lado, campeón", () => {
    const zA = [m({ participant_1_id: "1", participant_2_id: "2", winner_participant_id: "2", score: "4-6 6-3 3-6", status: "played" })]
    const final = m({
      group_id: null,
      phase: "final",
      participant_1_id: "2",
      participant_2_id: "3",
      winner_participant_id: "3",
      score: "6-4 3-6 7-5",
      status: "played",
      scheduled_date: "2026-12-12",
      scheduled_time: "18:30:00",
    })
    const d = buildFinalMasterExport(input([final], zA))
    expect(d.zones[0].rows[0].participantId).toBe("2")
    expect(d.zones[0].rows[0].advances).toBe(true)
    expect(d.final.a.sets).toEqual(["6", "3", "7"])
    expect(d.final.b.sets).toEqual(["4", "6", "5"])
    expect(d.final.b.isWinner).toBe(true)
    expect(d.final.when).toBe("sáb 12 dic · 18:30 h")
    expect(d.champion).toEqual({ label: "Campeones", name: "Dani Soto / Eze Vera" })
  })

  it("isDoubles se propaga", () => {
    expect(buildFinalMasterExport(input([])).isDoubles).toBe(true)
    expect(buildFinalMasterExport({ ...input([]), isDoubles: false }).isDoubles).toBe(false)
  })

  it("sin partido jugado/walkover no hay ganador ni campeón", () => {
    const final = m({ group_id: null, phase: "final", participant_1_id: "2", participant_2_id: "3", winner_participant_id: "3", status: "pending" })
    const d = buildFinalMasterExport(input([final]))
    expect(d.final.b.isWinner).toBe(false)
    expect(d.champion).toBeNull()
  })

  it("walkover muestra W.O. solo en el ganador", () => {
    const sf = m({ group_id: null, phase: "semifinal", match_order: 1, participant_1_id: "1", participant_2_id: "3", winner_participant_id: "1", status: "walkover" })
    const d = buildFinalMasterExport(input([sf]))
    expect(d.semis[0].a.sets).toEqual(["W.O."])
    expect(d.semis[0].b.sets).toEqual([])
  })
})

describe("formatWhen", () => {
  it("sin fecha no hay texto", () => expect(formatWhen(null, "10:00")).toBeNull())
})

describe("planLayout", () => {
  const formats = { feed: [1016, 1168], square: [1016, 898], story: [1016, 1738] }
  for (const [name, [w, h]] of Object.entries(formats)) {
    for (const champ of [false, true]) {
      it(`${name}${champ ? " con campeón" : ""}: el contenido entra completo`, () => {
        const plan = planLayout(w, h, [4, 4], champ)
        expect(plan.contentH * plan.scale).toBeLessThanOrEqual(h + 0.5)
        expect(plan.natW * plan.scale).toBeLessThanOrEqual(w + 0.5)
        expect(plan.offsetY).toBeGreaterThanOrEqual(0)
        expect(plan.scale).toBeGreaterThan(0.6)
      })
    }
  }
  for (const rows of [[4, 4], [3, 3]]) {
    for (const champ of [false, true]) {
      it(`story ${rows[0]}+${rows[1]}${champ ? " con campeón" : ""}: sin hueco grande arriba`, () => {
        const plan = planLayout(1000, 1738, rows, champ)
        expect(plan.offsetY).toBeLessThanOrEqual(40)
        expect(plan.natW).toBeLessThan(FM.natW)
        expect(plan.scale).toBeGreaterThan(1)
        expect(plan.contentH * plan.scale + plan.offsetY).toBeLessThanOrEqual(1738 + 0.5)
        expect(plan.contentH * plan.scale + plan.offsetY).toBeGreaterThan(1738 - 40)
      })
    }
  }
  it("feed sin huecos grandes y square completo", () => {
    const feed = planLayout(1000, 1168, [4, 4], true)
    expect(feed.contentH * feed.scale + feed.offsetY).toBeGreaterThan(1168 - 40)
    const sq = planLayout(1000, 898, [4, 4], true)
    expect(sq.contentH * sq.scale + sq.offsetY).toBeLessThanOrEqual(898 + 0.5)
  })
  it("zonas de 3 también entran", () => {
    const plan = planLayout(1016, 898, [3, 3], true)
    expect(plan.contentH * plan.scale).toBeLessThanOrEqual(898 + 0.5)
    expect(KO_CARD_H).toBeGreaterThan(0)
  })
})
