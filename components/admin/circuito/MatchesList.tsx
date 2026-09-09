"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Trophy } from "lucide-react"
import { submitCircuitoMatchResultAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface CircuitoMatchView {
  id: string
  bracket: "main" | "repechaje"
  round_number: number
  zone: "A" | "B" | null
  participant_a_id: string | null
  participant_b_id: string | null
  score: string | null
  status: string
  winner_id: string | null
}

interface Props {
  matches: CircuitoMatchView[]
  participantNames: Record<string, string>
  editionSlug: string
  categorySlug: string
}

function roundLabel(bracket: "main" | "repechaje", roundNumber: number, totalRounds: number) {
  const prefix = bracket === "repechaje" ? "Repechaje — " : ""
  if (roundNumber === totalRounds) return `${prefix}Final`
  if (roundNumber === totalRounds - 1) return `${prefix}Semifinal`
  if (roundNumber === totalRounds - 2) return `${prefix}Cuartos de final`
  if (roundNumber === totalRounds - 3) return `${prefix}Octavos de final`
  return `${prefix}Ronda ${roundNumber}`
}

function MatchRow({
  match,
  name,
  isFinal,
  editionSlug,
  categorySlug,
}: {
  match: CircuitoMatchView
  name: (id: string | null) => string
  isFinal: boolean
  editionSlug: string
  categorySlug: string
}) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(match.score ?? "")
  const [isWalkover, setIsWalkover] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isBye = !!match.participant_a_id && !match.participant_b_id
  const isReady = !!match.participant_a_id && !!match.participant_b_id
  const isPlayed = match.status === "played" || match.status === "walkover"

  async function handleSubmit() {
    if (!score.trim()) {
      setError("Ingresá el score.")
      return
    }
    setLoading(true)
    setError("")
    const result = await submitCircuitoMatchResultAction(match.id, score, isWalkover, editionSlug, categorySlug)
    setLoading(false)
    if (result.ok) setOpen(false)
    else setError(result.error)
  }

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className={`size-2 shrink-0 rounded-full ${
            isPlayed ? "bg-green-500" : isReady ? "bg-amber-400" : "bg-muted-foreground/30"
          }`}
        />
        <div className="min-w-0 flex-1 text-sm">
          {isBye ? (
            <span className="text-muted-foreground">{name(match.participant_a_id)} — bye (avanza)</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`truncate ${match.winner_id === match.participant_a_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {name(match.participant_a_id)}
              </span>
              {isPlayed ? (
                <span className="shrink-0 font-mono text-xs font-semibold text-foreground">{match.score}</span>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">vs</span>
              )}
              <span className={`truncate text-right ${match.winner_id === match.participant_b_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {name(match.participant_b_id)}
              </span>
            </div>
          )}
        </div>
        {isReady && !isBye && (
          <button
            onClick={() => setOpen(!open)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-2 border-t border-border bg-muted/30 px-3 py-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Score — ej: 6-4 6-2 {isFinal ? "(o 6-4 3-6 6-4, la final se juega completa)" : "(o 6-4 3-6 7-6)"}
          </label>
          <Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="6-4 6-2" className="font-mono" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={isWalkover} onChange={(e) => setIsWalkover(e.target.checked)} />
            Walkover (registrar igual como 6-0 6-0)
          </label>
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="w-full">
            {loading ? "Guardando..." : "Cargar resultado"}
          </Button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}

export function MatchesList({ matches, participantNames, editionSlug, categorySlug }: Props) {
  const name = (id: string | null) => (id ? participantNames[id] ?? "?" : "Por definir")

  const mainMatches = matches.filter((m) => m.bracket === "main")
  const repechajeMatches = matches.filter((m) => m.bracket === "repechaje")
  const totalMainRounds = mainMatches.reduce((max, m) => Math.max(max, m.round_number), 0)
  const totalRepechajeRounds = repechajeMatches.reduce((max, m) => Math.max(max, m.round_number), 0)

  const grouped = (list: CircuitoMatchView[], totalRounds: number, bracket: "main" | "repechaje") => {
    const byRound = new Map<number, CircuitoMatchView[]>()
    for (const m of list) {
      if (!byRound.has(m.round_number)) byRound.set(m.round_number, [])
      byRound.get(m.round_number)!.push(m)
    }
    return [...byRound.entries()].sort(([a], [b]) => a - b).map(([round, roundMatches]) => (
      <div key={`${bracket}-${round}`} className="mb-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-3" />
          {roundLabel(bracket, round, totalRounds)}
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {roundMatches.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              name={name}
              isFinal={bracket === "main" && round === totalRounds}
              editionSlug={editionSlug}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      </div>
    ))
  }

  return (
    <div>
      {grouped(mainMatches, totalMainRounds, "main")}
      {repechajeMatches.length > 0 && grouped(repechajeMatches, totalRepechajeRounds, "repechaje")}
    </div>
  )
}
