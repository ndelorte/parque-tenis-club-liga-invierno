import { describe, it, expect } from "vitest"
import { CIRCUITO_FIXED_CATEGORIES, categorySlug } from "../fixedCategories"

describe("categorySlug", () => {
  it("coincide con el slug de las categorías fijas", () => {
    for (const c of CIRCUITO_FIXED_CATEGORIES) {
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
