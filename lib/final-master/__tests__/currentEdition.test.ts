import { describe, expect, it } from "vitest"
import { pickCurrentFinalMasterEdition } from "../currentEdition"

const ed = (year: number, status: string, slug = `final-master-${year}`) => ({ slug, year, status })

describe("pickCurrentFinalMasterEdition", () => {
  it("con override devuelve la de ese año o null", () => {
    const list = [ed(2026, "active"), ed(2099, "upcoming")]
    expect(pickCurrentFinalMasterEdition(list, { override: 2099, arYear: 2026 })?.year).toBe(2099)
    expect(pickCurrentFinalMasterEdition(list, { override: 2098, arYear: 2026 })).toBeNull()
  })
  it("sin override toma la más reciente no terminada", () => {
    const list = [ed(2025, "active"), ed(2026, "upcoming")]
    expect(pickCurrentFinalMasterEdition(list, { override: null, arYear: 2026 })?.year).toBe(2026)
  })
  it("en enero sigue mostrando la del año anterior si no terminó", () => {
    const list = [ed(2026, "active")]
    expect(pickCurrentFinalMasterEdition(list, { override: null, arYear: 2027 })?.year).toBe(2026)
  })
  it("ignora las terminadas y las demasiado viejas", () => {
    const list = [ed(2026, "finished"), ed(2024, "active")]
    expect(pickCurrentFinalMasterEdition(list, { override: null, arYear: 2027 })).toBeNull()
  })
  it("si no hay abierta, cae a la del año AR (aunque esté terminada)", () => {
    const list = [ed(2026, "finished")]
    expect(pickCurrentFinalMasterEdition(list, { override: null, arYear: 2026 })?.year).toBe(2026)
  })
  it("ignora ediciones que no son Final Master", () => {
    expect(pickCurrentFinalMasterEdition([ed(2026, "active", "mid-master-2026")], { override: null, arYear: 2026 })).toBeNull()
  })
  it("sin override ignora 2099", () => {
    const list = [ed(2026, "active"), ed(2099, "upcoming")]
    expect(pickCurrentFinalMasterEdition(list, { override: null, arYear: 2026 })?.year).toBe(2026)
    expect(pickCurrentFinalMasterEdition([ed(2099, "upcoming")], { override: null, arYear: 2026 })).toBeNull()
  })
  it("con override 2099 la toma", () => {
    const list = [ed(2026, "active"), ed(2099, "upcoming")]
    expect(pickCurrentFinalMasterEdition(list, { override: 2099, arYear: 2026 })?.year).toBe(2099)
  })
})
