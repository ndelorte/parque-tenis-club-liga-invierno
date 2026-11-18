import { afterEach, describe, expect, it, vi } from "vitest"
import { getFinalMasterYear } from "../year"

describe("getFinalMasterYear", () => {
  afterEach(() => vi.unstubAllEnvs())
  const current = new Date().getFullYear()

  it("usa FINAL_MASTER_YEAR si es un entero válido", () => {
    vi.stubEnv("FINAL_MASTER_YEAR", "2099")
    expect(getFinalMasterYear()).toBe(2099)
  })
  it("usa el año actual sin variable", () => {
    vi.stubEnv("FINAL_MASTER_YEAR", "")
    expect(getFinalMasterYear()).toBe(current)
  })
  it.each(["abc", "1999", "2101", "2099.5", " "])("ignora el valor inválido %s", (v) => {
    vi.stubEnv("FINAL_MASTER_YEAR", v)
    expect(getFinalMasterYear()).toBe(current)
  })
})
