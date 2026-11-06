"use client"

import { useState } from "react"
import type { BracketTree, BracketTreeMatch } from "@/lib/circuito/bracketTree"
import { BracketMatchCard } from "./bracket-match-card"
import { ChampionCard } from "./champion-card"

interface Props {
  tree: BracketTree
  championLabel: string
}

// Arranca en la primera ronda con un partido real todavía sin ganador (la
// ronda "en juego"); si no queda ninguna, en la última (la final).
function initialRoundIndex(tree: BracketTree): number {
  for (let i = 0; i < tree.rounds.length; i++) {
    if (tree.rounds[i].matches.some((m) => m.a && m.b && !m.winnerId)) return i
  }
  return tree.rounds.length - 1
}

function nextRoundLabel(tree: BracketTree, roundIndex: number): string | null {
  if (roundIndex >= tree.rounds.length - 1) return null
  const next = tree.rounds[roundIndex + 1]
  return next.matches.length === 1 ? "la final" : next.label
}

// Etiquetas cortas para los botones de ronda en celular: a 375px con 5 rondas
// ("16avos de final", "Octavos de final", "Cuartos de final", ...) el texto
// completo se parte en varias líneas. El nombre completo queda como
// aria-label del botón. "Ronda N" (cuadros grandes, sin mapeo) no cambia.
const SHORT_ROUND_LABEL: Record<string, string> = {
  Final: "Final",
  Semifinales: "Semis",
  "Cuartos de final": "Cuartos",
  "Octavos de final": "Octavos",
  "16avos de final": "16avos",
}

function shortRoundLabel(label: string): string {
  return SHORT_ROUND_LABEL[label] ?? label
}

function winnerOf(m: BracketTreeMatch) {
  if (m.isBye) return m.a
  if (m.winnerId === m.a?.id) return m.a
  if (m.winnerId === m.b?.id) return m.b
  return null
}

function matchOutcomeNote(m: BracketTreeMatch, isLastRound: boolean, nextLabel: string | null, championLabel: string): string {
  const winner = winnerOf(m)
  if (!winner) return ""
  if (isLastRound) return `${winner.name} es ${championLabel.toLowerCase()}.`
  return nextLabel ? `${winner.name} pasa a ${nextLabel}.` : ""
}

// Vista del cuadro por rondas para el celular (todos los tamaños, ver
// product/plan-refactor-visual.md §8): botones de ronda arriba y la lista de
// partidos de la ronda elegida; cada partido dice a dónde pasa el ganador.
export function RoundsView({ tree, championLabel }: Props) {
  const [selected, setSelected] = useState(() => initialRoundIndex(tree))
  const round = tree.rounds[selected]
  const isLastRound = selected === tree.rounds.length - 1
  const nextLabel = nextRoundLabel(tree, selected)
  const showPairs = !isLastRound && round.matches.length > 1

  return (
    <div>
      {tree.champion && (
        <div className="mb-5">
          <ChampionCard champion={tree.champion} compact label={championLabel} />
        </div>
      )}

      <div role="group" aria-label="Ronda" className="flex">
        {tree.rounds.map((r, i) => (
          <button
            key={r.roundNumber}
            type="button"
            aria-pressed={i === selected}
            aria-label={r.label}
            onClick={() => setSelected(i)}
            className="press min-h-12 flex-1 whitespace-nowrap text-[15px] font-semibold text-muted-foreground shadow-[inset_0_-2px_0_var(--color-border)] focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring aria-pressed:text-foreground aria-pressed:shadow-[inset_0_-4px_0_var(--color-clay)]"
          >
            {shortRoundLabel(r.label)}
          </button>
        ))}
      </div>

      <ol aria-label={round.label} className={`mt-4 flex list-none flex-col gap-3.5 p-0 ${showPairs ? "pr-4" : ""}`}>
        {round.matches.map((m, i) => {
          // Corchete que une a los dos partidos cuyos ganadores se cruzan en
          // la ronda siguiente (mismo trazo que los conectores del cuadro de
          // escritorio). Se arma en piezas con CSS, sin medir en JS: el de
          // arriba baja desde el medio de su tarjeta hasta la mitad del gap, y
          // el de abajo sube desde el medio de la suya hasta ahí.
          const pairPos = showPairs && round.matches.length > (i ^ 1) ? (i % 2 === 0 ? "top" : "bottom") : null
          return (
            <li key={m.id} className={`flex flex-col gap-1.5 ${pairPos === "top" && i > 0 ? "mt-3" : ""}`}>
              <div className="relative">
                <BracketMatchCard match={m} compact />
                {pairPos === "top" && (
                  <span aria-hidden className="absolute left-full top-1/2 -bottom-1.5 w-3 border-t-2 border-r-2 border-draw-line" />
                )}
                {pairPos === "bottom" && (
                  <span aria-hidden className="absolute left-full -top-[7px] bottom-1/2 w-3 border-b-2 border-r-2 border-draw-line" />
                )}
              </div>
              <span className="relative pl-0.5 text-[13px] text-muted-foreground">
                {matchOutcomeNote(m, isLastRound, nextLabel, championLabel)}
                {pairPos === "top" && (
                  <span aria-hidden className="absolute left-full top-0 -bottom-[7px] w-3 border-r-2 border-draw-line" />
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
