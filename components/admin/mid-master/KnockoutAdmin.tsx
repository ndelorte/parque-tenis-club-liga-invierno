import type { DbMmMatch, DbMmParticipant } from "@/lib/data/mid-master/types"
import { MatchForm } from "./MatchForm"
import { ResolveKnockoutButton } from "./ResolveKnockoutButton"

interface Props {
  knockoutMatches: DbMmMatch[]
  participants: DbMmParticipant[]
  categoryId: string
}

export function KnockoutAdmin({ knockoutMatches, participants, categoryId }: Props) {
  const sfMatches = knockoutMatches.filter((m) => m.phase === "semifinal")
  const finalMatches = knockoutMatches.filter((m) => m.phase === "final")
  const championMatch = finalMatches.find((m) => m.status === "played" && m.winner_participant_id)

  const hasSfParticipants = sfMatches.some((m) => m.participant_1_id && m.participant_2_id)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Cuadro final</h3>
            <p className="text-xs text-muted-foreground">Semifinales y final</p>
          </div>
          {!hasSfParticipants && (
            <ResolveKnockoutButton categoryId={categoryId} />
          )}
        </div>
      </div>

      {/* Semifinals */}
      {sfMatches.length > 0 && (
        <div className="border-b border-border">
          <div className="border-b border-border/50 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Semifinales
            </p>
          </div>
          {sfMatches.map((match) => (
            <MatchForm
              key={match.id}
              match={match}
              participants={participants}
              isFinal={false}
            />
          ))}
        </div>
      )}

      {/* Final */}
      {finalMatches.length > 0 && (
        <div>
          <div className="border-b border-border/50 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Final
            </p>
          </div>
          {finalMatches.map((match) => (
            <MatchForm
              key={match.id}
              match={match}
              participants={participants}
              isFinal={true}
            />
          ))}
        </div>
      )}

      {/* Champion */}
      {championMatch?.winner_participant_id && (
        <div className="border-t border-mm-gold/30 bg-mm-green-deep px-4 py-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-widest text-mm-gold">
            Campeón
          </p>
          <p className="mt-1 font-mm-display text-lg font-bold text-mm-gold-light">
            {participants.find((p) => p.id === championMatch.winner_participant_id)?.name ?? "Campeón"}
          </p>
        </div>
      )}
    </div>
  )
}
