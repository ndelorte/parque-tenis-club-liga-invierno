// El score del Circuito se guarda siempre como "lado A – lado B" (el orden
// de participant_a / participant_b del partido). Cuando el ganador es B, un
// score como "0-6 2-6" mostrado junto a su nombre se lee al revés. Esta
// función devuelve el score contado desde el lado del ganador ("6-0 6-2").
//
// Formatos que entiende (los que acepta parseCircuitoScore y los que traen
// los imports de Challonge): sets separados por espacios, cada uno "a-b",
// con tie-break opcional entre paréntesis ("7-6(5)", que son los puntos del
// perdedor del tie-break y no se invierten) y super tie-break como set
// ("10-8") o entre corchetes ("[10-8]"). Si algún set no se puede
// interpretar se devuelve el texto original sin tocar, para no mostrar un
// score inventado.

export type ScoreWinnerSide = "a" | "b"

const SET_PATTERN = /^(\d+)-(\d+)(\(\d+\))?$/
const BRACKET_SET_PATTERN = /^\[(\d+)-(\d+)\]$/

function flipSet(token: string): string | null {
  const plain = SET_PATTERN.exec(token)
  if (plain) return `${plain[2]}-${plain[1]}${plain[3] ?? ""}`
  const bracket = BRACKET_SET_PATTERN.exec(token)
  if (bracket) return `[${bracket[2]}-${bracket[1]}]`
  return null
}

export function scoreFromWinnerSide(score: string | null | undefined, winnerSide: ScoreWinnerSide): string {
  if (!score || !score.trim()) return ""
  if (winnerSide === "a") return score

  const flipped: string[] = []
  for (const token of score.trim().split(/\s+/)) {
    const set = flipSet(token)
    if (set === null) return score
    flipped.push(set)
  }
  return flipped.join(" ")
}
