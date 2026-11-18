import { afterEach, describe, expect, it, vi } from "vitest"
import { getArgentinaYear, getFinalMasterYear, getFinalMasterYearOverride } from "../year"

describe("getFinalMasterYear", () => {
  afterEach(() => vi.unstubAllEnvs())
  const now = new Date("2026-11-18T12:00:00Z")

  it("usa FINAL_MASTER_YEAR si es un entero válido", () => {
    vi.stubEnv("FINAL_MASTER_YEAR", "2099")
    expect(getFinalMasterYear(now)).toBe(2099)
    expect(getFinalMasterYearOverride()).toBe(2099)
  })
  it("usa el año de Argentina sin variable", () => {
    vi.stubEnv("FINAL_MASTER_YEAR", "")
    expect(getFinalMasterYear(now)).toBe(2026)
    expect(getFinalMasterYearOverride()).toBeNull()
  })
  it.each(["abc", "1999", "2101", "2099.5", " "])("ignora el valor inválido %s", (v) => {
    vi.stubEnv("FINAL_MASTER_YEAR", v)
    expect(getFinalMasterYear(now)).toBe(2026)
  })
})

describe("getArgentinaYear", () => {
  it("el 1/1 a las 01:00 UTC todavía es el año anterior en Buenos Aires", () => {
    expect(getArgentinaYear(new Date("2027-01-01T01:00:00Z"))).toBe(2026)
  })
  it("el 1/1 a las 04:00 UTC ya es el año nuevo en Buenos Aires", () => {
    expect(getArgentinaYear(new Date("2027-01-01T04:00:00Z"))).toBe(2027)
  })
})
