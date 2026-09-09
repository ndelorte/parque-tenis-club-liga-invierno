import type { InterparqueMatch, InterparquePlayerRow } from "@/lib/data/interparque"

interface Props {
  matches: InterparqueMatch[]
  players: InterparquePlayerRow[]
}

function playerName(players: InterparquePlayerRow[], id: string) {
  const player = players.find((p) => p.id === id)
  return player ? `${player.first_name} ${player.last_name}` : "—"
}

function fmtDate(d: string) {
  const dt = new Date(d + "T12:00:00")
  return dt.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

export function MatchesList({ matches, players }: Props) {
  const played = matches.filter((m) => m.status === "completed")

  if (played.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay partidos jugados.
      </p>
    )
  }

  const groups = new Map<string, InterparqueMatch[]>()
  for (const match of played) {
    const key = match.match_date ?? "Fecha a confirmar"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(match)
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === "Fecha a confirmar") return 1
    if (b === "Fecha a confirmar") return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-5">
      {sortedKeys.map((dateKey) => (
        <div key={dateKey} className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-brand-light px-4 py-2">
            <p className="text-sm font-semibold capitalize text-brand-dark">
              {dateKey === "Fecha a confirmar" ? dateKey : fmtDate(dateKey)}
            </p>
          </div>
          <ul>
            {groups.get(dateKey)!.map((match) => {
              const winnerA = match.winner_player_id === match.player_a_id
              return (
                <li
                  key={match.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
                >
                  <span className={`justify-self-start truncate ${winnerA ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {playerName(players, match.player_a_id)}
                  </span>
                  <span className="justify-self-center shrink-0 font-mono text-xs font-semibold text-accent">
                    {match.score}
                  </span>
                  <span className={`justify-self-end truncate text-right ${!winnerA ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {playerName(players, match.player_b_id)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
