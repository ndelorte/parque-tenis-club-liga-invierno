// Calendario de la temporada del Circuito para la landing (12 meses, uno por
// tarjeta) — product/plan-refactor-visual.md §4.3/§8. Excepción aprobada:
// lógica de PRESENTACIÓN nueva en lib/circuito/, no decide reglas
// deportivas: el estado mostrado sale tal cual del `status` de la edición,
// que getCircuitoEditions deriva de los resultados cargados
// (deriveEditionStatus, lib/circuito/editionStatus.ts).

import { isGrandSlamMonth } from "./pointsTable"

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export interface SeasonCalendarEditionInput {
  slug: string
  name: string
  month: number
  year: number
  status: "upcoming" | "active" | "finished"
}

export interface SeasonCalendarEdition {
  slug: string
  name: string
  status: "upcoming" | "active" | "finished"
}

export interface SeasonCalendarMonth {
  month: number
  monthName: string
  isGrandSlam: boolean
  // El mes calendario en curso, independiente de si ya hay una edición
  // cargada para él (un mes "en juego" sin torneo cargado todavía muestra
  // "A confirmar" pero sigue siendo el mes actual).
  isCurrent: boolean
  edition: SeasonCalendarEdition | null
}

export function buildSeasonCalendar(
  editions: SeasonCalendarEditionInput[],
  year: number,
  currentMonth: number,
): SeasonCalendarMonth[] {
  const byMonth = new Map(editions.filter((e) => e.year === year).map((e) => [e.month, e]))

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const edition = byMonth.get(month)
    return {
      month,
      monthName: MONTH_NAMES[i],
      isGrandSlam: isGrandSlamMonth(month),
      isCurrent: month === currentMonth,
      edition: edition ? { slug: edition.slug, name: edition.name, status: edition.status } : null,
    }
  })
}
