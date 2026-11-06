import { describe, expect, it } from "vitest"
import { canMarkCourtWalkover, validateCourtWalkovers } from "../courtWalkoverRule"

describe("canMarkCourtWalkover", () => {
  it("solo permite la cancha 3", () => {
    expect(canMarkCourtWalkover(1)).toBe(false)
    expect(canMarkCourtWalkover(2)).toBe(false)
    expect(canMarkCourtWalkover(3)).toBe(true)
  })
})

describe("validateCourtWalkovers", () => {
  it("acepta una serie sin WO", () => {
    expect(validateCourtWalkovers([1, 2, 3].map((n) => ({ courtNumber: n, isWalkover: false })))).toBeNull()
  })
  it("acepta WO en la cancha 3", () => {
    expect(
      validateCourtWalkovers([
        { courtNumber: 1, isWalkover: false },
        { courtNumber: 2, isWalkover: false },
        { courtNumber: 3, isWalkover: true },
      ]),
    ).toBeNull()
  })
  it("rechaza WO en la cancha 1 o 2 con mensaje claro", () => {
    expect(validateCourtWalkovers([{ courtNumber: 1, isWalkover: true }])).toContain("cancha 3")
    expect(validateCourtWalkovers([{ courtNumber: 2, isWalkover: true }])).toContain("cancha 2")
  })
})
