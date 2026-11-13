import { describe, it, expect } from "vitest"
import { pointsByPlayer } from "../pointsByPlayer"

const part = (id: string, player_id: string | null, player_2_id: string | null = null) => ({ id, player_id, player_2_id })

describe("pointsByPlayer", () => {
  it("acredita los puntos de la pareja a sus dos jugadores", () => {
    const r = pointsByPlayer([part("a", "p1", "p2")], new Map([["a", 650]]))
    expect(r.get("p1")).toBe(650)
    expect(r.get("p2")).toBe(650)
  })

  it("single: solo player_id", () => {
    const r = pointsByPlayer([part("a", "p1")], new Map([["a", 400]]))
    expect([...r.entries()]).toEqual([["p1", 400]])
  })

  it("omite participantes sin puntos o sin entrada", () => {
    const r = pointsByPlayer([part("a", "p1"), part("b", "p2")], new Map([["a", 0]]))
    expect(r.size).toBe(0)
  })

  it("misma jugadora en 2 parejas: se queda con el máximo, sin importar el orden", () => {
    // Belozo: subcampeona con Marquez (1300) y 0 victorias con Caceres (100).
    const points = new Map([["m", 1300], ["c", 100]])
    const marquezFirst = pointsByPlayer([part("m", "marquez", "belozo"), part("c", "caceres", "belozo")], points)
    const caceresFirst = pointsByPlayer([part("c", "caceres", "belozo"), part("m", "marquez", "belozo")], points)
    for (const r of [marquezFirst, caceresFirst]) {
      expect(r.get("belozo")).toBe(1300)
      expect(r.get("marquez")).toBe(1300)
      expect(r.get("caceres")).toBe(100)
    }
  })

  it("no suma: dos participantes con los mismos puntos dan esos puntos", () => {
    const r = pointsByPlayer([part("a", "p1", "p2"), part("b", "p1", "p3")], new Map([["a", 200], ["b", 200]]))
    expect(r.get("p1")).toBe(200)
  })
})
