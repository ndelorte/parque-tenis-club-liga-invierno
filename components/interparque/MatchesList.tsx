"use client"

import { useRouter } from "next/navigation"
import type { InterparqueMatch, InterparquePlayerRow } from "@/lib/data/interparque"
import type { DateGroup } from "./seasonCalendar"

interface Props {
  groups: DateGroup<InterparqueMatch>[]
  players: InterparquePlayerRow[]
  selectedKey: string | null
}

function playerName(players: InterparquePlayerRow[], id: string) {
  const player = players.find((p) => p.id === id)
  return player ? `${player.first_name} ${player.last_name}` : "—"
}

function shortDate(dateKey: string) {
  const dt = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(dt).replace(".", "")
}

function fullDateLabel(dateKey: string) {
  const dt = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(dt)
}

function groupLabel(group: DateGroup<InterparqueMatch>) {
  return group.seasonDate ? `Fecha ${group.seasonDate.index}` : "Fecha a confirmar"
}

// Partidos jugados — dirección "Domingos": se eligen por fecha con botones,
// no con scroll infinito, y la fecha elegida se refleja en la URL (?fecha=)
// para poder compartir o volver atrás con el navegador (ver
// product/refactor-visual/maquetas/fase-4/Opcion2-Interparque.dc.html, .ip2-fsel/.ip2-ms).
export function MatchesList({ groups, players, selectedKey }: Props) {
  const router = useRouter()

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay partidos jugados.
      </p>
    )
  }

  const activeKey = selectedKey && groups.some((g) => g.key === selectedKey) ? selectedKey : groups[groups.length - 1].key
  const activeGroup = groups.find((g) => g.key === activeKey)!
  const activeDateLabel = activeGroup.key !== "sin-fecha" ? fullDateLabel(activeGroup.key) : "fecha a confirmar"

  return (
    <div>
      <div role="group" aria-label="Elegir fecha" className="mb-3.5 flex flex-wrap gap-1.5">
        {groups.map((group) => {
          const pressed = group.key === activeKey
          return (
            <button
              key={group.key}
              type="button"
              aria-pressed={pressed}
              onClick={() => router.push(`/interparque?fecha=${group.key}#partidos`, { scroll: false })}
              className={`press grid min-h-11 min-w-16 rounded border-[1.5px] px-3.5 py-1 text-left leading-tight focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                pressed
                  ? "border-foreground bg-foreground text-background"
                  : "border-border-strong bg-card text-foreground hover:border-foreground"
              }`}
            >
              <span className="font-heading text-lg font-extrabold uppercase">{groupLabel(group)}</span>
              {group.seasonDate && (
                <span className={`text-[12.5px] ${pressed ? "text-background/85" : "text-muted-foreground"}`}>
                  {shortDate(group.seasonDate.key)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <ul
        aria-label={`Partidos de la ${groupLabel(activeGroup).toLowerCase()}, ${activeDateLabel}`}
        className="grid gap-2.5 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-0"
      >
        {activeGroup.matches.map((match) => (
          <MatchRow key={match.id} match={match} players={players} />
        ))}
      </ul>

      <p className="mt-2.5 text-sm text-muted-foreground">
        El ganador va a la izquierda, en negrita. El score se lee desde su lado; el tercer
        valor, más chico, es el super tie-break.
      </p>
    </div>
  )
}

function MatchRow({ match, players }: { match: InterparqueMatch; players: InterparquePlayerRow[] }) {
  const winnerA = match.winner_player_id === match.player_a_id
  const scoreParts = (match.score ?? "").trim().split(/\s+/).filter(Boolean)

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-[1.5px] border-border bg-card px-3.5 py-3">
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
    </li>
  )
}
