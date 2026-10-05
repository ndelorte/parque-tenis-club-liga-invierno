import { describe, it, expect } from "vitest"
import { orderRankedCategories } from "../fixedCategories"

describe("orderRankedCategories", () => {
  it("las fijas en su orden de siempre y las agregadas a mano al final", () => {
    const found = [
      { name: "Damas Primera", slug: "damas-primera-single", type: "single" as const },
      { name: "Caballeros Cuarta", slug: "caballeros-cuarta-single", type: "single" as const },
      { name: "Caballeros Primera", slug: "caballeros-primera-single", type: "single" as const },
      { name: "Mixto Primera", slug: "mixto-primera-dobles", type: "dobles" as const },
    ]
    expect(orderRankedCategories(found).map((c) => c.slug)).toEqual([
      "caballeros-primera-single",
      "damas-primera-single",
      "caballeros-cuarta-single",
      "mixto-primera-dobles",
    ])
  })

  it("una categoría nueva con puntos aparece aunque no esté entre las 14 fijas", () => {
    const found = [{ name: "Caballeros Cuarta", slug: "caballeros-cuarta-single", type: "single" as const }]
    expect(orderRankedCategories(found)).toHaveLength(1)
  })
})
