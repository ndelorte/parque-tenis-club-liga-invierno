// Árbol del cuadro de eliminación directa del Circuito del Parque, para la
// vista horizontal (escritorio) y por rondas (celular). Excepción aprobada
// de product/plan-refactor-visual.md §4.3/§8: lógica de PRESENTACIÓN nueva en
// lib/circuito/ (no decide reglas deportivas, solo organiza partidos ya
// jugados/generados en una estructura de árbol).
//
// No infiere estructura: si los partidos no forman un árbol de eliminación
// directa válido (round 1 = n partidos, cada ronda siguiente = la mitad,
// posiciones 0..k-1 sin huecos, hasta llegar a 1 partido en la última ronda),
// devuelve null y la UI cae a la vista por lista (classifyMainBracketSections
// de bracketDisplay.ts). Esto cubre los cuadros importados de Challonge, que
// no respetan esta semántica de round/position (ver bracketDisplay.ts).

export interface BracketTreeParticipant {
  name: string
  seed: number | null
}

export interface BracketTreeMatchInput {
  id: string
  round_number: number
  position: number
  participant_a_id: string | null
  participant_b_id: string | null
  score: string | null
  winner_id: string | null
  status: string
  is_walkover: boolean
}

export interface BracketTreeSide {
  id: string
  name: string
  seed: number | null
}

export interface BracketTreeMatch {
  id: string
  position: number
  a: BracketTreeSide | null
  b: BracketTreeSide | null
  score: string | null
  winnerId: string | null
  isBye: boolean
  isWalkover: boolean
  status: string
}

export interface BracketTreeRound {
  roundNumber: number
  label: string
  matches: BracketTreeMatch[]
}

export interface BracketTree {
  rounds: BracketTreeRound[]
  champion: { id: string; name: string } | null
  finalScore: string | null
}

// Etiquetas de ronda contando desde el final (última ronda = Final). Para
// cuadros más grandes que 32 (no existen en el Circuito hoy, ver
// reglas-circuito-del-parque.md) se cae a "Ronda N".
export const BRACKET_ROUND_LABELS_FROM_END = [
  "Final",
  "Semifinales",
  "Cuartos de final",
  "Octavos de final",
  "16avos de final",
]

export function bracketRoundLabel(roundNumber: number, totalRounds: number): string {
  const idx = totalRounds - roundNumber
  return idx < BRACKET_ROUND_LABELS_FROM_END.length ? BRACKET_ROUND_LABELS_FROM_END[idx] : `Ronda ${roundNumber}`
}

function isPowerOfTwo(n: number): boolean {
  return n >= 1 && (n & (n - 1)) === 0
}

function toSide(
  id: string | null,
  participants: Record<string, BracketTreeParticipant>,
): BracketTreeSide | null {
  if (!id) return null
  const p = participants[id]
  return { id, name: p?.name ?? "?", seed: p?.seed ?? null }
}

export function buildBracketTree(
  matches: BracketTreeMatchInput[],
  participants: Record<string, BracketTreeParticipant>,
): BracketTree | null {
  if (matches.length === 0) return null

  const byRound = new Map<number, BracketTreeMatchInput[]>()
  for (const m of matches) {
    if (!byRound.has(m.round_number)) byRound.set(m.round_number, [])
    byRound.get(m.round_number)!.push(m)
  }

  const roundNumbers = [...byRound.keys()].sort((a, b) => a - b)
  const totalRounds = roundNumbers.length
  if (totalRounds === 0) return null
  for (let i = 0; i < totalRounds; i++) {
    if (roundNumbers[i] !== i + 1) return null // rondas 1..totalRounds sin huecos
  }

  const firstRoundSize = byRound.get(1)!.length
  if (!isPowerOfTwo(firstRoundSize)) return null

  for (let r = 1; r <= totalRounds; r++) {
    const expected = firstRoundSize / 2 ** (r - 1)
    if (!Number.isInteger(expected) || expected < 1) return null
    const roundMatches = byRound.get(r)!
    if (roundMatches.length !== expected) return null
    for (let p = 0; p < expected; p++) {
      if (!roundMatches.some((m) => m.position === p)) return null
    }
  }
  const lastRoundExpectedSize = firstRoundSize / 2 ** (totalRounds - 1)
  if (lastRoundExpectedSize !== 1) return null // la última ronda tiene que ser la final (1 partido)

  const rounds: BracketTreeRound[] = roundNumbers.map((r) => {
    const roundMatches = [...byRound.get(r)!].sort((a, b) => a.position - b.position)
    return {
      roundNumber: r,
      label: bracketRoundLabel(r, totalRounds),
      matches: roundMatches.map((m) => ({
        id: m.id,
        position: m.position,
        a: toSide(m.participant_a_id, participants),
        b: toSide(m.participant_b_id, participants),
        score: m.score,
        winnerId: m.winner_id,
        isBye: r === 1 && !!m.participant_a_id && !m.participant_b_id,
        isWalkover: m.is_walkover,
        status: m.status,
      })),
    }
  })

  const finalMatch = rounds[rounds.length - 1].matches[0]
  const champion = finalMatch.winnerId
    ? { id: finalMatch.winnerId, name: participants[finalMatch.winnerId]?.name ?? "?" }
    : null
  const finalScore = finalMatch.winnerId ? finalMatch.score : null

  return { rounds, champion, finalScore }
}
