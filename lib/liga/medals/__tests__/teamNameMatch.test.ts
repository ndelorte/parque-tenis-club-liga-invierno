import { describe, it, expect } from "vitest"
import { matchTeamName } from "../teamNameMatch"

// Nombres reales de supabase/seeds/003_liga_historica_podios.sql
describe("matchTeamName", () => {
  it("una sola palabra: solo coincide si es idéntico", () => {
    expect(matchTeamName("Pinamar", "Pinamar")).toBe("same")
    expect(matchTeamName("pinamar", "PINAMAR")).toBe("same")
    expect(matchTeamName("Pinamar", "Pinamar Verano")).toBeNull()
    expect(matchTeamName("Pinamar", "Finito tenis")).toBeNull()
  })
  it("mismo nombre sin importar mayúsculas, acentos u orden", () => {
    expect(matchTeamName("Parque Tenis", "Parque tenis")).toBe("same")
    expect(matchTeamName("Dream Team", "dream  team")).toBe("same")
    expect(matchTeamName("Lo Ganamos en el Súper", "lo ganamos en el super")).toBe("same")
    expect(matchTeamName("Cande&co", "Cande & Co")).toBe("same")
  })
  it("parecido con palabras de más", () => {
    expect(matchTeamName("Parque Tenis 2", "Parque Tenis")).toBe("similar")
    expect(matchTeamName("Gin Tonic Verano", "Gin Tonic")).toBe("similar")
    expect(matchTeamName("Fincas de Iraola", "Fincas de Iraola 2")).toBe("similar")
  })
  it("parecido con un error de tipeo", () => {
    expect(matchTeamName("Extraordinario equipos", "Extraordinario equipo")).toBe("similar")
  })
  it("nombres distintos no coinciden", () => {
    expect(matchTeamName("Parque Tenis", "Parque mixto")).toBeNull()
    expect(matchTeamName("Gin Tonic", "Dream Team")).toBeNull()
    expect(matchTeamName("Ducilo A", "Ducilo")).toBeNull()
    expect(matchTeamName("", "Pinamar")).toBeNull()
  })
})
