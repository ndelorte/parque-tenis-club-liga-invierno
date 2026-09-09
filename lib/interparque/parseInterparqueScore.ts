export interface InterparqueSet {
  a: number
  b: number
}

export interface ParsedInterparqueScore {
  set1: InterparqueSet
  set2: InterparqueSet
  superTiebreak: InterparqueSet | null
}

function parseSetPart(part: string): InterparqueSet {
  if (!part.includes("-")) throw new Error(`Set mal formateado: "${part}"`)
  const [aStr, bStr] = part.split("-")
  const a = parseInt(aStr, 10)
  const b = parseInt(bStr, 10)
  if (isNaN(a) || isNaN(b)) throw new Error(`Score inválido: "${part}"`)
  if (a === b) throw new Error(`Set empatado inválido: "${part}"`)
  return { a, b }
}

function isValidSuperTiebreak({ a, b }: InterparqueSet): boolean {
  const winner = Math.max(a, b)
  const loser = Math.min(a, b)
  if (winner < 10) return false
  if (winner - loser < 2) return false
  return true
}

/**
 * Parsea el score de un partido de Interparque: 2 sets obligatorios +
 * super tie-break opcional (solo si los sets quedaron 1-1). A diferencia
 * de `lib/tournament/parseScore.ts` (Liga Invierno), el super tie-break
 * NO tiene un score fijo — gana quien llega a 10+ puntos con 2 de
 * diferencia (ej. "10-8", "11-9", "12-10").
 */
export function parseInterparqueScore(score: string): ParsedInterparqueScore {
  if (!score || !score.trim()) throw new Error("Score vacío")

  const parts = score.trim().split(/\s+/)
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Score inválido: debe tener 2 o 3 sets, recibido "${score}"`)
  }

  const set1 = parseSetPart(parts[0])
  const set2 = parseSetPart(parts[1])

  const set1WinnerA = set1.a > set1.b
  const set2WinnerA = set2.a > set2.b
  const setsSplit = set1WinnerA !== set2WinnerA

  if (parts.length === 3) {
    if (!setsSplit) {
      throw new Error(
        "El tercer set (super tie-break) solo corresponde si los primeros dos sets quedaron 1-1.",
      )
    }
    const superTiebreak = parseSetPart(parts[2])
    if (!isValidSuperTiebreak(superTiebreak)) {
      throw new Error(
        `Super tie-break inválido: "${parts[2]}". Gana quien llega a 10+ puntos con 2 de diferencia (ej. "10-8", "11-9").`,
      )
    }
    return { set1, set2, superTiebreak }
  }

  if (setsSplit) {
    throw new Error(
      "Los sets quedaron 1-1: falta el tercer set (super tie-break).",
    )
  }

  return { set1, set2, superTiebreak: null }
}
