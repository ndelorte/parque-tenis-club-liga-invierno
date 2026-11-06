import { describe, expect, it } from "vitest"
import { isValidDni, normalizeDni } from "../normalizeDni"

describe("normalizeDni", () => {
  it("saca puntos, espacios y guiones", () => {
    expect(normalizeDni("12.345.678")).toBe("12345678")
    expect(normalizeDni(" 12 345 678 ")).toBe("12345678")
    expect(normalizeDni("12-345-678")).toBe("12345678")
  })

  it("valida 7 u 8 dígitos", () => {
    expect(isValidDni("1.234.567")).toBe(true)
    expect(isValidDni("12.345.678")).toBe(true)
    expect(isValidDni("123456")).toBe(false)
    expect(isValidDni("123456789")).toBe(false)
    expect(isValidDni("12a45678")).toBe(false)
    expect(isValidDni("")).toBe(false)
  })
})
