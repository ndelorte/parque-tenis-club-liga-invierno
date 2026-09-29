import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InterparqueStandingRow } from "@/lib/interparque/calculateInterparqueStandings"
import { describePlayedDates, playerDots, type PlayerDateDot, type SeasonDate } from "./seasonCalendar"

interface Props {
  standings: InterparqueStandingRow[]
  seasonDates: SeasonDate[]
  participation: Map<string, Set<string>>
}

// Tabla de posiciones — dirección "Domingos": 8 puntos por jugador muestran
// qué fechas jugó, porque no es obligatorio jugarlas todas (ver
// product/refactor-visual/maquetas/fase-4/Opcion2-Interparque.dc.html, .ip2-tbl).
export function StandingsTable({ standings, seasonDates, participation }: Props) {
  if (standings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay jugadores cargados.
      </p>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow className="border-b-2 border-foreground hover:bg-transparent">
              <TableHead className="w-9">
                <span className="sr-only">Posición</span>#
              </TableHead>
              <TableHead>Jugador</TableHead>
              {seasonDates.length > 0 && (
                <TableHead className="hidden text-left sm:table-cell">Fechas jugadas</TableHead>
              )}
              <TableHead className="text-right">
                <abbr title="Partidos jugados" className="no-underline">
                  PJ
                </abbr>
              </TableHead>
              <TableHead className="text-right">Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, i) => {
              const dots = playerDots(participation.get(row.playerId), seasonDates)
              return (
                <TableRow key={row.playerId} className="h-13">
                  <TableCell className="align-middle text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="align-middle font-medium text-foreground">
                    <span>{row.displayName}</span>
                    {seasonDates.length > 0 && (
                      <SeasonDots dots={dots} className="mt-1 flex sm:hidden" />
                    )}
                  </TableCell>
                  {seasonDates.length > 0 && (
                    <TableCell className="hidden align-middle sm:table-cell">
                      <SeasonDots dots={dots} />
                    </TableCell>
                  )}
                  <TableCell className="align-middle text-right tabular-nums text-muted-foreground">
                    {row.played}
                  </TableCell>
                  <TableCell className="align-middle text-right text-lg font-extrabold tabular-nums text-foreground">
                    {row.points}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {seasonDates.length > 0 && (
        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Dot state="on" /> Jugó esa fecha
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot state="off" /> No jugó
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot state="fut" /> Por jugar
          </span>
        </p>
      )}
    </div>
  )
}

function SeasonDots({ dots, className }: { dots: PlayerDateDot[]; className?: string }) {
  return (
    <span role="img" aria-label={describePlayedDates(dots)} className={`inline-flex gap-1 ${className ?? ""}`}>
      {dots.map((dot, i) => (
        <Dot key={i} state={dot} />
      ))}
    </span>
  )
}

function Dot({ state }: { state: PlayerDateDot }) {
  if (state === "on") {
    return <span aria-hidden="true" className="size-3 rounded-full border-[1.5px] border-ip-line bg-ball" />
  }
  if (state === "fut") {
    return <span aria-hidden="true" className="size-3 rounded-full border border-dashed border-border" />
  }
  return <span aria-hidden="true" className="size-3 rounded-full border-[1.5px] border-border-strong" />
}
