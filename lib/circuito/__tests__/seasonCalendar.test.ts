import { describe, expect, it } from "vitest"
import { buildSeasonCalendar } from "../seasonCalendar"

describe("buildSeasonCalendar", () => {
  it("devuelve 12 meses en orden, con Grand Slam marcado en 1/5/7/9", () => {
    const months = buildSeasonCalendar([], 2026, 9)
    expect(months).toHaveLength(12)
    expect(months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(months.filter((m) => m.isGrandSlam).map((m) => m.month)).toEqual([1, 5, 7, 9])
  })

  it("mes sin edición cargada queda con edition null (la UI muestra 'A confirmar')", () => {
    const months = buildSeasonCalendar([], 2026, 9)
    expect(months.every((m) => m.edition === null)).toBe(true)
  })

  it("completa la edición del mes correspondiente, filtrando por año", () => {
    const months = buildSeasonCalendar(
      [
        { slug: "us-open-2026", name: "Us Open", month: 9, year: 2026, status: "active" },
        { slug: "us-open-2025", name: "Us Open", month: 9, year: 2025, status: "finished" }, // año distinto, se ignora
        { slug: "china-open-2026", name: "China Open", month: 10, year: 2026, status: "upcoming" },
      ],
      2026,
      9,
    )
    expect(months[8].edition).toEqual({ slug: "us-open-2026", name: "Us Open", status: "active" })
    expect(months[9].edition).toEqual({ slug: "china-open-2026", name: "China Open", status: "upcoming" })
    expect(months[0].edition).toBeNull()
  })

  it("marca isCurrent solo en el mes en curso, tenga o no edición cargada", () => {
    const months = buildSeasonCalendar([], 2026, 3)
    expect(months.filter((m) => m.isCurrent).map((m) => m.month)).toEqual([3])
  })

  it("nombres de mes en español, en orden", () => {
    const months = buildSeasonCalendar([], 2026, 1)
    expect(months[0].monthName).toBe("Enero")
    expect(months[11].monthName).toBe("Diciembre")
  })
})
