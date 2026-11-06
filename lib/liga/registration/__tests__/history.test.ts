import { describe, expect, it } from "vitest"
import {
  captainChanged,
  categoryChanged,
  describeInfoChanges,
  describePlayerListChanges,
  playerAdded,
  playerCorrected,
  playerRemoved,
  registrationRejected,
  type EditablePlayer,
} from "../history"

const p = (id: string | null, lastName: string, firstName: string, dni = "30111222", isCaptain = false): EditablePlayer => ({
  id,
  firstName,
  lastName,
  dni,
  isCaptain,
})

describe("textos del historial", () => {
  it("alta y baja con formato Apellido Nombre", () => {
    expect(playerAdded({ firstName: "Juan", lastName: "Pérez" }).summary).toBe("Se agregó a Pérez Juan")
    expect(playerRemoved({ firstName: "Juan", lastName: "Pérez" }).summary).toBe("Se quitó a Pérez Juan")
  })
  it("capitán y categoría", () => {
    expect(captainChanged("Gómez Ana", "Pérez Juan").summary).toBe("Capitán: Gómez Ana → Pérez Juan")
    expect(categoryChanged("Damas B", "Damas A").summary).toBe("Categoría: Damas B → Damas A")
  })
  it("rechazo con y sin motivo", () => {
    expect(registrationRejected(null).summary).toBe("Se rechazó la inscripción")
    expect(registrationRejected("Duplicada").summary).toBe("Se rechazó la inscripción. Motivo: Duplicada")
  })
  it("corrección de nombre y DNI", () => {
    const ev = playerCorrected(
      { firstName: "Juan", lastName: "Perez", dni: "30111222" },
      { firstName: "Juan", lastName: "Pérez", dni: "30111223" },
    )
    expect(ev?.summary).toBe("Se corrigió a Perez Juan: nombre Perez Juan → Pérez Juan, DNI 30111222 → 30111223")
  })
  it("sin cambios no hay evento", () => {
    const same = { firstName: "A", lastName: "B", dni: "30111222" }
    expect(playerCorrected(same, { ...same })).toBeNull()
  })
})

describe("describeInfoChanges", () => {
  const before = { teamName: "A", captainPhone: "111", notes: null }
  it("solo describe lo que cambió", () => {
    expect(describeInfoChanges(before, before)).toEqual([])
    const lines = describeInfoChanges(before, { teamName: "B", captainPhone: "111", notes: "algo" }).map((e) => e.summary)
    expect(lines).toEqual(["Equipo: A → B", "Observaciones: se agregaron"])
  })
})

describe("describePlayerListChanges", () => {
  it("altas, bajas, correcciones y capitán", () => {
    const before = [p("1", "Gómez", "Ana", "30111222", true), p("2", "Paz", "Luz", "30111223")]
    const after = [p("1", "Gómez", "Ana", "30111222"), p("2", "Paz", "Luz", "30999999", true), p(null, "Pérez", "Juan", "30111224")]
    const lines = describePlayerListChanges(before, after).map((e) => e.summary)
    expect(lines).toEqual([
      "Se corrigió a Paz Luz: DNI 30111223 → 30999999",
      "Se agregó a Pérez Juan",
      "Capitán: Gómez Ana → Paz Luz",
    ])
    expect(describePlayerListChanges(before, before)).toEqual([])
    expect(describePlayerListChanges(before, [before[0]]).map((e) => e.summary)).toEqual(["Se quitó a Paz Luz"])
  })
})
