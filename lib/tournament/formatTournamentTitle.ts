import { Tournament } from "./types";

type TournamentTitleInput = Pick<Tournament, "name" | "season">;

// Liga de Verano cruza dos años calendario (arranca fin de año, termina al
// siguiente) — se muestra "2025/2026". Liga de Invierno es un solo año.
export function formatSeasonLabel(tournament: TournamentTitleInput): string {
  const isVerano = tournament.name.toLowerCase().includes("verano");
  return isVerano ? `${tournament.season}/${tournament.season + 1}` : `${tournament.season}`;
}

export function formatTournamentTitle(tournament: TournamentTitleInput): string {
  return `${tournament.name} ${formatSeasonLabel(tournament)}`;
}
