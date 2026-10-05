import { describe, it, expect } from "vitest"
import { suggestSurnameFirst } from "../surnameFirst"

const flip = (name: string) => {
  const v = suggestSurnameFirst(name)
  return v.kind === "flip" ? v.suggested : v.kind
}

describe("suggestSurnameFirst", () => {
  it("Nombre Apellido → Apellido Nombre", () => {
    expect(flip("Leonardo Garrido")).toBe("Garrido Leonardo")
    expect(flip("Tomas Galvan")).toBe("Galvan Tomas")
    expect(flip("Santiago Diaz Espada")).toBe("Diaz Espada Santiago")
    expect(flip("Fernando De la Vega")).toBe("De la Vega Fernando")
  })

  it("nombres compuestos van juntos", () => {
    expect(flip("Juan Carlos Travela")).toBe("Travela Juan Carlos")
    expect(flip("Juan Cruz Lara")).toBe("Lara Juan Cruz")
    expect(flip("Cristian Diego Tamburro")).toBe("Tamburro Cristian Diego")
  })

  it("nombres menos comunes y compuestos extranjeros", () => {
    expect(flip("Alejo Arbona")).toBe("Arbona Alejo")
    expect(flip("Jonatan Juarez")).toBe("Juarez Jonatan")
    expect(flip("Joao Paulo Dos Santos")).toBe("Dos Santos Joao Paulo")
  })

  it("lo que ya está Apellido Nombre no se toca", () => {
    expect(flip("Rao Alan")).toBe("ok")
    expect(flip("Salas Martin")).toBe("ok")
    expect(flip("Diaz Espada Santiago")).toBe("ok")
    expect(flip("Del Corral Diego")).toBe("ok")
  })

  it("cuando la primera y la última parecen nombres, se deja para revisar a mano", () => {
    expect(flip("Marcos Lucas")).toBe("ambiguous")
    expect(flip("Federico Ana Paula")).toBe("ambiguous")
  })

  it("una sola palabra", () => {
    expect(flip("Catanni")).toBe("single")
  })
})
