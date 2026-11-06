import type { Tournament } from "@/lib/tournament/types"

// Etapas de una edición de la Liga y cuándo se ven los equipos en público.
//
// - registration: inscripción abierta → formulario, resumen del reglamento
//   y link al reglamento completo. Sin tablas ni equipos.
// - drawing: inscripción cerrada y todavía sin series (cuadros sin sortear).
// - playing: ya hay series cargadas → la vista activa de siempre.
// - finished: edición cerrada; se ve como siempre.
//
// Sin flag manual: todo se deduce de `registration_open` y de si hay series.

export type EditionStage = "registration" | "drawing" | "playing" | "finished"

type StageTournament = Pick<Tournament, "status" | "registration_open">

export function getEditionStage(tournament: StageTournament, hasSeries: boolean): EditionStage {
  if (tournament.status === "finished") return "finished"
  if (tournament.registration_open) return "registration"
  return hasSeries ? "playing" : "drawing"
}

// Los equipos de una edición en curso se ven solo con la inscripción cerrada
// y series cargadas en la categoría. Las ediciones finalizadas, siempre.
export function areTeamsPublic(tournament: StageTournament, categoryHasSeries: boolean): boolean {
  if (tournament.status === "finished") return true
  return !tournament.registration_open && categoryHasSeries
}

// "Series cargadas": alguna ronda con al menos una serie.
export function roundsHaveSeries(rounds: Array<{ series: unknown[] }>): boolean {
  return rounds.some((r) => r.series.length > 0)
}
