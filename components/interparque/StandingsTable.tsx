import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InterparqueStandingRow } from "@/lib/interparque/calculateInterparqueStandings"

interface Props {
  standings: InterparqueStandingRow[]
}

export function StandingsTable({ standings }: Props) {
  if (standings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay jugadores cargados.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-brand-light">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead className="text-right">PJ</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, i) => (
            <TableRow key={row.playerId}>
              <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium text-foreground">{row.displayName}</TableCell>
              <TableCell className="text-right text-muted-foreground">{row.played}</TableCell>
              <TableCell className="text-right font-semibold text-accent">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
