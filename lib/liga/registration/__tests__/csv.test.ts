import { describe, expect, it } from "vitest"
import { buildRegistrationsCsv, escapeCsvCell, neutralizeFormula, statusLabelForCsv, type RegistrationCsvRow } from "../csv"

const row: RegistrationCsvRow = {
  edition: "Liga de Verano 2026/27",
  category: "Damas A",
  team: "Las Ñandú",
  statusLabel: "Aprobada",
  isCaptain: true,
  captainPhone: "+54 9 11 5555-1234",
  firstName: "Ana",
  lastName: "Gómez",
  dni: "30123456",
  notes: "Solo sábados, \"tarde\"\nGracias",
}

describe("buildRegistrationsCsv", () => {
  it("empieza con BOM y encabezados, una fila por jugador, CRLF", () => {
    const csv = buildRegistrationsCsv([row, { ...row, isCaptain: false, firstName: "Luz", lastName: "Paz" }])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split("\r\n")
    expect(lines[0]).toBe("Edición,Categoría,Equipo,Estado,Capitán,Teléfono,Nombre,Apellido,DNI,Observaciones")
    expect(csv).toContain("Las Ñandú")
    expect(csv).toContain(",Sí,")
    expect(csv).toContain(",No,")
    expect(csv.endsWith("\r\n")).toBe(true)
  })
  it("escapa comillas, comas y saltos de línea", () => {
    const csv = buildRegistrationsCsv([row])
    expect(csv).toContain('"Solo sábados, ""tarde""\nGracias"')
  })
  it("sin filas solo trae encabezados", () => {
    expect(buildRegistrationsCsv([]).slice(1).split("\r\n").filter(Boolean)).toHaveLength(1)
  })
})

describe("escapeCsvCell / neutralizeFormula", () => {
  it("deja intactos los teléfonos con +", () => {
    expect(neutralizeFormula("+54 9 11 5555-1234")).toBe("+54 9 11 5555-1234")
  })
  it("neutraliza fórmulas", () => {
    expect(neutralizeFormula("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")")
    expect(neutralizeFormula("@cmd")).toBe("'@cmd")
    expect(neutralizeFormula("-1+2 sumá")).toBe("'-1+2 sumá")
  })
  it("celda con coma va entre comillas", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"')
    expect(escapeCsvCell("simple")).toBe("simple")
  })
})

describe("statusLabelForCsv", () => {
  it("traduce los estados", () => {
    expect(statusLabelForCsv("withdrawn")).toBe("Dada de baja")
    expect(statusLabelForCsv("pending")).toBe("Pendiente")
  })
})
