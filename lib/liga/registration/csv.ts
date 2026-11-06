// Exportación de las inscripciones a planilla: una fila por jugador.
// UTF-8 con BOM para que Excel muestre bien las tildes; separador coma,
// saltos de línea CRLF y celdas entre comillas cuando hace falta.

export type RegistrationCsvRow = {
  edition: string
  category: string
  team: string
  statusLabel: string
  isCaptain: boolean
  captainPhone: string
  firstName: string
  lastName: string
  dni: string
  notes: string
}

export const CSV_HEADERS = [
  "Edición",
  "Categoría",
  "Equipo",
  "Estado",
  "Capitán",
  "Teléfono",
  "Nombre",
  "Apellido",
  "DNI",
  "Observaciones",
] as const

const BOM = "﻿"
// Algo que parece un teléfono o un número: no se toca aunque empiece con + o -.
const NUMBERISH = /^[+-]?[\d\s()-]+$/

// Evita que Excel interprete como fórmula un texto que el público escribió
// (nombre del equipo, observaciones) y empieza con = + - @.
export function neutralizeFormula(value: string): string {
  if (/^[=@\t\r]/.test(value)) return `'${value}`
  if (/^[+-]/.test(value) && !NUMBERISH.test(value)) return `'${value}`
  return value
}

export function escapeCsvCell(value: string): string {
  const safe = neutralizeFormula(value)
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function statusLabelForCsv(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    withdrawn: "Dada de baja",
  }
  return labels[status] ?? status
}

export function buildRegistrationsCsv(rows: RegistrationCsvRow[]): string {
  const lines = [CSV_HEADERS.join(",")]
  for (const r of rows) {
    lines.push(
      [
        r.edition,
        r.category,
        r.team,
        r.statusLabel,
        r.isCaptain ? "Sí" : "No",
        r.captainPhone,
        r.firstName,
        r.lastName,
        r.dni,
        r.notes,
      ]
        .map(escapeCsvCell)
        .join(","),
    )
  }
  return BOM + lines.join("\r\n") + "\r\n"
}
