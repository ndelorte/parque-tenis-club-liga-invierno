import { describe, expect, it } from "vitest"
import { pairDisplayName, surnameOf } from "../pairDisplayName"

describe("surnameOf", () => {
  it("toma la primera palabra", () => expect(surnameOf("Michel Juan Pablo")).toBe("Michel"))
  it("une partículas", () => {
    expect(surnameOf("De La Iglesia Santiago")).toBe("De La Iglesia")
    expect(surnameOf("Van Der Berg Ana")).toBe("Van Der")
    expect(surnameOf("del Valle Pedro")).toBe("del Valle")
  })
  it("una palabra queda igual", () => {
    expect(surnameOf("Gaston")).toBe("Gaston")
    expect(surnameOf("Rosende")).toBe("Rosende")
    expect(surnameOf("De")).toBe("De")
  })
  it("excepciones Nombre Apellido, sin distinguir mayúsculas", () => {
    expect(surnameOf("Silvio Devicenzi")).toBe("Devicenzi")
    expect(surnameOf("marcela manuel")).toBe("Manuel")
    expect(surnameOf("Leandro Castañares")).toBe("Castañares")
    expect(surnameOf("Luciano Castañares")).toBe("Castañares")
  })
  it("vacío", () => expect(surnameOf("  ")).toBe(""))
})

describe("pairDisplayName", () => {
  it("con los dos jugadores", () => {
    expect(
      pairDisplayName({ displayName: "x", player1Name: "Michel Juan", player2Name: "Toro Pedro" }),
    ).toBe("Michel / Toro")
  })
  it("aplica excepciones y partículas", () => {
    expect(
      pairDisplayName({ displayName: "x", player1Name: "Silvio Devicenzi", player2Name: "De La Iglesia Santiago" }),
    ).toBe("Devicenzi / De La Iglesia")
  })
  it("sin ids parte el display_name por /", () => {
    expect(pairDisplayName({ displayName: "Michel Juan / Toro Pedro" })).toBe("Michel / Toro")
  })
  it("lado vacío: muestra lo que hay", () => {
    expect(pairDisplayName({ displayName: "Silvana/" })).toBe("Silvana")
    expect(pairDisplayName({ displayName: "Silvana" })).toBe("Silvana")
    expect(pairDisplayName({ displayName: "Sacchi Carolina" })).toBe("Sacchi")
  })
  it("un solo jugador vinculado cae al display_name", () => {
    expect(pairDisplayName({ displayName: "Michel Juan / Toro Pedro", player1Name: "Michel Juan" })).toBe("Michel / Toro")
  })
})
