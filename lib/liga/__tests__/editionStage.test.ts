import { describe, expect, it } from "vitest"
import { areTeamsPublic, getEditionStage, roundsHaveSeries } from "../editionStage"

const active = (open: boolean) => ({ status: "active" as const, registration_open: open })

describe("getEditionStage", () => {
  it("inscripción abierta → registration, haya o no series", () => {
    expect(getEditionStage(active(true), false)).toBe("registration")
    expect(getEditionStage(active(true), true)).toBe("registration")
  })
  it("cerrada sin series → drawing", () => {
    expect(getEditionStage(active(false), false)).toBe("drawing")
  })
  it("cerrada con series → playing", () => {
    expect(getEditionStage(active(false), true)).toBe("playing")
  })
  it("finished siempre finished", () => {
    expect(getEditionStage({ status: "finished", registration_open: false }, false)).toBe("finished")
    expect(getEditionStage({ status: "finished", registration_open: true }, true)).toBe("finished")
  })
})

describe("areTeamsPublic", () => {
  it("edición activa: solo con inscripción cerrada y series", () => {
    expect(areTeamsPublic(active(true), true)).toBe(false)
    expect(areTeamsPublic(active(false), false)).toBe(false)
    expect(areTeamsPublic(active(false), true)).toBe(true)
  })
  it("ediciones finalizadas se ven siempre igual", () => {
    expect(areTeamsPublic({ status: "finished", registration_open: false }, false)).toBe(true)
    expect(areTeamsPublic({ status: "finished", registration_open: undefined }, false)).toBe(true)
  })
  it("registration_open ausente (datos viejos) cuenta como cerrada", () => {
    expect(areTeamsPublic({ status: "active", registration_open: undefined }, true)).toBe(true)
  })
})

describe("roundsHaveSeries", () => {
  it("false sin rondas o con rondas vacías", () => {
    expect(roundsHaveSeries([])).toBe(false)
    expect(roundsHaveSeries([{ series: [] }])).toBe(false)
  })
  it("true si alguna ronda tiene series", () => {
    expect(roundsHaveSeries([{ series: [] }, { series: [{}] }])).toBe(true)
  })
})
