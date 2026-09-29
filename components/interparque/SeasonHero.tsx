import type { SeasonDate } from "./seasonCalendar"

const STATUS_LABEL: Partial<Record<SeasonDate["status"], string>> = {
  done: "Jugada",
  next: "Próxima",
}

function monthAbbrev(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date).toLowerCase().slice(0, 3)
}

function dayNumber(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric" }).format(date)
}

function fullDateLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(date)
}

// Hero de Interparque — dirección "Domingos": el calendario de las fechas de
// la temporada es la identidad de la sección (product/refactor-visual/maquetas/
// fase-4/Opcion2-Interparque.dc.html, bloque .ip2-hero).
export function SeasonHero({ seasonDates }: { seasonDates: SeasonDate[] }) {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-4">
          <div>
            <h1 className="relative inline-block pb-2.5 font-heading text-5xl leading-[0.88] font-extrabold uppercase tracking-[0.01em] text-foreground sm:text-7xl">
              Interparque
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 w-18 bg-ball ring-1 ring-inset ring-ip-line" />
            </h1>
            <p className="mt-3 max-w-[52ch] text-base text-muted-foreground sm:text-lg">
              Partidos de single entre alumnos del club. Hay fecha todos los domingos de
              septiembre y octubre, y no hace falta jugarlas todas: cada partido suma.
            </p>
          </div>

          {seasonDates.length > 0 ? (
            <>
              <ol
                aria-label="Fechas del Interparque"
                className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
              >
                {seasonDates.map((seasonDate) => {
                  const label = STATUS_LABEL[seasonDate.status]
                  return (
                    <li
                      key={seasonDate.key}
                      aria-current={seasonDate.status === "next" ? "date" : undefined}
                      aria-label={`Fecha ${seasonDate.index}, ${fullDateLabel(seasonDate.date)}${label ? `: ${label}` : ""}`}
                      className={cellClasses(seasonDate.status)}
                    >
                      <span aria-hidden="true" className={`text-[12.5px] font-semibold ${seasonDate.status === "done" ? "text-on-ball-muted" : "text-muted-foreground"}`}>
                        Fecha {seasonDate.index}
                      </span>
                      <span aria-hidden="true" className="font-heading text-3xl leading-none font-extrabold tabular-nums">
                        {dayNumber(seasonDate.date)}
                      </span>
                      <span aria-hidden="true" className={`text-[13px] lowercase ${seasonDate.status === "done" ? "text-on-ball-muted" : "text-muted-foreground"}`}>
                        {monthAbbrev(seasonDate.date)}
                      </span>
                      {label && (
                        <span
                          aria-hidden="true"
                          className={`mt-1 text-[12.5px] font-bold ${seasonDate.status === "next" ? "text-foreground" : ""}`}
                        >
                          {label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
              <p className="text-sm text-muted-foreground">
                Todos los domingos, horario a convenir: cada semana se programa el de cada
                partido.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay fechas cargadas para esta temporada.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function cellClasses(status: SeasonDate["status"]) {
  const base = "grid min-h-22 gap-0 border-[1.5px] px-2.5 pt-2 pb-2.5"
  if (status === "done") return `${base} border-ip-line bg-ball text-on-ball`
  if (status === "next") return `${base} border-2 border-foreground bg-card text-foreground`
  return `${base} border-border bg-card text-foreground`
}
