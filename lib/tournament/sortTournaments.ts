import { Tournament } from "./types";

const STATUS_ORDER: Record<Tournament["status"], number> = {
  active: 0,
  upcoming: 1,
  finished: 2,
};

// Activa primero, luego próxima, luego pasadas (por temporada descendente
// dentro de cada grupo) — orden del selector de ediciones (§3.2 del plan).
export function sortTournaments(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.season - a.season;
  });
}
