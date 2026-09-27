import { describe, it, expect } from "vitest"
import { isAdminUser } from "../admin"

describe("isAdminUser", () => {
  it("reconoce el rol admin en app_metadata (role o roles)", () => {
    expect(isAdminUser({ app_metadata: { role: "admin" } })).toBe(true)
    expect(isAdminUser({ app_metadata: { roles: ["editor", "admin"] } })).toBe(true)
  })

  it("ignora user_metadata: el propio usuario puede editarlo", () => {
    const user = { app_metadata: {}, user_metadata: { role: "admin", roles: ["admin"] } }
    expect(isAdminUser(user)).toBe(false)
  })

  it("sin usuario o sin rol admin, no es admin", () => {
    expect(isAdminUser(null)).toBe(false)
    expect(isAdminUser(undefined)).toBe(false)
    expect(isAdminUser({ app_metadata: { role: "user" } })).toBe(false)
  })
})
