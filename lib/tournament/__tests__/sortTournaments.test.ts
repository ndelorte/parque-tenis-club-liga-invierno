import { describe, it, expect } from "vitest";
import { sortTournaments } from "../sortTournaments";
import { Tournament } from "../types";

function makeTournament(overrides: Partial<Tournament>): Tournament {
  return {
    id: overrides.slug ?? "t",
    name: "Liga",
    slug: "liga",
    season: 2026,
    status: "finished",
    ...overrides,
  };
}

describe("sortTournaments", () => {
  it("pone la edición activa primero", () => {
    const active = makeTournament({ slug: "liga-invierno-2026", status: "active", season: 2026 });
    const finished = makeTournament({ slug: "liga-invierno-2025", status: "finished", season: 2025 });
    const upcoming = makeTournament({ slug: "liga-verano-2026-2027", status: "upcoming", season: 2026 });

    const sorted = sortTournaments([finished, upcoming, active]);

    expect(sorted[0].slug).toBe("liga-invierno-2026");
  });

  it("ordena próxima antes que pasadas", () => {
    const upcoming = makeTournament({ slug: "liga-verano-2026-2027", status: "upcoming", season: 2026 });
    const finished = makeTournament({ slug: "liga-invierno-2025", status: "finished", season: 2025 });

    const sorted = sortTournaments([finished, upcoming]);

    expect(sorted[0].slug).toBe("liga-verano-2026-2027");
    expect(sorted[1].slug).toBe("liga-invierno-2025");
  });

  it("dentro del mismo status, ordena por season descendente", () => {
    const t2025 = makeTournament({ slug: "liga-invierno-2025", status: "finished", season: 2025 });
    const t2024 = makeTournament({ slug: "liga-invierno-2024", status: "finished", season: 2024 });
    const verano2025 = makeTournament({ slug: "liga-verano-2025-2026", status: "finished", season: 2025 });

    const sorted = sortTournaments([t2024, verano2025, t2025]);

    expect(sorted.map((t) => t.season)).toEqual([2025, 2025, 2024]);
  });

  it("no muta el array original", () => {
    const original = [makeTournament({ slug: "a", season: 2024 }), makeTournament({ slug: "b", season: 2026 })];
    const copy = [...original];

    sortTournaments(original);

    expect(original).toEqual(copy);
  });
});
