import { describe, expect, it } from "vitest"
import { buildRegistrationSchema } from "../schema"

const schema = buildRegistrationSchema({ min: 2, max: 4 })

const player = (n: number) => ({ firstName: `Nombre${n}`, lastName: `Apellido${n}`, dni: `1234567${n}` })
const valid = {
  teamName: "Los Pinos",
  categoryId: "cat-1",
  players: [player(1), player(2), player(3)],
  captainIndex: 0,
  captainPhone: "+54 11 5555-1234",
  notes: "",
  website: "",
}

describe("buildRegistrationSchema", () => {
  it("acepta una inscripción válida", () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it("respeta mínimo y máximo de jugadores", () => {
    expect(schema.safeParse({ ...valid, players: [player(1)] }).success).toBe(false)
    expect(schema.safeParse({ ...valid, players: [1, 2, 3, 4, 5].map(player) }).success).toBe(false)
  })

  it("acepta DNI con puntos pero rechaza largos inválidos", () => {
    const ok = { ...valid, players: [{ ...player(1), dni: "12.345.678" }, player(2)] }
    expect(schema.safeParse(ok).success).toBe(true)
    const bad = { ...valid, players: [{ ...player(1), dni: "123" }, player(2)] }
    expect(schema.safeParse(bad).success).toBe(false)
  })

  it("rechaza DNI repetido aunque tenga otro formato", () => {
    const dup = { ...valid, players: [{ ...player(1), dni: "12.345.671" }, { ...player(2), dni: "12345671" }] }
    const result = schema.safeParse(dup)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues.some((i) => i.path.join(".") === "players.1.dni")).toBe(true)
  })

  it("exige un capitán dentro de la lista", () => {
    expect(schema.safeParse({ ...valid, captainIndex: 3 }).success).toBe(false)
    expect(schema.safeParse({ ...valid, captainIndex: -1 }).success).toBe(false)
  })

  it("exige teléfono válido", () => {
    expect(schema.safeParse({ ...valid, captainPhone: "" }).success).toBe(false)
    expect(schema.safeParse({ ...valid, captainPhone: "abc" }).success).toBe(false)
    expect(schema.safeParse({ ...valid, captainPhone: "123" }).success).toBe(false)
  })

  it("limita el largo de los textos", () => {
    expect(schema.safeParse({ ...valid, teamName: "x".repeat(61) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, notes: "x".repeat(501) }).success).toBe(false)
  })
})
