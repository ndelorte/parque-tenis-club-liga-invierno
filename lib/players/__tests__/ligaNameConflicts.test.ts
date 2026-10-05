import { describe, it, expect } from "vitest"
import { findLigaNameConflicts } from "../ligaNameConflicts"

const existing = [
  { id: "1", displayName: "Perez Juan" },
  { id: "2", displayName: "Kilmunda Marcos" },
  { id: "3", displayName: "Lopez Maria" },
]

describe("findLigaNameConflicts", () => {
  it("un alta nueva con el nombre al revés o con un error de tipeo se marca", () => {
    const found = findLigaNameConflicts(
      [{ players: [{ playerId: null, displayName: "Juan Perez" }, { playerId: null, displayName: "Marcos Klimunda" }] }],
      existing,
    )
    expect(found.map((f) => [f.playerIndex, f.candidates[0].id, f.isNew])).toEqual([[0, "1", true], [1, "2", true]])
  })

  it("un nombre sin parecido no se marca, ni un existente sin cambios", () => {
    const found = findLigaNameConflicts(
      [{ players: [{ playerId: null, displayName: "Gomez Pedro" }, { playerId: "1", displayName: "Perez Juan" }] }],
      existing,
    )
    expect(found).toEqual([])
  })

  it("renombrar un jugador existente a algo parecido a OTRO se marca; a sí mismo no", () => {
    const found = findLigaNameConflicts(
      [{ players: [{ playerId: "3", displayName: "Juan Perez" }, { playerId: "1", displayName: "Juan Perez" }] }],
      existing,
    )
    expect(found.map((f) => [f.playerIndex, f.candidates.map((c) => c.id)])).toEqual([[0, ["1"]]])
  })

  it("lo que el organizador ya confirmó como otra persona no se vuelve a preguntar", () => {
    const found = findLigaNameConflicts([{ players: [{ playerId: null, displayName: "Juan Perez", confirmedDistinct: true }] }], existing)
    expect(found).toEqual([])
  })
})
