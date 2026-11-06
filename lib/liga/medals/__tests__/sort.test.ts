import { describe, it, expect } from "vitest"
import { sortMedalsRecentFirst } from "../sort"
import type { MedalView } from "../types"

const m = (tournamentSlug: string, season: number, place: 1 | 2 | 3 = 1, categoryName = "Caballeros A"): MedalView => ({
  place, categoryName, categorySlug: categoryName.toLowerCase().replace(/ /g, "-"), tournamentSlug, season,
})

describe("sortMedalsRecentFirst", () => {
  it("ordena de la edición más reciente a la más vieja, intercalando Verano e Invierno", () => {
    const sorted = sortMedalsRecentFirst([
      m("liga-verano-2024-2025", 2024),
      m("liga-invierno-2026", 2026),
      m("liga-invierno-2025", 2025),
      m("liga-verano-2025-2026", 2025),
    ])
    expect(sorted.map((x) => x.tournamentSlug)).toEqual([
      "liga-invierno-2026",
      "liga-verano-2025-2026",
      "liga-invierno-2025",
      "liga-verano-2024-2025",
    ])
  })
  it("en la misma edición, mejor puesto primero, y no muta la entrada", () => {
    const input = [m("liga-invierno-2025", 2025, 3), m("liga-invierno-2025", 2025, 1, "Damas A")]
    const sorted = sortMedalsRecentFirst(input)
    expect(sorted.map((x) => x.place)).toEqual([1, 3])
    expect(input[0].place).toBe(3)
  })
})
