import { describe, expect, it } from "vitest"
import { toWhatsappUrl } from "../toWhatsappUrl"

const OK = "https://wa.me/5491155551234"

describe("toWhatsappUrl", () => {
  it("número nacional sin prefijos", () => {
    expect(toWhatsappUrl("11 5555-1234")).toBe(OK)
    expect(toWhatsappUrl("(11) 5555 1234")).toBe(OK)
  })
  it("quita el 0 inicial", () => {
    expect(toWhatsappUrl("011 5555-1234")).toBe(OK)
  })
  it("quita el 15 (0 + área + 15 + abonado)", () => {
    expect(toWhatsappUrl("011 15 5555-1234")).toBe(OK)
    expect(toWhatsappUrl("11 15 5555 1234")).toBe(OK)
  })
  it("quita el 15 en áreas de 3 y 4 dígitos", () => {
    expect(toWhatsappUrl("0341 15 512-3456")).toBe("https://wa.me/5493415123456")
    expect(toWhatsappUrl("0223 15 512 3456")).toBe("https://wa.me/5492235123456")
    expect(toWhatsappUrl("02954 15 51 2345")).toBe("https://wa.me/5492954512345")
  })
  it("acepta 54 y 549 ya presentes", () => {
    expect(toWhatsappUrl("+54 9 11 5555 1234")).toBe(OK)
    expect(toWhatsappUrl("5491155551234")).toBe(OK)
    expect(toWhatsappUrl("+54 11 5555-1234")).toBe(OK)
    expect(toWhatsappUrl("0054 9 11 5555 1234")).toBe(OK)
  })
  it("devuelve null si no se puede armar", () => {
    expect(toWhatsappUrl("")).toBeNull()
    expect(toWhatsappUrl(null)).toBeNull()
    expect(toWhatsappUrl("abc")).toBeNull()
    expect(toWhatsappUrl("5555-1234")).toBeNull() // sin código de área
    expect(toWhatsappUrl("15 5555 1234")).toBeNull() // 15 sin área
    expect(toWhatsappUrl("+598 99 123 456")).toBeNull() // otro país
    expect(toWhatsappUrl("11 5555 12345678")).toBeNull()
  })
})
