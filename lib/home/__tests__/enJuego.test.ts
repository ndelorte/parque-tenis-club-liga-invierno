import { describe, it, expect } from "vitest"
import {
  buildInterparqueEnJuego,
  buildLigaEnJuego,
  countPlayedCategories,
  firstPendingRegularRound,
  pickCircuitoEdition,
} from "../enJuego"
import type { Tournament } from "@/lib/tournament/types"

function round(round_number: number, statuses: string[], phase: "regular" | "semifinal" = "regular") {
  return { phase, round_number, name: `Fecha ${round_number}`, series: statuses.map((status) => ({ status })) }
}

function tournament(overrides: Partial<Tournament>): Tournament {
  return { id: "t", name: "Liga de Invierno", slug: "liga-invierno-2026", season: 2026, status: "active", ...overrides }
}

describe("firstPendingRegularRound", () => {
  it("devuelve la primera fecha regular con series sin terminar", () => {
    const rounds = [round(1, ["completed", "walkover"]), round(2, ["completed", "scheduled"]), round(3, ["scheduled"])]
    expect(firstPendingRegularRound([rounds])).toBe(2)
  })

  it("con varias categorías toma la más atrasada", () => {
    const a = [round(1, ["completed"]), round(2, ["completed"]), round(3, ["scheduled"])]
    const b = [round(1, ["completed"]), round(2, ["rescheduled"])]
    expect(firstPendingRegularRound([a, b])).toBe(2)
  })

  it("ignora playoffs y series canceladas", () => {
    const rounds = [round(1, ["completed", "cancelled"]), round(1, ["scheduled"], "semifinal")]
    expect(firstPendingRegularRound([rounds])).toBeNull()
  })
})

describe("buildLigaEnJuego", () => {
  it("temporada activa: muestra su fecha en juego", () => {
    const result = buildLigaEnJuego([tournament({})], [[round(1, ["scheduled"])]])
    expect(result).toEqual({ kind: "fecha", title: "Liga de Invierno 2026", slug: "liga-invierno-2026", round: 1 })
  })

  it("temporada activa sin fechas regulares pendientes: playoffs", () => {
    const result = buildLigaEnJuego([tournament({})], [[round(1, ["completed"])]])
    expect(result?.kind).toBe("playoffs")
  })

  it("sin temporada activa: anuncia la próxima", () => {
    const tournaments = [
      tournament({ status: "finished" }),
      tournament({ name: "Liga de Invierno", slug: "liga-invierno-2027", season: 2027, status: "upcoming" }),
      tournament({ name: "Liga de Verano", slug: "liga-verano-2026-2027", season: 2026, status: "upcoming" }),
    ]
    expect(buildLigaEnJuego(tournaments, [])).toEqual({
      kind: "proximamente",
      title: "Liga de Verano 2026/2027",
      slug: "liga-verano-2026-2027",
    })
  })

  it("sin temporada activa ni próxima: nada", () => {
    expect(buildLigaEnJuego([tournament({ status: "finished" })], [])).toBeNull()
  })
})

describe("pickCircuitoEdition", () => {
  const e = (slug: string, month: number, status: "upcoming" | "active" | "finished") => ({ slug, name: slug, year: 2026, month, status })

  it("elige la edición activa", () => {
    expect(pickCircuitoEdition([e("ago", 8, "finished"), e("sep", 9, "active"), e("oct", 10, "upcoming")])?.slug).toBe("sep")
  })

  it("sin activa, la próxima más cercana", () => {
    expect(pickCircuitoEdition([e("nov", 11, "upcoming"), e("oct", 10, "upcoming")])?.slug).toBe("oct")
  })

  it("sin activa ni próxima, la última jugada", () => {
    expect(pickCircuitoEdition([e("jul", 7, "finished"), e("ago", 8, "finished")])?.slug).toBe("ago")
  })
})

describe("countPlayedCategories", () => {
  it("cuenta solo las categorías con cuadro armado", () => {
    expect(countPlayedCategories([{ draw_size: 16 }, { draw_size: null }, { draw_size: 8 }])).toBe(2)
  })
})

describe("buildInterparqueEnJuego", () => {
  it("cuenta jugadores activos y partidos jugados", () => {
    const players = [{ active: true }, { active: true }, { active: false }]
    const matches = [{ status: "completed" }, { status: "scheduled" }, { status: "completed" }]
    expect(buildInterparqueEnJuego(players, matches)).toEqual({ players: 2, matchesPlayed: 2 })
  })
})
