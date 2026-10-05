"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MoveHorizontal, Trophy, X } from "lucide-react"
import { rebuildCircuitoRepechajeAction, refreshCircuitoRepechajeAction, submitCircuitoMatchResultAction, swapCircuitoParticipantsAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildBracketTree } from "@/lib/circuito/bracketTree"
import type { DrawFormatKind } from "@/lib/circuito/types"
import { AdminBracketTree, type Reorder } from "./AdminBracketTree"

export interface CircuitoMatchView {
  id: string
  bracket: "main" | "repechaje"
  round_number: number
  position: number
  zone: "A" | "B" | null
  participant_a_id: string | null
  participant_b_id: string | null
  score: string | null
  status: string
  winner_id: string | null
  is_walkover: boolean
}

interface Props {
  categoryId: string
  // "main" o "repechaje": la página los muestra por separado (el repechaje
  // abajo de los puntos de ranking).
  part: "main" | "repechaje"
  // Repechaje con otra forma que la que corresponde (armado viejo con resultados).
  needsRebuild?: boolean
  // Motivo por el que el repechaje no se pudo actualizar al abrir la página.
  refreshNote?: string | null
  matches: CircuitoMatchView[]
  participantNames: Record<string, string>
  participantSeeds: Record<string, number | null>
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

// Formulario de resultado, compartido por la fila de la lista y el diálogo
// que se abre desde el cuadro horizontal.
function ResultForm({
  match,
  isFinal,
  editionSlug,
  categorySlug,
  onDone,
}: {
  match: Pick<CircuitoMatchView, "id" | "score">
  isFinal: boolean
  editionSlug: string
  categorySlug: string
  onDone: () => void
}) {
  const [score, setScore] = useState(match.score ?? "")
  const [isWalkover, setIsWalkover] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!score.trim()) {
      setError("Ingresá el score.")
      return
    }
    setLoading(true)
    setError("")
    const result = await submitCircuitoMatchResultAction(match.id, score, isWalkover, editionSlug, categorySlug)
    setLoading(false)
    if (result.ok) onDone()
    else setError(result.error)
  }

  return (
    <div className="space-y-2">
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
  )
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

  const isBye = !!match.participant_a_id && !match.participant_b_id
  const isReady = !!match.participant_a_id && !!match.participant_b_id
  const isPlayed = match.status === "played" || match.status === "walkover"

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
        <div className="border-t border-border bg-muted/30 px-3 py-3">
          <ResultForm
            match={match}
            isFinal={isFinal}
            editionSlug={editionSlug}
            categorySlug={categorySlug}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// Diálogo para cargar/corregir el resultado de un partido del cuadro horizontal.
function ResultDialog({
  match,
  title,
  isFinal,
  editionSlug,
  categorySlug,
  onClose,
}: {
  match: CircuitoMatchView
  title: string
  isFinal: boolean
  editionSlug: string
  categorySlug: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cargar resultado"
        className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <ResultForm match={match} isFinal={isFinal} editionSlug={editionSlug} categorySlug={categorySlug} onDone={onClose} />
      </div>
    </div>
  )
}

export function MatchesList({
  categoryId,
  part,
  needsRebuild,
  refreshNote,
  matches,
  participantNames,
  participantSeeds,
  editionSlug,
  categorySlug,
  format,
}: Props) {
  const [reordering, setReordering] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reorderError, setReorderError] = useState("")
  const [dialogMatchId, setDialogMatchId] = useState<string | null>(null)

  const name = (id: string | null) => (id ? participantNames[id] ?? "?" : "Por definir")

  // Solo se reordena un cuadro armado por el panel y sin resultados cargados.
  // (`matches` son los de esta parte; el reordenamiento mira el principal.)
  const unplayed = matches.every((m) => m.winner_id === null && m.score === null)
  const placedInRepechaje = matches.filter((m) => m.round_number === 1).flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter(Boolean).length
  const canReorder =
    part === "main"
      ? format !== null && unplayed
      : format === "single_elimination" && unplayed && placedInRepechaje >= 2

  async function swap(fromId: string, toId: string) {
    setBusy(true)
    setReorderError("")
    const result = await swapCircuitoParticipantsAction(categoryId, fromId, toId, editionSlug, categorySlug, part)
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

  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round_number), 0)
  const dialogMatch = matches.find((m) => m.id === dialogMatchId) ?? null

  const treeNames = Object.fromEntries(
    Object.entries(participantNames).map(([id, n]) => [id, { name: n, seed: participantSeeds[id] ?? null }]),
  )
  const fromPanel = part === "repechaje"
  // Eliminación simple (y repechaje): cuadro horizontal. En grupos + llave,
  // el tramo de semis y final (el de zonas va en listas).
  const treeMatches =
    part === "repechaje" || format === "single_elimination" || format === null
      ? matches
      : format === "groups_then_knockout"
        ? matches.filter((m) => m.round_number >= 2).map((m) => ({ ...m, round_number: m.round_number - 1 }))
        : []
  const tree = treeMatches.length > 0 ? buildBracketTree(treeMatches, treeNames, { fromPanel }) : null

  const listMatches =
    part === "main" && format === "groups_then_knockout"
      ? matches.filter((m) => m.round_number === 1)
      : tree
        ? []
        : matches

  const grouped = (list: CircuitoMatchView[], withReorder: boolean) => {
    // Una sección por ronda; en la fase de zonas, una por zona.
    const sections = new Map<string, { round: number; zone: "A" | "B" | null; matches: CircuitoMatchView[] }>()
    for (const m of list) {
      const zone = part === "main" && m.round_number === 1 ? m.zone : null
      const key = `${m.round_number}-${zone ?? ""}`
      if (!sections.has(key)) sections.set(key, { round: m.round_number, zone, matches: [] })
      sections.get(key)!.matches.push(m)
    }
    return [...sections.values()]
      .sort((a, b) => a.round - b.round || (a.zone ?? "").localeCompare(b.zone ?? ""))
      .map(({ round, zone, matches: roundMatches }) => (
        <div key={`${part}-${round}-${zone ?? ""}`} className="mb-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Trophy className="size-3" />
            {roundLabel(part, round, totalRounds, format, zone)}
          </p>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {roundMatches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                name={name}
                isFinal={part === "main" && round === totalRounds}
                editionSlug={editionSlug}
                categorySlug={categorySlug}
                reorder={withReorder && reordering && round === 1 ? reorder : undefined}
              />
            ))}
          </div>
        </div>
      ))
  }

  const dialogTitle = dialogMatch ? `${name(dialogMatch.participant_a_id)} vs ${name(dialogMatch.participant_b_id)}` : ""
  const dialogIsFinal =
    !!dialogMatch &&
    part === "main" &&
    (format === "groups_then_knockout"
      ? dialogMatch.round_number === totalRounds
      : dialogMatch.round_number === totalRounds)

  if (matches.length === 0 && !(part === "repechaje" && format === "single_elimination")) return null

  return (
    <div>
      {part === "repechaje" && (
        <>
          <h2 className="mb-1 font-heading text-xl font-bold uppercase">Repechaje</h2>
          <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
            Entra quien pierde su primer partido (en 1ª ronda, o en 2ª si arrancó con bye). Se va completando solo a
            medida que cargás resultados. No suma puntos.
          </p>
        </>
      )}

      {part === "repechaje" && format === "single_elimination" && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          {(refreshNote || needsRebuild) && (
            <p className="mb-2 rounded border border-amber-300 bg-amber-50 p-2 text-amber-900">
              {refreshNote ??
                "Este repechaje se armó con el criterio anterior y ya tiene resultados, por eso no se actualiza solo."}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setReorderError("")
                const result = await refreshCircuitoRepechajeAction(categoryId, editionSlug, categorySlug)
                setBusy(false)
                if (!result.ok) setReorderError(result.error)
              }}
            >
              Actualizar repechaje
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                if (!confirm("¿Rehacer el repechaje desde cero? Se borran los resultados que ya cargaste en él (no suma puntos).")) return
                setBusy(true)
                setReorderError("")
                const result = await rebuildCircuitoRepechajeAction(categoryId, editionSlug, categorySlug)
                setBusy(false)
                if (!result.ok) setReorderError(result.error)
              }}
            >
              Rehacer repechaje
            </Button>
            <span>
              «Actualizar» acomoda a los que perdieron su primer partido según los resultados; «Rehacer» lo arma de cero.
            </span>
          </div>
          {reorderError && <p className="mt-2 text-red-700">{reorderError}</p>}
        </div>
      )}

      {canReorder && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {reordering
                ? "Arrastrá un participante sobre otro para intercambiarlos (o tocá uno y después el otro)."
                : part === "main"
                  ? "¿Querés cambiar a alguien de lugar? Podés hacerlo hasta que se cargue el primer resultado."
                  : "¿Querés cambiar a alguien de lugar en el repechaje? Podés hacerlo hasta que se juegue el primer partido del repechaje."}
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

      {listMatches.length > 0 && grouped(listMatches, true)}

      {tree && (
        <AdminBracketTree
          tree={tree}
          championLabel={part === "repechaje" ? "Ganó el repechaje" : "Campeón"}
          idPrefix={part}
          onOpenMatch={setDialogMatchId}
          reorder={reordering && format !== "groups_then_knockout" ? reorder : undefined}
        />
      )}

      {dialogMatch && (
        <ResultDialog
          match={dialogMatch}
          title={dialogTitle}
          isFinal={dialogIsFinal}
          editionSlug={editionSlug}
          categorySlug={categorySlug}
          onClose={() => setDialogMatchId(null)}
        />
      )}
    </div>
  )
}
