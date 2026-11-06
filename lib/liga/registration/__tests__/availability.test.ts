import { describe, expect, it } from "vitest"
import { getRegistrationAvailability } from "../availability"

const base = { status: "active" as const, registration_open: true }

describe("getRegistrationAvailability", () => {
  const now = new Date("2026-11-10T15:00:00Z") // 12:00 en Argentina

  it("abierta sin fecha de cierre", () => {
    expect(getRegistrationAvailability(base, now)).toMatchObject({ open: true, deadline: null })
  })

  it("cerrada por el organizador o por edición finalizada", () => {
    expect(getRegistrationAvailability({ ...base, registration_open: false }, now)).toEqual({ open: false, reason: "closed" })
    expect(getRegistrationAvailability({ ...base, status: "finished" }, now)).toEqual({ open: false, reason: "closed" })
  })

  it("el día de cierre todavía está abierta, al día siguiente no", () => {
    expect(getRegistrationAvailability({ ...base, registration_deadline: "2026-11-10" }, now).open).toBe(true)
    expect(getRegistrationAvailability({ ...base, registration_deadline: "2026-11-09" }, now)).toEqual({
      open: false,
      reason: "deadline_passed",
    })
  })

  it("usa la zona horaria argentina (02:00 UTC sigue siendo el día anterior)", () => {
    const lateNight = new Date("2026-11-11T02:00:00Z")
    expect(getRegistrationAvailability({ ...base, registration_deadline: "2026-11-10" }, lateNight).open).toBe(true)
  })

  it("aplica min/max configurados", () => {
    const r = getRegistrationAvailability({ ...base, registration_min_players: 4, registration_max_players: 8 }, now)
    expect(r).toMatchObject({ open: true, min: 4, max: 8 })
  })
})
