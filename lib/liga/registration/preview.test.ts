import { afterEach, describe, expect, it, vi } from "vitest"
import { getPreviewTournament, isRegistrationPreview, PREVIEW_BRANCH, PREVIEW_SEASON } from "./preview"

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }))
import { submitLigaRegistration } from "@/app/actions/liga-registration-public"

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe("preview de inscripción aislada", () => {
  it.each([
    ["production", PREVIEW_BRANCH, false],
    ["preview", "main", false],
    ["preview", "feat/otra", false],
    ["preview", PREVIEW_BRANCH, true],
  ])("entorno %s, branch %s: %s", (env, branch, expected) => {
    vi.stubEnv("VERCEL_ENV", env)
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", branch)
    vi.stubEnv("LIGA_REGISTRATION_PREVIEW", "1")
    expect(isRegistrationPreview()).toBe(expected)
    expect(getPreviewTournament()?.registration_open ?? false).toBe(expected)
  })

  it("la activación local exige desarrollo y opt-in", () => {
    vi.stubEnv("VERCEL_ENV", "")
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("LIGA_REGISTRATION_PREVIEW", "")
    expect(isRegistrationPreview()).toBe(false)
    vi.stubEnv("LIGA_REGISTRATION_PREVIEW", "1")
    expect(isRegistrationPreview()).toBe(true)
    vi.stubEnv("NODE_ENV", "production")
    expect(isRegistrationPreview()).toBe(false)
  })

  it("bloquea el envío antes de crear un cliente de base de datos", async () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", PREVIEW_BRANCH)
    const result = await submitLigaRegistration(PREVIEW_SEASON, {})
    expect(result).toEqual({ success: false, error: "Vista de prueba: no se envió ni guardó la inscripción." })
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
