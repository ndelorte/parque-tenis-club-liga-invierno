import { describe, it, expect } from "vitest"
import { searchPlayers } from "../searchPlayers"

const players = [
  { id: "1", displayName: "Nicolás Delorte" },
  { id: "2", displayName: "Martín Gómez" },
  { id: "3", displayName: "Lucía Gomes" },
  { id: "4", displayName: "Ana Delgado" },
  { id: "5", displayName: "Juan Pérez Gómez" },
  { id: "6", displayName: "Rodolfo Ramírez" },
  { id: "7", displayName: "Amanda Ruiz" },
]
const names = (query: string, limit?: number) => searchPlayers(players, query, limit).map((p) => p.displayName)

describe("searchPlayers", () => {
  it("con el texto vacío no sugiere nada", () => {
    expect(names("")).toEqual([])
    expect(names("   ")).toEqual([])
  })

  it("encuentra por apellido a medida que se escribe", () => {
    expect(names("del")).toEqual(["Ana Delgado", "Nicolás Delorte"])
    expect(names("delo")).toEqual(["Nicolás Delorte"])
  })

  it("ignora mayúsculas y acentos", () => {
    expect(names("GOMEZ")).toEqual(["Juan Pérez Gómez", "Martín Gómez"])
    expect(names("nicolas")).toEqual(["Nicolás Delorte"])
  })

  it("acepta varias palabras en cualquier orden", () => {
    expect(names("gomez mar")).toEqual(["Martín Gómez"])
    expect(names("delor nico")).toEqual(["Nicolás Delorte"])
  })

  it("prioriza las palabras que empiezan con lo escrito sobre las que solo lo contienen", () => {
    // "ma" empieza "Martín" y aparece en medio de "Amanda" (que alfabéticamente iría primero)
    expect(names("ma")).toEqual(["Martín Gómez", "Amanda Ruiz"])
  })

  it("respeta el límite de sugerencias", () => {
    expect(names("a", 2)).toHaveLength(2)
  })
})
