import type { Tournament } from "@/lib/tournament/types"

// Mínimo/máximo por defecto cuando el organizador todavía no los configuró.
export const DEFAULT_MIN_PLAYERS = 6
export const DEFAULT_MAX_PLAYERS = 12

export type RegistrationAvailability =
  | { open: true; min: number; max: number; deadline: string | null }
  | { open: false; reason: "closed" | "deadline_passed" }

// Hoy en Argentina como YYYY-MM-DD (la fecha de cierre es un día calendario).
export function todayInArgentina(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(now)
}

export function getRegistrationAvailability(
  tournament: Pick<
    Tournament,
    "status" | "registration_open" | "registration_deadline" | "registration_min_players" | "registration_max_players"
  >,
  now: Date = new Date(),
): RegistrationAvailability {
  if (!tournament.registration_open || tournament.status === "finished") return { open: false, reason: "closed" }
  const deadline = tournament.registration_deadline ?? null
  // El día de cierre inclusive.
  if (deadline && todayInArgentina(now) > deadline) return { open: false, reason: "deadline_passed" }
  const min = tournament.registration_min_players ?? DEFAULT_MIN_PLAYERS
  const max = Math.max(min, tournament.registration_max_players ?? DEFAULT_MAX_PLAYERS)
  return { open: true, min, max, deadline }
}
