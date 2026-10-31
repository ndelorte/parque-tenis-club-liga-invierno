import { describe, it, expect } from "vitest"
import {
  deriveEditionStatus,
  editionLabel,
  editionLastSunday,
  editionSundays,
  formatEditionRange,
  isSunday,
} from "../editions"

describe("editionLabel", () => {
  it("usa ordinales abreviados hasta la 10ma", () => {
    expect(editionLabel(1)).toBe("1ra edición")
    expect(editionLabel(2)).toBe("2da edición")
    expect(editionLabel(3)).toBe("3ra edición")
    expect(editionLabel(4)).toBe("4ta edición")
    expect(editionLabel(5)).toBe("5ta edición")
    expect(editionLabel(6)).toBe("6ta edición")
    expect(editionLabel(7)).toBe("7ma edición")
    expect(editionLabel(8)).toBe("8va edición")
    expect(editionLabel(9)).toBe("9na edición")
    expect(editionLabel(10)).toBe("10ma edición")
  })

  it("de la 11 en adelante usa 'Edición N'", () => {
    expect(editionLabel(11)).toBe("Edición 11")
    expect(editionLabel(25)).toBe("Edición 25")
  })
})

describe("isSunday", () => {
  it("acepta domingos y rechaza otros días o fechas inválidas", () => {
    expect(isSunday("2026-09-06")).toBe(true)
    expect(isSunday("2026-09-07")).toBe(false)
    expect(isSunday("2026-02-30")).toBe(false)
    expect(isSunday("")).toBe(false)
    expect(isSunday("06/09/2026")).toBe(false)
  })
})

describe("editionSundays", () => {
  it("genera domingos consecutivos cruzando el límite de mes", () => {
    expect(editionSundays("2026-09-06", 8)).toEqual([
      "2026-09-06",
      "2026-09-13",
      "2026-09-20",
      "2026-09-27",
      "2026-10-04",
      "2026-10-11",
      "2026-10-18",
      "2026-10-25",
    ])
  })

  it("cruza de año", () => {
    expect(editionSundays("2026-12-20", 3)).toEqual(["2026-12-20", "2026-12-27", "2027-01-03"])
  })

  it("count 0 devuelve vacío", () => {
    expect(editionSundays("2026-09-06", 0)).toEqual([])
  })
})

describe("editionLastSunday", () => {
  it("es el último domingo de la edición", () => {
    expect(editionLastSunday({ start_date: "2026-09-06", sundays_count: 8 })).toBe("2026-10-25")
    expect(editionLastSunday({ start_date: "2026-09-06", sundays_count: 1 })).toBe("2026-09-06")
  })
})

describe("deriveEditionStatus", () => {
  const edition = { start_date: "2026-09-06", sundays_count: 8 }

  it("próxima antes del primer domingo", () => {
    expect(deriveEditionStatus(edition, new Date(2026, 8, 5, 23, 59))).toBe("upcoming")
  })

  it("en juego el primer domingo", () => {
    expect(deriveEditionStatus(edition, new Date(2026, 8, 6, 0, 0))).toBe("active")
  })

  it("en juego durante la edición", () => {
    expect(deriveEditionStatus(edition, new Date(2026, 9, 1, 12))).toBe("active")
  })

  it("el último domingo todavía está en juego", () => {
    expect(deriveEditionStatus(edition, new Date(2026, 9, 25, 23, 59))).toBe("active")
  })

  it("finalizada desde el día siguiente al último domingo", () => {
    expect(deriveEditionStatus(edition, new Date(2026, 9, 26, 0, 0))).toBe("finished")
  })
})

describe("formatEditionRange", () => {
  it("muestra el rango con el año al final", () => {
    expect(formatEditionRange({ start_date: "2026-09-06", sundays_count: 8 })).toBe("6 sep – 25 oct 2026")
  })

  it("repite el año si cruza de año", () => {
    expect(formatEditionRange({ start_date: "2026-12-20", sundays_count: 3 })).toBe("20 dic 2026 – 3 ene 2027")
  })
})
