import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FormatDateOptions = {
  /** @default true */
  weekday?: boolean
  /** @default "long" */
  month?: "short" | "long"
  /** @default false */
  year?: boolean
  /** "HH:MM[:SS]" opcional, se agrega como sufijo "· HH:MM hs". */
  time?: string | null
  /**
   * Ancla el parseo a mediodía UTC (`T12:00:00Z`) en vez de medianoche local
   * (`T00:00:00`). Usar `true` quien muestre la misma fecha en server y
   * cliente sin que la zona horaria del que renderiza la corra un día.
   * @default false
   */
  utc?: boolean
  /** Texto para `iso` vacío o ausente. @default "" */
  emptyLabel?: string
}

export function formatDate(iso: string, options: FormatDateOptions = {}): string {
  const { weekday = true, month = "long", year = false, time, utc = false, emptyLabel = "" } = options
  if (!iso) return emptyLabel
  const date = utc ? new Date(`${iso}T12:00:00Z`) : new Date(iso + "T00:00:00")
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: weekday ? "short" : undefined,
    day: "numeric",
    month,
    year: year ? "numeric" : undefined,
    timeZone: utc ? "UTC" : undefined,
  }).format(date)
  return time ? `${formatted} · ${time.slice(0, 5)} hs` : formatted
}
