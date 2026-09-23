import { Trophy } from "lucide-react"
import type { BracketSection, DisplayMatch } from "@/lib/circuito/bracketDisplay"

export type BracketViewMatch = DisplayMatch

interface Props {
  sections: BracketSection[]
  participantNames: Record<string, string>
  title?: string
}

export function BracketView({ sections, participantNames, title = "Cuadro principal" }: Props) {
  if (sections.length === 0) return null

  const name = (id: string | null) => (id ? participantNames[id] ?? "?" : "Por definir")

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Trophy className="size-3.5" />
        {title}
      </p>
      {sections.map((section) => (
        <div key={section.label} className="mb-5">
          <p className="mb-1.5 text-xs font-medium text-foreground">{section.label}</p>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {section.matches.map((m) => {
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
