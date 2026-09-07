import { describe, it, expect } from "vitest";
import { formatSeasonLabel, formatTournamentTitle } from "../formatTournamentTitle";

describe("formatSeasonLabel", () => {
  it("Liga de Invierno muestra un solo año", () => {
    expect(formatSeasonLabel({ name: "Liga de Invierno", season: 2026 })).toBe("2026");
  });

  it("Liga de Verano muestra el rango de dos años", () => {
    expect(formatSeasonLabel({ name: "Liga de Verano", season: 2025 })).toBe("2025/2026");
  });

  it("detecta \"verano\" sin importar mayúsculas", () => {
    expect(formatSeasonLabel({ name: "LIGA DE VERANO", season: 2026 })).toBe("2026/2027");
  });
});

describe("formatTournamentTitle", () => {
  it("combina nombre y temporada para invierno", () => {
    expect(formatTournamentTitle({ name: "Liga de Invierno", season: 2026 })).toBe(
      "Liga de Invierno 2026"
    );
  });

  it("combina nombre y rango de temporada para verano", () => {
    expect(formatTournamentTitle({ name: "Liga de Verano", season: 2026 })).toBe(
      "Liga de Verano 2026/2027"
    );
  });
});
