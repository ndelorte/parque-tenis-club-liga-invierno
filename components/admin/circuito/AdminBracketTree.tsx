"use client"

import type { BracketTree, BracketTreeMatch, BracketTreeSide } from "@/lib/circuito/bracketTree"
import { ChampionCard } from "@/components/circuito/champion-card"

// Modo "reordenar": cada participante de la 1ª ronda del principal se arrastra
// (o se toca y después se toca otro) para intercambiarlo de lugar con otro.
export interface Reorder {
  selectedId: string | null
  busy: boolean
  onPick: (participantId: string) => void
  onSwap: (fromId: string, toId: string) => void
}

interface Props {
  tree: BracketTree
  championLabel: string
  idPrefix: string
  onOpenMatch: (matchId: string) => void
  reorder?: Reorder
}

function groupIntoPairs(matches: BracketTreeMatch[]): BracketTreeMatch[][] {
  if (matches.length <= 1) return [matches]
  const groups: BracketTreeMatch[][] = []
  for (let i = 0; i < matches.length; i += 2) groups.push(matches.slice(i, i + 2))
  return groups
}

function SideRow({
  side,
  isWinner,
  score,
  isWalkover,
  reorder,
}: {
  side: BracketTreeSide | null
  isWinner: boolean
  score: string | null
  isWalkover: boolean
  reorder?: Reorder
}) {
  const base = `flex h-[34px] items-center gap-2 border-t border-border px-3 text-sm first:border-t-0 ${
    isWinner ? "font-bold text-foreground shadow-[inset_4px_0_0_var(--color-clay)]" : "text-muted-foreground"
  }`
  if (!side) {
    return (
      <div className={base}>
        <span className="italic">Por definir</span>
      </div>
    )
  }
  const content = (
    <>
      <span className="w-5 shrink-0 tabular-nums text-xs text-muted-foreground">{side.seed ? `[${side.seed}]` : ""}</span>
      <span className="min-w-0 flex-1 truncate text-left">{side.name}</span>
      {isWinner && (
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">{isWalkover ? "W.O." : score}</span>
      )}
    </>
  )
  if (!reorder) return <div className={base}>{content}</div>

  const selected = reorder.selectedId === side.id
  return (
    <button
      type="button"
      draggable={!reorder.busy}
      disabled={reorder.busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", side.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const from = e.dataTransfer.getData("text/plain")
        if (from && from !== side.id) reorder.onSwap(from, side.id)
      }}
      onClick={() => reorder.onPick(side.id)}
      className={`${base} w-full cursor-grab active:cursor-grabbing ${selected ? "bg-primary/10" : "hover:bg-muted"}`}
    >
      {content}
    </button>
  )
}

function AdminMatchCard({
  match,
  reorder,
  onOpen,
}: {
  match: BracketTreeMatch
  reorder?: Reorder
  onOpen: (matchId: string) => void
}) {
  const { a, b, winnerId, isBye, isWalkover, score } = match
  const playable = !!a && !!b && !isBye

  const body = (
    <>
      <SideRow side={a} isWinner={!!winnerId && winnerId === a?.id} score={score} isWalkover={isWalkover} reorder={reorder} />
      {isBye ? (
        <div className="flex h-[34px] items-center border-t border-border px-3 text-sm italic text-muted-foreground">Pase libre</div>
      ) : (
        <SideRow side={b} isWinner={!!winnerId && winnerId === b?.id} score={score} isWalkover={isWalkover} reorder={reorder} />
      )}
    </>
  )

  const frame = "relative overflow-hidden rounded border-[1.5px] border-draw-line bg-card"
  if (reorder || !playable) return <div className={frame}>{body}</div>

  return (
    <button
      type="button"
      onClick={() => onOpen(match.id)}
      title={winnerId ? "Corregir resultado" : "Cargar resultado"}
      className={`${frame} block w-full text-left hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        winnerId ? "" : "ring-1 ring-pending/60"
      }`}
    >
      {body}
    </button>
  )
}

// Cuadro horizontal del panel: misma grilla y conectores que el que ve el
// público (components/circuito/bracket-tree.tsx), con los partidos
// clickeables para cargar el resultado.
export function AdminBracketTree({ tree, championLabel, idPrefix, onOpenMatch, reorder }: Props) {
  const firstRoundSize = tree.rounds[0]?.matches.length ?? 1
  const height = Math.max(firstRoundSize, 1) * 92

  return (
    <div
      tabIndex={0}
      aria-label={championLabel}
      className="overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-stretch" style={{ height: `${height}px`, minWidth: "max-content" }}>
        {tree.rounds.map((round, ri) => (
          <div
            key={round.roundNumber}
            className={`box-content flex w-[210px] shrink-0 flex-col pr-8 ${ri > 0 ? "bracket-col-fed" : ""}`}
          >
            <h3
              id={`ronda-${idPrefix}-${round.roundNumber}`}
              className="mb-2.5 flex h-10 items-end border-b-2 border-draw-line pb-2 font-heading text-lg font-bold uppercase"
            >
              {round.label}
            </h3>
            <ol aria-labelledby={`ronda-${idPrefix}-${round.roundNumber}`} className="bracket-round-body m-0 list-none p-0">
              {groupIntoPairs(round.matches).map((group) => (
                <li key={group[0].id} className={`bracket-group ${group.length === 2 ? "is-pair" : ""}`}>
                  {group.map((m) => (
                    <div key={m.id} className="bracket-match">
                      <AdminMatchCard match={m} onOpen={onOpenMatch} reorder={ri === 0 ? reorder : undefined} />
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ))}

        <div className="flex w-[240px] shrink-0 flex-col">
          <h3 className="mb-2.5 flex h-10 items-end border-b-2 border-draw-line pb-2 font-heading text-lg font-bold uppercase">
            {championLabel}
          </h3>
          <ChampionCard champion={tree.champion} finalScore={tree.finalScore} />
        </div>
      </div>
    </div>
  )
}
