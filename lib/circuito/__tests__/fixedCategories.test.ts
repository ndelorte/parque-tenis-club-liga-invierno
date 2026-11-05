import { describe, it, expect } from "vitest"
import { CIRCUITO_FIXED_CATEGORIES, categorySlug } from "../fixedCategories"

describe("categorySlug", () => {
  it("coincide con el slug de las categorías fijas", () => {
    // "Doble Mixto Intermedia" conserva el slug histórico `mixto-intermedia-dobles`
    // (unificación del 2026-11-05) para no romper URLs ni el agrupado del ranking.
    for (const c of CIRCUITO_FIXED_CATEGORIES.filter((c) => c.slug !== "mixto-intermedia-dobles")) {
      expect(categorySlug(c.name, c.type)).toBe(c.slug)
    }
  })

  it("saca tildes y espacios de más", () => {
    expect(categorySlug("  Caballeros   Cuarta ", "single")).toBe("caballeros-cuarta-single")
    expect(categorySlug("Damás Tercera", "dobles")).toBe("damas-tercera-dobles")
  })

  it("un nombre vacío no genera slug", () => {
    expect(categorySlug("  ", "single")).toBe("")
  })
})
