// Árbol del cuadro de eliminación directa del Circuito del Parque, para la
// vista horizontal (escritorio) y por rondas (celular). Excepción aprobada
// de product/plan-refactor-visual.md §4.3/§8: lógica de PRESENTACIÓN nueva en
// lib/circuito/ (no decide reglas deportivas, solo organiza partidos ya
// jugados/generados en una estructura de árbol).
//
// Dos caminos para armar el árbol, en este orden:
//
// 1. Por posiciones (buildBracketTreeByPosition): asume que round/position
//    ya describen el árbol (round 1 = n partidos, cada ronda siguiente = la
//    mitad, posiciones 0..k-1 sin huecos, hasta 1 partido en la última
//    ronda) Y que cada partido (r,p) está alimentado por los ganadores de
//    (r-1,2p) y (r-1,2p+1). Esto es lo que arma el motor del panel
//    (generateBracket.ts + syncBracketSlots.ts).
//
// 2. Reconstrucción desde resultados (reconstructBracketFromResults): para
//    cuando el camino anterior falla. Los cuadros importados de Challonge
//    (scripts/import-challonge.ts) solo guardan partidos jugados (sin byes
//    como filas) y `position` es el orden de la API, no el lugar en el
//    cuadro — no cierran ni la cantidad ni el enlace por posición. Acá se
//    reconstruye el árbol de atrás para adelante desde la final, siguiendo
//    winner_id ronda por ronda; un hueco en la ronda 1 se interpreta como
//    bye.
//
// Si ninguno de los dos arma un árbol válido, devuelve null y la UI cae a la
// vista por lista (classifyMainBracketSections de bracketDisplay.ts).

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

// Arma el BracketTree final a partir de un Map ronda→partidos donde cada
// partido ya tiene la `position` correcta (0..k-1) dentro de su ronda.
// Compartido por los 2 caminos (por posiciones y reconstrucción).
function finalizeTree(
  matchesByRound: Map<number, BracketTreeMatchInput[]>,
  roundNumbers: number[],
  totalRounds: number,
  participants: Record<string, BracketTreeParticipant>,
  strictByes = false,
): BracketTree {
  // Con strictByes (repechaje), un lugar con un solo participante es "pase
  // libre" recién cuando ese participante ya avanzó a la ronda siguiente;
  // antes está esperando rival.
  const advanced = new Set(
    (matchesByRound.get(2) ?? []).flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id),
  )
  const rounds: BracketTreeRound[] = roundNumbers.map((r) => {
    const roundMatches = [...matchesByRound.get(r)!].sort((a, b) => a.position - b.position)
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
        isBye: r === 1 && !!m.participant_a_id && !m.participant_b_id && (!strictByes || advanced.has(m.participant_a_id)),
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

// Quién avanza de un partido: el winner_id si ya se jugó, o (solo en la
// ronda 1) el único participante de un bye, aunque el bye no tenga
// winner_id cargado (mismo criterio que winnerOf() en syncBracketSlots.ts —
// un bye del panel no "necesita carga de resultado", ver modelo-datos.md).
function advancerOf(m: BracketTreeMatchInput): string | null {
  if (m.winner_id) return m.winner_id
  if (m.round_number === 1 && m.participant_a_id && !m.participant_b_id) return m.participant_a_id
  return null
}

// Para cada partido (r,p) con r>1, quien avanza de (r-1,2p) tiene que ser su
// lado A y quien avanza de (r-1,2p+1) su lado B — si no, `position` no
// describe el árbol real (típico de un import de Challonge, donde
// `position` es el orden de la API) aunque las cantidades por ronda hayan
// cerrado. Un lado todavía sin definir (partido futuro) no hace fallar el
// chequeo.
function isLinkedByPosition(byRound: Map<number, BracketTreeMatchInput[]>, roundNumbers: number[]): boolean {
  for (let i = 1; i < roundNumbers.length; i++) {
    const r = roundNumbers[i]
    const prevByPosition = new Map(byRound.get(roundNumbers[i - 1])!.map((m) => [m.position, m]))
    for (const m of byRound.get(r)!) {
      const feederA = prevByPosition.get(m.position * 2)
      const feederB = prevByPosition.get(m.position * 2 + 1)
      if (m.participant_a_id && (!feederA || advancerOf(feederA) !== m.participant_a_id)) return false
      if (m.participant_b_id && (!feederB || advancerOf(feederB) !== m.participant_b_id)) return false
    }
  }
  return true
}

function buildBracketTreeByPosition(
  matches: BracketTreeMatchInput[],
  participants: Record<string, BracketTreeParticipant>,
  strictByes: boolean,
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

  if (!isLinkedByPosition(byRound, roundNumbers)) return null

  return finalizeTree(byRound, roundNumbers, totalRounds, participants, strictByes)
}

// Reconstruye el árbol de atrás para adelante desde la final, siguiendo
// winner_id ronda por ronda — para cuadros donde `round_number`/`position`
// no describen el árbol (import de Challonge: solo guarda partidos jugados,
// sin byes como filas, y `position` es el orden de la API). Ver cabecera
// del archivo.
export function reconstructBracketFromResults(
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
  for (let i = 0; i < totalRounds; i++) {
    if (roundNumbers[i] !== i + 1) return null // rondas 1..totalRounds sin huecos
  }

  const finalRoundMatches = byRound.get(totalRounds)!
  if (finalRoundMatches.length !== 1) return null // la última ronda tiene que ser 1 sola final
  const finalMatch = finalRoundMatches[0]

  // Cada partido real se usa una sola vez — se va marcando a medida que se
  // lo encuentra como alimentador. La final entra directo (no se "busca").
  const used = new Set<string>([finalMatch.id])
  const outByRound = new Map<number, BracketTreeMatchInput[]>()
  for (let r = 1; r <= totalRounds; r++) outByRound.set(r, [])

  // Alimentador del lado `participantId` de un partido de `round`: el
  // partido de `round - 1` cuyo winner_id sea ese participante. Si no existe
  // y round-1 es la ronda 1, el participante avanzó por bye (se crea un
  // partido virtual de ronda 1 con id sintético estable); si round-1 > 1 y
  // no existe, los datos son inconsistentes.
  function resolveSide(round: number, participantId: string): boolean {
    const feederRound = round - 1
    const feeder = (byRound.get(feederRound) ?? []).find((c) => advancerOf(c) === participantId)
    if (feeder) {
      if (used.has(feeder.id)) return false // ya alimentaba a otro partido: dato inconsistente
      used.add(feeder.id)
      return expand(feederRound, feeder)
    }
    if (feederRound === 1) {
      const round1 = outByRound.get(1)!
      round1.push({
        id: `bye-${participantId}`,
        round_number: 1,
        position: round1.length,
        participant_a_id: participantId,
        participant_b_id: null,
        score: null,
        winner_id: null,
        status: "bye",
        is_walkover: false,
      })
      return true
    }
    return false // ronda intermedia sin partido alimentador real: dato inconsistente
  }

  // Agrega `m` a su ronda de salida (con la position que le toca según el
  // orden de la recursión) y, si no es la ronda 1, resuelve sus 2 lados
  // (A primero, luego B) contra la ronda anterior. El recorrido
  // izquierda-a-derecha en profundidad reproduce exactamente el orden de
  // posiciones del árbol real en cada ronda.
  function expand(round: number, m: BracketTreeMatchInput): boolean {
    const roundArr = outByRound.get(round)!
    roundArr.push({ ...m, position: roundArr.length })
    if (round === 1) return true
    if (!m.participant_a_id || !m.participant_b_id) return false // partido real de ronda >1 con un lado vacío: dato inconsistente
    return resolveSide(round, m.participant_a_id) && resolveSide(round, m.participant_b_id)
  }

  if (!expand(totalRounds, finalMatch)) return null

  // Sobran partidos reales que no alimentan a nadie en la cadena desde la final.
  if (used.size !== matches.length) return null

  const firstRoundSize = outByRound.get(1)!.length
  if (!isPowerOfTwo(firstRoundSize)) return null // salvaguarda: no debería fallar si la recursión anduvo bien

  return finalizeTree(outByRound, roundNumbers, totalRounds, participants)
}

export function buildBracketTree(
  matches: BracketTreeMatchInput[],
  participants: Record<string, BracketTreeParticipant>,
  options: { strictByes?: boolean } = {},
): BracketTree | null {
  return (
    buildBracketTreeByPosition(matches, participants, options.strictByes ?? false) ??
    reconstructBracketFromResults(matches, participants)
  )
}
