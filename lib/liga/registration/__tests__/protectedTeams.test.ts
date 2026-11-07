import { describe, expect, it } from "vitest"
import { teamsToDeactivate } from "../protectedTeams"

describe("teamsToDeactivate", () => {
  it("da de baja los que no vienen en la lista", () => {
    expect(teamsToDeactivate(["a", "b", "c"], ["a"], [])).toEqual(["b", "c"])
  })
  it("no toca los equipos aprobados desde una inscripción online", () => {
    expect(teamsToDeactivate(["a", "b", "c"], ["a"], ["b"])).toEqual(["c"])
  })
  it("sin diferencias no hay bajas", () => {
    expect(teamsToDeactivate(["a"], new Set(["a"]), [])).toEqual([])
  })
})
