import { describe, expect, it } from "vitest"
import { suggestPlayerMatches, type KnownPlayer } from "../suggestPlayerMatches"

const known: KnownPlayer[] = [
  { id: "1", displayName: "Pérez Juan", dni: "12345678" },
  { id: "2", displayName: "Gómez María Laura", dni: null },
  { id: "3", displayName: "Kilmunda Nicolas", dni: "30111222" },
]

describe("suggestPlayerMatches", () => {
  it("primero el DNI: match exacto aunque el nombre no se parezca", () => {
    const r = suggestPlayerMatches({ firstName: "Juancito", lastName: "Otro", dni: "12345678" }, known)
    expect(r.exact?.id).toBe("1")
    expect(r.candidates).toEqual([])
  })

  it("ignora los puntos del DNI", () => {
    const r = suggestPlayerMatches({ firstName: "Juan", lastName: "Pérez", dni: "12.345.678" }, known)
    expect(r.exact?.id).toBe("1")
  })

  it("arma el nombre en formato Apellido Nombre", () => {
    const r = suggestPlayerMatches({ firstName: "Ana", lastName: "Lopez", dni: "40111222" }, known)
    expect(r.displayName).toBe("Lopez Ana")
    expect(r.exact).toBeNull()
  })

  it("encuentra 'Nombre Apellido' vs 'Apellido, Nombre' como mismo nombre", () => {
    const r = suggestPlayerMatches({ firstName: "Juan", lastName: "Perez", dni: "99999999" }, [
      { id: "9", displayName: "Pérez, Juan", dni: null },
    ])
    expect(r.candidates[0].match).toBe("same")
    expect(r.candidates[0].dniMismatch).toBe(false)
  })

  it("ignora tildes y mayúsculas", () => {
    const r = suggestPlayerMatches({ firstName: "MARIA LAURA", lastName: "gomez", dni: "40222333" }, known)
    expect(r.candidates[0].player.id).toBe("2")
    expect(r.candidates[0].match).toBe("same")
  })

  it("tolera un error de tipeo (similar)", () => {
    const r = suggestPlayerMatches({ firstName: "Nicolas", lastName: "Klimunda", dni: "30111222".replace("2", "3") }, known)
    expect(r.candidates[0].player.id).toBe("3")
    expect(r.candidates[0].match).toBe("similar")
  })

  it("avisa si el candidato tiene otro DNI guardado", () => {
    const r = suggestPlayerMatches({ firstName: "Nicolas", lastName: "Kilmunda", dni: "30999888" }, known)
    expect(r.exact).toBeNull()
    expect(r.candidates[0].dniMismatch).toBe(true)
  })

  it("sin parecidos devuelve lista vacía", () => {
    const r = suggestPlayerMatches({ firstName: "Zoe", lastName: "Quiroga", dni: "40000000" }, known)
    expect(r.candidates).toEqual([])
  })
})
