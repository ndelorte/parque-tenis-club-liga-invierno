import { describe, expect, it } from "vitest"
import { PARTNER_TBD_LABEL, hasPendingPartner, pairName } from "../partner"

describe("pairName", () => {
  it("une los dos nombres", () => {
    expect(pairName("Ana Pérez", "Luz Gómez")).toBe("Ana Pérez / Luz Gómez")
  })
  it("sin compañero queda 'A confirmar'", () => {
    expect(pairName("Ana Pérez", null)).toBe(`Ana Pérez / ${PARTNER_TBD_LABEL}`)
    expect(pairName("Ana Pérez")).toBe("Ana Pérez / A confirmar")
    expect(pairName("Ana Pérez", "  ")).toBe("Ana Pérez / A confirmar")
  })
})

describe("hasPendingPartner", () => {
  it("detecta parejas sin compañero", () => {
    expect(hasPendingPartner([{ player_2_id: "a" }, { player_2_id: null }])).toBe(true)
    expect(hasPendingPartner([{ player_2_id: "a" }, { player_2_id: "b" }])).toBe(false)
    expect(hasPendingPartner([])).toBe(false)
  })
})
