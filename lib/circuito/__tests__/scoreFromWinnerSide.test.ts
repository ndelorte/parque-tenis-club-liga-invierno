import { describe, it, expect } from "vitest"
import { scoreFromWinnerSide } from "../scoreFromWinnerSide"

describe("scoreFromWinnerSide", () => {
  it("gana A: devuelve el score como está guardado", () => {
    expect(scoreFromWinnerSide("6-4 6-3", "a")).toBe("6-4 6-3")
  })

  it("gana B: invierte cada set", () => {
    expect(scoreFromWinnerSide("0-6 2-6", "b")).toBe("6-0 6-2")
  })

  it("tres sets, gana B", () => {
    expect(scoreFromWinnerSide("6-4 3-6 6-7", "b")).toBe("4-6 6-3 7-6")
  })

  it("tres sets, gana A", () => {
    expect(scoreFromWinnerSide("6-4 3-6 7-6", "a")).toBe("6-4 3-6 7-6")
  })

  it("tie-break entre paréntesis: invierte los games y conserva los puntos", () => {
    expect(scoreFromWinnerSide("6-7(5) 4-6", "b")).toBe("7-6(5) 6-4")
  })

  it("super tie-break como set: lo invierte", () => {
    expect(scoreFromWinnerSide("6-4 3-6 8-10", "b")).toBe("4-6 6-3 10-8")
  })

  it("super tie-break entre corchetes: conserva los corchetes", () => {
    expect(scoreFromWinnerSide("6-4 3-6 [8-10]", "b")).toBe("4-6 6-3 [10-8]")
  })

  it("score no interpretable: devuelve el texto original", () => {
    expect(scoreFromWinnerSide("W.O.", "b")).toBe("W.O.")
    expect(scoreFromWinnerSide("6-4 abandono", "b")).toBe("6-4 abandono")
    expect(scoreFromWinnerSide("6/4 3/6", "b")).toBe("6/4 3/6")
  })

  it("no interpretable y gana A: también queda igual", () => {
    expect(scoreFromWinnerSide("W.O.", "a")).toBe("W.O.")
  })

  it("vacío o null: devuelve cadena vacía", () => {
    expect(scoreFromWinnerSide(null, "b")).toBe("")
    expect(scoreFromWinnerSide(undefined, "a")).toBe("")
    expect(scoreFromWinnerSide("", "b")).toBe("")
    expect(scoreFromWinnerSide("   ", "b")).toBe("")
  })

  it("tolera espacios de más", () => {
    expect(scoreFromWinnerSide("  0-6   2-6 ", "b")).toBe("6-0 6-2")
  })
})
