import { nextPowerOfTwo } from "./generateBracket"
import type { BracketSlotMatch } from "./syncBracketSlots"

// Repechaje de la eliminación simple (8+): entra quien pierde SU PRIMER
// partido, sea en la 1ª ronda o, si arrancó con bye, en la 2ª. Se va
// llenando a medida que se cargan resultados, pero el cuadro tiene forma
// fija desde que se genera el principal (así se dibuja como árbol):
//
// - Cada "origen" es un partido del principal donde alguien puede jugar su
//   primer partido: los partidos reales de la 1ª ronda y los de la 2ª con un
//   bye en alguno de sus dos lugares. Cada origen tiene un lugar fijo
//   ("línea") en el repechaje, en ese orden.
// - Las líneas se agrupan de a 2 en la 1ª ronda del repechaje. Hay
//   nextPowerOfTwo(orígenes) líneas.
// - Una línea está pendiente hasta que se juega su origen. Si el perdedor no
//   estaba en su primer partido (ya había jugado) o no hay origen, la línea
//   queda vacía para siempre y su rival pasa solo (como un bye).

export type RepechajeLine = { kind: "pending" } | { kind: "filled"; id: string } | { kind: "empty" }

export interface RepechajeSource {
  matchId: string
  round: 1 | 2
}

const isBye = (m: BracketSlotMatch | undefined) => !!m && m.participantAId !== null && m.participantBId === null

export function repechajeSources(matches: BracketSlotMatch[]): RepechajeSource[] {
  const main = matches.filter((m) => m.bracket === "main")
  const byPosition = (round: number) => main.filter((m) => m.round === round).sort((a, b) => a.position - b.position)
  const round1 = byPosition(1)
  const round2 = byPosition(2)

  const real = round1.filter((m) => m.participantAId !== null && m.participantBId !== null)
  const withBye = round2.filter((m) => isBye(round1[m.position * 2]) || isBye(round1[m.position * 2 + 1]))

  return [
    ...real.map((m) => ({ matchId: m.id, round: 1 as const })),
    ...withBye.map((m) => ({ matchId: m.id, round: 2 as const })),
  ]
}

export function repechajeLineCount(sourceCount: number): number {
  return sourceCount < 2 ? 0 : nextPowerOfTwo(sourceCount)
}

// Partidos del repechaje por ronda (ronda 1 = líneas / 2, luego mitades).
export function repechajeShape(lineCount: number): number[] {
  const shape: number[] = []
  for (let n = lineCount / 2; n >= 1; n /= 2) shape.push(n)
  return shape
}

export function repechajeLines(matches: BracketSlotMatch[]): RepechajeLine[] {
  const sources = repechajeSources(matches)
  const lineCount = repechajeLineCount(sources.length)
  const byId = new Map(matches.map((m) => [m.id, m]))
  const byeIds = new Set(
    matches.filter((m) => m.bracket === "main" && m.round === 1 && isBye(m)).map((m) => m.participantAId!),
  )

  return Array.from({ length: lineCount }, (_, k): RepechajeLine => {
    const source = sources[k]
    if (!source) return { kind: "empty" }
    const match = byId.get(source.matchId)!
    if (!match.winnerId) return { kind: "pending" }
    const loser = match.winnerId === match.participantAId ? match.participantBId : match.participantAId
    if (!loser) return { kind: "empty" }
    // En la 2ª ronda, solo cuenta quien venía de bye: el otro ya había jugado.
    if (source.round === 2 && !byeIds.has(loser)) return { kind: "empty" }
    return { kind: "filled", id: loser }
  })
}

// Quién sale de un lugar del repechaje: un participante, nadie todavía
// (pending) o nadie nunca (empty).
type Outcome = { kind: "winner"; id: string } | { kind: "pending" } | { kind: "empty" }

const fromLine = (line: RepechajeLine | undefined): Outcome =>
  !line || line.kind === "empty" ? { kind: "empty" } : line.kind === "filled" ? { kind: "winner", id: line.id } : { kind: "pending" }

function outcomeOf(winnerId: string | null, inputs: [Outcome, Outcome]): Outcome {
  if (winnerId) return { kind: "winner", id: winnerId }
  if (inputs.some((i) => i.kind === "pending")) return { kind: "pending" }
  const winners = inputs.filter((i): i is { kind: "winner"; id: string } => i.kind === "winner")
  if (winners.length === 1) return winners[0] // el rival nunca va a llegar: pasa solo
  return winners.length === 2 ? { kind: "pending" } : { kind: "empty" }
}

export interface RepechajeSlots {
  matchId: string
  participantAId: string | null
  participantBId: string | null
}

// Lugares que le corresponden a cada partido del repechaje. Devuelve null si
// las filas existentes no tienen la forma esperada (repechaje armado con el
// criterio anterior, ya en juego): ese se deja como está.
export function computeRepechajeSlots(matches: BracketSlotMatch[]): RepechajeSlots[] | null {
  const lines = repechajeLines(matches)
  const shape = repechajeShape(lines.length)
  const rep = matches.filter((m) => m.bracket === "repechaje")
  const round = (r: number) => rep.filter((m) => m.round === r).sort((a, b) => a.position - b.position)

  if (shape.length === 0 || rep.length !== shape.reduce((a, b) => a + b, 0)) return null
  if (!shape.every((count, i) => round(i + 1).length === count)) return null

  const result: RepechajeSlots[] = []
  let previous: Outcome[] = []
  shape.forEach((_, i) => {
    const current = round(i + 1)
    const outcomes: Outcome[] = []
    current.forEach((m, p) => {
      const inputs: [Outcome, Outcome] =
        i === 0 ? [fromLine(lines[p * 2]), fromLine(lines[p * 2 + 1])] : [previous[p * 2] ?? { kind: "empty" }, previous[p * 2 + 1] ?? { kind: "empty" }]
      const id = (o: Outcome) => (o.kind === "winner" ? o.id : null)
      result.push({ matchId: m.id, participantAId: id(inputs[0]), participantBId: id(inputs[1]) })
      outcomes.push(outcomeOf(m.winnerId, inputs))
    })
    previous = outcomes
  })
  return result
}
