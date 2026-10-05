import { describe, it, expect } from "vitest"
import { clusterDuplicates, compareNames, findSimilarPlayers, nameKey } from "../similarNames"

describe("compareNames", () => {
  it("mismo nombre en otro orden, con acentos, mayúsculas o coma", () => {
    expect(compareNames("Juan Pérez", "perez juan")).toBe("same")
    expect(compareNames("Pérez, Juan", "Juan Perez")).toBe("same")
    expect(compareNames("NICOLAS  DELORTE", "Delorte Nicolás")).toBe("same")
  })

  it("error de tipeo, inicial o apellido de más → parecido", () => {
    expect(compareNames("Nicolas Delorte", "Nicolas Delorde")).toBe("similar")
    expect(compareNames("N. Delorte", "Nicolas Delorte")).toBe("similar")
    expect(compareNames("Juan Perez", "Juan Perez Gomez")).toBe("similar")
  })

  it("personas distintas no coinciden", () => {
    expect(compareNames("Juan Perez", "Juan Gomez")).toBeNull()
    expect(compareNames("Ana Diaz", "Ana Diez")).toBeNull() // palabras cortas: sin tolerancia
    expect(compareNames("Juan", "Juan Perez")).toBeNull() // una sola palabra no alcanza
  })
})

describe("findSimilarPlayers", () => {
  const players = [
    { id: "1", displayName: "Perez Juan" },
    { id: "2", displayName: "Juan Perez Gomez" },
    { id: "3", displayName: "Maria Lopez" },
  ]
  it("ordena primero los de mismas palabras y excluye al propio", () => {
    const found = findSimilarPlayers(players, "Juan Perez")
    expect(found.map((f) => [f.player.id, f.match])).toEqual([["1", "same"], ["2", "similar"]])
    expect(findSimilarPlayers(players, "Perez Juan", "1").map((f) => f.player.id)).toEqual(["2"])
  })
})

describe("clusterDuplicates", () => {
  it("agrupa y distingue los que se pueden unificar solos de los que hay que revisar", () => {
    const players = [
      { id: "a", displayName: "Juan Perez" },
      { id: "b", displayName: "perez, juan" },
      { id: "c", displayName: "Maria Lopez" },
      { id: "d", displayName: "Maria Lopes" },
      { id: "e", displayName: "Pedro Solo" },
    ]
    const clusters = clusterDuplicates(players)
    expect(clusters).toHaveLength(2)
    const same = clusters.find((c) => c.kind === "same")!
    expect(same.players.map((p) => p.id).sort()).toEqual(["a", "b"])
    const similar = clusters.find((c) => c.kind === "similar")!
    expect(similar.players.map((p) => p.id).sort()).toEqual(["c", "d"])
  })

  it("nameKey ignora el orden", () => {
    expect(nameKey("Juan Perez")).toBe(nameKey("Perez, Juan"))
  })
})
