import Link from "next/link"
import type { InterparqueMatch, InterparquePlayerRow } from "@/lib/data/interparque"

interface Props {
  matches: InterparqueMatch[]
  players: InterparquePlayerRow[]
  page: number
  totalPages: number
}

function playerName(players: InterparquePlayerRow[], id: string) {
  const player = players.find((p) => p.id === id)
  return player ? `${player.first_name} ${player.last_name}` : "—"
}

function dateLabel(dateKey: string | null) {
  if (!dateKey) return "Fecha a confirmar"
  const dt = new Date(`${dateKey}T12:00:00`)
  const label = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(dt)
  // Solo la primera letra: `capitalize` de Tailwind capitalizaría también
  // "de" ("Lunes 22 De Septiembre"), que en español está mal.
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const pagerLinkClasses =
  "press inline-flex min-h-11 items-center gap-1.5 border-[1.5px] border-border-strong bg-card px-4 text-sm font-semibold text-foreground hover:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"

// Partidos jugados: lista plana del más nuevo al más viejo, paginada de a 8
// con Anterior/Siguiente (sin dividir por "Fecha 1/2/3" como en el hero: el
// usuario prefirió esto para esta sección puntual).
export function MatchesList({ matches, players, page, totalPages }: Props) {
  if (matches.length === 0 && page === 1) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay partidos jugados.
      </p>
    )
  }

  return (
    <div>
      <ul
        aria-label={`Partidos jugados, página ${page} de ${totalPages}, del más nuevo al más viejo`}
        className="grid gap-2.5 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-0"
      >
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} players={players} />
        ))}
      </ul>

      <p className="mt-2.5 text-sm text-muted-foreground">
        El ganador va a la izquierda, en negrita. El score se lee desde su lado; el tercer
        valor, más chico, es el super tie-break.
      </p>

      {totalPages > 1 && (
        <nav aria-label="Paginación de partidos jugados" className="mt-4 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={`/interparque?pagina=${page - 1}#partidos`} className={pagerLinkClasses}>
              ← Anterior
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/interparque?pagina=${page + 1}#partidos`} className={pagerLinkClasses}>
              Siguiente →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      )}
    </div>
  )
}

function MatchRow({ match, players }: { match: InterparqueMatch; players: InterparquePlayerRow[] }) {
  const winnerA = match.winner_player_id === match.player_a_id
  const scoreParts = (match.score ?? "").trim().split(/\s+/).filter(Boolean)

  return (
    <li className="grid gap-1.5 border-[1.5px] border-border bg-card px-3.5 py-3">
      <p className="text-[12.5px] font-semibold text-muted-foreground">{dateLabel(match.match_date)}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="grid min-w-0 gap-0.5">
          <span className={`truncate ${winnerA ? "font-bold text-foreground" : "text-muted-foreground"}`}>
            {playerName(players, match.player_a_id)}
          </span>
          <span className={`font-heading text-sm font-bold tabular-nums ${winnerA ? "text-ip-ink" : "text-muted-foreground"}`}>
            +{match.points_a} pts
          </span>
        </div>
        <div className="flex gap-2 border-x border-border px-2 font-heading text-lg font-bold tabular-nums">
          {scoreParts.map((part, i) => (
            <span key={i} className={i === 2 ? "self-start text-sm font-semibold text-muted-foreground" : undefined}>
              {part}
            </span>
          ))}
        </div>
        <div className="grid min-w-0 justify-items-end gap-0.5 text-right">
          <span className={`truncate ${!winnerA ? "font-bold text-foreground" : "text-muted-foreground"}`}>
            {playerName(players, match.player_b_id)}
          </span>
          <span className={`font-heading text-sm font-bold tabular-nums ${!winnerA ? "text-ip-ink" : "text-muted-foreground"}`}>
            +{match.points_b} pts
          </span>
        </div>
      </div>
    </li>
  )
}
