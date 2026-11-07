import { describe, it, expect } from "vitest"
import { isDamasCategory, medalDescription, medalSeasonLabel } from "../label"

describe("medalSeasonLabel", () => {
  it("Verano muestra la temporada partida", () => {
    expect(medalSeasonLabel("liga-verano-2025-2026", 2025)).toBe("Verano 2025/26")
    expect(medalSeasonLabel("liga-verano-2024-2025", 2024)).toBe("Verano 2024/25")
    expect(medalSeasonLabel("liga-verano-2099-2100", 2099)).toBe("Verano 2099/00")
  })
  it("Invierno muestra el año", () => {
    expect(medalSeasonLabel("liga-invierno-2025", 2025)).toBe("Invierno 2025")
  })
  it("slug desconocido: solo el año", () => {
    expect(medalSeasonLabel("otra-liga", 2025)).toBe("2025")
  })
})

describe("isDamasCategory", () => {
  it("detecta Damas por slug o por nombre", () => {
    expect(isDamasCategory({ slug: "damas-a" })).toBe(true)
    expect(isDamasCategory({ name: "Damas B" })).toBe(true)
    expect(isDamasCategory({ name: "DAMAS A" })).toBe(true)
  })
  it("Caballeros y Mixto no", () => {
    expect(isDamasCategory({ slug: "caballeros-a", name: "Caballeros A" })).toBe(false)
    expect(isDamasCategory({ slug: "mixto", name: "Mixto" })).toBe(false)
  })
})

describe("medalDescription", () => {
  const verano = { tournamentSlug: "liga-verano-2025-2026", season: 2025 }
  const invierno = { tournamentSlug: "liga-invierno-2025", season: 2025 }

  it("Caballeros y Mixto, masculino", () => {
    expect(medalDescription({ ...invierno, place: 1, categorySlug: "caballeros-a", categoryName: "Caballeros A" })).toBe("Campeón Invierno 2025")
    expect(medalDescription({ ...verano, place: 2, categorySlug: "mixto-a", categoryName: "Mixto A" })).toBe("Subcampeón Verano 2025/26")
  })
  it("Damas, femenino plural en 1° y 2°", () => {
    expect(medalDescription({ ...verano, place: 1, categorySlug: "damas-a", categoryName: "Damas A" })).toBe("Campeonas Verano 2025/26")
    expect(medalDescription({ ...verano, place: 2, categorySlug: "damas-b", categoryName: "Damas B" })).toBe("Subcampeonas Verano 2025/26")
  })
  it("el 3° puesto no cambia en Damas", () => {
    expect(medalDescription({ ...verano, place: 3, categorySlug: "damas-a", categoryName: "Damas A" })).toBe("3° puesto Verano 2025/26")
    expect(medalDescription({ ...invierno, place: 3, categorySlug: "mixto", categoryName: "Mixto" })).toBe("3° puesto Invierno 2025")
  })
})
