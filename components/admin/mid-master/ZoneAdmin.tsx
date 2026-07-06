import type { MmGroupWithData } from "@/lib/data/mid-master/types"
import { calculateZoneStandings } from "@/lib/mid-master/calculateZoneStandings"
import { ParticipantForm } from "./ParticipantForm"
import { MatchForm } from "./MatchForm"

interface Props {
  data: MmGroupWithData
}

export function ZoneAdmin({ data }: Props) {
  const { group, participants, matches } = data

  // Compute standings on-the-fly
  const standings = calculateZoneStandings(participants, matches)

  const completedCount = matches.filter((m) => m.status === "completed").length

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <h3 className="font-semibold text-foreground">{group.name}</h3>
        <p className="text-xs text-muted-foreground">
          {participants.length} participantes · {completedCount}/{matches.length} partidos jugados
        </p>
      </div>

      {/* Participants */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Participantes
        </p>
        {participants.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin participantes cargados.</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <ParticipantForm key={p.id} participant={p} />
            ))}
          </div>
        )}
      </div>

      {/* Standings (only if there are results) */}
      {standings.some((r) => r.played > 0) && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Posiciones
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="w-6 pb-1 text-left">#</th>
                <th className="pb-1 text-left">Participante</th>
                <th className="pb-1 text-center">PG</th>
                <th className="pb-1 text-center">Sets</th>
                <th className="pb-1 text-center">Games</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => {
                const found = participants.find((p) => p.id === row.participantId)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const name = (found as any)?.display_name ?? (found as any)?.name ?? (found as any)?.full_name ?? "—"
                return (
                  <tr key={row.participantId} className="border-t border-border/50">
                    <td className="py-1.5">
                      <span className={`font-bold ${row.position <= 2 ? "text-mm-gold" : "text-muted-foreground"}`}>
                        {row.position}
                      </span>
                      {row.advances && (
                        <span className="ml-1 inline-block size-1.5 rounded-full bg-mm-gold align-middle" />
                      )}
                    </td>
                    <td className="py-1.5 text-sm text-foreground">{name}</td>
                    <td className="py-1.5 text-center font-medium">{row.won}</td>
                    <td className="py-1.5 text-center tabular-nums text-muted-foreground">
                      {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                    </td>
                    <td className="py-1.5 text-center tabular-nums text-muted-foreground">
                      {row.gamesDiff > 0 ? `+${row.gamesDiff}` : row.gamesDiff}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Matches */}
      <div>
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Partidos
          </p>
        </div>
        {matches.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">Sin partidos cargados.</p>
        ) : (
          matches.map((match) => (
            <MatchForm
              key={match.id}
              match={match}
              participants={participants}
              isFinal={false}
            />
          ))
        )}
      </div>
    </div>
  )
}
