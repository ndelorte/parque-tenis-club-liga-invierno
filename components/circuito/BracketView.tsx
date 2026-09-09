import { Trophy } from "lucide-react"

export interface BracketViewMatch {
  id: string
  round_number: number
  participant_a_id: string | null
  participant_b_id: string | null
  score: string | null
  winner_id: string | null
  status: string
}

interface Props {
  matches: BracketViewMatch[]
  participantNames: Record<string, string>
  title?: string
}

function roundLabel(roundNumber: number, totalRounds: number) {
  if (roundNumber === totalRounds) return "Final"
  if (roundNumber === totalRounds - 1) return "Semifinal"
  if (roundNumber === totalRounds - 2) return "Cuartos de final"
  if (roundNumber === totalRounds - 3) return "Octavos de final"
  return `Ronda ${roundNumber}`
}

export function BracketView({ matches, participantNames, title = "Cuadro principal" }: Props) {
  if (matches.length === 0) return null

  const name = (id: string | null) => (id ? participantNames[id] ?? "?" : "Por definir")
  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round_number), 0)

  const byRound = new Map<number, BracketViewMatch[]>()
  for (const m of matches) {
    if (!byRound.has(m.round_number)) byRound.set(m.round_number, [])
    byRound.get(m.round_number)!.push(m)
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Trophy className="size-3.5" />
        {title}
      </p>
      {[...byRound.entries()]
        .sort(([a], [b]) => a - b)
        .map(([round, roundMatches]) => (
          <div key={round} className="mb-5">
            <p className="mb-1.5 text-xs font-medium text-foreground">{roundLabel(round, totalRounds)}</p>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {roundMatches.map((m) => {
                const isBye = !!m.participant_a_id && !m.participant_b_id
                const isPlayed = m.status === "played" || m.status === "walkover"
                return (
                  <div key={m.id} className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-sm last:border-0">
                    {isBye ? (
                      <span className="text-muted-foreground">{name(m.participant_a_id)} — bye</span>
                    ) : (
                      <>
                        <span className={m.winner_id === m.participant_a_id ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {name(m.participant_a_id)}
                        </span>
                        {isPlayed ? (
                          <span className="font-mono text-xs font-semibold text-foreground">{m.score}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">vs</span>
                        )}
                        <span className={m.winner_id === m.participant_b_id ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {name(m.participant_b_id)}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}
