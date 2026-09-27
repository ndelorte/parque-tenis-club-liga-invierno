import type { BracketTree, BracketTreeMatch } from "@/lib/circuito/bracketTree"
import { BracketMatchCard } from "./bracket-match-card"
import { ChampionCard } from "./champion-card"

interface Props {
  tree: BracketTree
  championLabel: string
  championPoints?: number
  // Distingue los id/aria-labelledby cuando la página muestra más de un
  // árbol (p. ej. cuadro principal + repechaje) para que no se dupliquen.
  idPrefix?: string
  // Nombre del cuadro para el contenedor con scroll horizontal (lector de
  // pantalla y foco por teclado). Si no se pasa, se arma a partir de idPrefix.
  scrollAreaLabel?: string
}

function groupIntoPairs(matches: BracketTreeMatch[]): BracketTreeMatch[][] {
  if (matches.length <= 1) return [matches]
  const groups: BracketTreeMatch[][] = []
  for (let i = 0; i < matches.length; i += 2) groups.push(matches.slice(i, i + 2))
  return groups
}

// Cuadro horizontal de escritorio: una columna por ronda, con conectores de
// pseudo-elemento (ver .bracket-* en app/globals.css) — sin SVG ni cálculo de
// posiciones en JS, funciona como server component. Recibe scroll horizontal
// propio si no entra en el ancho disponible (nunca la página).
export function BracketTreeView({ tree, championLabel, championPoints, idPrefix = "cuadro", scrollAreaLabel }: Props) {
  const firstRoundSize = tree.rounds[0]?.matches.length ?? 1
  const height = Math.max(firstRoundSize, 1) * 92

  return (
    <div
      tabIndex={0}
      aria-label={scrollAreaLabel ?? championLabel}
      className="overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-stretch" style={{ height: `${height}px`, minWidth: "max-content" }}>
        {tree.rounds.map((round, ri) => (
          <div
            key={round.roundNumber}
            className={`box-content flex w-[210px] shrink-0 flex-col pr-8 ${ri > 0 ? "bracket-col-fed" : ""}`}
          >
            <h2
              id={`ronda-${idPrefix}-${round.roundNumber}`}
              className="mb-2.5 flex h-10 items-end border-b-2 border-draw-line pb-2 font-heading text-lg font-bold uppercase"
            >
              {round.label}
            </h2>
            <ol aria-labelledby={`ronda-${idPrefix}-${round.roundNumber}`} className="bracket-round-body m-0 list-none p-0">
              {groupIntoPairs(round.matches).map((group) => (
                <li key={group[0].id} className={`bracket-group ${group.length === 2 ? "is-pair" : ""}`}>
                  {group.map((m) => (
                    <div key={m.id} className="bracket-match">
                      <BracketMatchCard match={m} />
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ))}

        <div className="flex w-[240px] shrink-0 flex-col">
          <h2 className="mb-2.5 flex h-10 items-end border-b-2 border-draw-line pb-2 font-heading text-lg font-bold uppercase">
            {championLabel}
          </h2>
          <ChampionCard
            champion={tree.champion}
            finalScore={tree.finalScore}
            points={tree.champion ? championPoints : undefined}
          />
        </div>
      </div>
    </div>
  )
}
