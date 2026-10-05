"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MoveHorizontal, Trophy } from "lucide-react"
import { submitCircuitoMatchResultAction, swapCircuitoParticipantsAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DrawFormatKind } from "@/lib/circuito/types"

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
  categoryId: string
  matches: CircuitoMatchView[]
  participantNames: Record<string, string>
  editionSlug: string
  categorySlug: string
  format: DrawFormatKind | null // null = cuadro importado: se asume eliminación directa
}

function roundLabel(
  bracket: "main" | "repechaje",
  roundNumber: number,
  totalRounds: number,
  format: DrawFormatKind | null,
  zone: "A" | "B" | null,
) {
  if (bracket === "main") {
    if (format === "round_robin_pure") return "Todos contra todos"
    if (format === "round_robin_with_final") return roundNumber === 1 ? "Todos contra todos" : "Final"
    if (format === "groups_then_knockout") {
      if (roundNumber === 1) return zone ? `Zona ${zone}` : "Fase de zonas"
      return roundNumber === totalRounds ? "Final" : "Semifinal"
    }
  }
  const prefix = bracket === "repechaje" ? "Repechaje — " : ""
  if (roundNumber === totalRounds) return `${prefix}Final`
  if (roundNumber === totalRounds - 1) return `${prefix}Semifinal`
  if (roundNumber === totalRounds - 2) return `${prefix}Cuartos de final`
  if (roundNumber === totalRounds - 3) return `${prefix}Octavos de final`
  return `${prefix}Ronda ${roundNumber}`
}

// Modo "reordenar": cada participante de la 1ª ronda se arrastra (o se toca y
// después se toca otro) para intercambiarlo de lugar con otro.
interface Reorder {
  selectedId: string | null
  busy: boolean
  onPick: (participantId: string) => void
  onSwap: (fromId: string, toId: string) => void
}

function MatchRow({
  match,
  name,
  isFinal,
  editionSlug,
  categorySlug,
  reorder,
}: {
  match: CircuitoMatchView
  name: (id: string | null) => string
  isFinal: boolean
  editionSlug: string
  categorySlug: string
  reorder?: Reorder
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

  function nameCell(participantId: string | null, className: string) {
    const label = name(participantId)
    if (!reorder || !participantId) return <span className={className}>{label}</span>
    const selected = reorder.selectedId === participantId
    return (
      <button
        type="button"
        draggable={!reorder.busy}
        disabled={reorder.busy}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", participantId)
          e.dataTransfer.effectAllowed = "move"
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const from = e.dataTransfer.getData("text/plain")
          if (from && from !== participantId) reorder.onSwap(from, participantId)
        }}
        onClick={() => reorder.onPick(participantId)}
        className={`${className} cursor-grab rounded border border-dashed px-1.5 py-0.5 text-left active:cursor-grabbing ${
          selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted"
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className={`size-2 shrink-0 rounded-full ${
            isPlayed ? "bg-win-soft0" : isReady ? "bg-pending" : "bg-muted-foreground/30"
          }`}
        />
        <div className="min-w-0 flex-1 text-sm">
          {isBye ? (
            <span className="text-muted-foreground">
              {reorder ? nameCell(match.participant_a_id, "") : name(match.participant_a_id)} — bye (avanza)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              {nameCell(
                match.participant_a_id,
                `truncate ${match.winner_id === match.participant_a_id ? "font-semibold text-foreground" : "text-muted-foreground"}`,
              )}
              {isPlayed ? (
                <span className="shrink-0 font-mono text-xs font-semibold text-foreground">{match.score}</span>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">vs</span>
              )}
              {nameCell(
                match.participant_b_id,
                `truncate text-right ${match.winner_id === match.participant_b_id ? "font-semibold text-foreground" : "text-muted-foreground"}`,
              )}
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
            <input
              type="checkbox"
              checked={isWalkover}
              onChange={(e) => {
                setIsWalkover(e.target.checked)
                if (e.target.checked && !score.trim()) setScore("6-0 6-0")
              }}
            />
            Walkover (6-0 6-0 si gana el de arriba, 0-6 0-6 si gana el de abajo)
          </label>
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="w-full">
            {loading ? "Guardando..." : "Cargar resultado"}
          </Button>
          {error && <p className="text-xs text-loss">{error}</p>}
        </div>
      )}
    </div>
  )
}

export function MatchesList({ categoryId, matches, participantNames, editionSlug, categorySlug, format }: Props) {
  const [reordering, setReordering] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reorderError, setReorderError] = useState("")

  const name = (id: string | null) => (id ? participantNames[id] ?? "?" : "Por definir")

  // Solo se reordena un cuadro armado por el panel y sin resultados cargados.
  const canReorder = format !== null && matches.every((m) => m.winner_id === null && m.score === null)

  async function swap(fromId: string, toId: string) {
    setBusy(true)
    setReorderError("")
    const result = await swapCircuitoParticipantsAction(categoryId, fromId, toId, editionSlug, categorySlug)
    setBusy(false)
    setSelectedId(null)
    if (!result.ok) setReorderError(result.error)
  }

  function pick(participantId: string) {
    if (!selectedId) setSelectedId(participantId)
    else if (selectedId === participantId) setSelectedId(null)
    else void swap(selectedId, participantId)
  }

  const reorder: Reorder = { selectedId, busy, onPick: pick, onSwap: (a, b) => void swap(a, b) }

  const mainMatches = matches.filter((m) => m.bracket === "main")
  const repechajeMatches = matches.filter((m) => m.bracket === "repechaje")
  const totalMainRounds = mainMatches.reduce((max, m) => Math.max(max, m.round_number), 0)
  const totalRepechajeRounds = repechajeMatches.reduce((max, m) => Math.max(max, m.round_number), 0)

  const grouped = (list: CircuitoMatchView[], totalRounds: number, bracket: "main" | "repechaje") => {
    // Una sección por ronda; en la fase de zonas, una por zona.
    const sections = new Map<string, { round: number; zone: "A" | "B" | null; matches: CircuitoMatchView[] }>()
    for (const m of list) {
      const zone = bracket === "main" && m.round_number === 1 ? m.zone : null
      const key = `${m.round_number}-${zone ?? ""}`
      if (!sections.has(key)) sections.set(key, { round: m.round_number, zone, matches: [] })
      sections.get(key)!.matches.push(m)
    }
    return [...sections.values()]
      .sort((a, b) => a.round - b.round || (a.zone ?? "").localeCompare(b.zone ?? ""))
      .map(({ round, zone, matches: roundMatches }) => (
      <div key={`${bracket}-${round}-${zone ?? ""}`} className="mb-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-3" />
          {roundLabel(bracket, round, totalRounds, format, zone)}
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
              reorder={reordering && bracket === "main" && round === 1 ? reorder : undefined}
            />
          ))}
        </div>
      </div>
    ))
  }

  return (
    <div>
      {canReorder && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {reordering
                ? "Arrastrá un participante sobre otro para intercambiarlos (o tocá uno y después el otro)."
                : "¿Querés cambiar a alguien de lugar? Podés hacerlo hasta que se cargue el primer resultado."}
            </p>
            <Button
              size="sm"
              variant={reordering ? "default" : "outline"}
              onClick={() => {
                setReordering(!reordering)
                setSelectedId(null)
                setReorderError("")
              }}
            >
              <MoveHorizontal className="size-3.5" />
              {reordering ? "Listo" : "Reordenar participantes"}
            </Button>
          </div>
          {reorderError && <p className="mt-2 text-xs text-loss">{reorderError}</p>}
        </div>
      )}
      {grouped(mainMatches, totalMainRounds, "main")}
      {repechajeMatches.length > 0 && grouped(repechajeMatches, totalRepechajeRounds, "repechaje")}
    </div>
  )
}
