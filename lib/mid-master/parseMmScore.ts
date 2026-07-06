export interface ParsedMmScore {
  setsA: number
  setsB: number
  gamesA: number
  gamesB: number
}

export function parseMmScore(score: string, isFinal = false): ParsedMmScore {
  if (!score?.trim()) throw new Error("Score vacío.")

  const parts = score.trim().split(/\s+/)
  if (parts.length < 2 || parts.length > 3) {
    throw new Error("El score debe tener 2 o 3 sets.")
  }

  const sets = parts.map((part) => {
    if (!part.includes("-")) throw new Error(`Set mal formateado: "${part}"`)
    const [aStr, bStr] = part.split("-")
    const a = parseInt(aStr, 10)
    const b = parseInt(bStr, 10)
    if (isNaN(a) || isNaN(b)) throw new Error(`Score inválido: "${part}"`)
    if (a === b) throw new Error(`Set empatado inválido: "${part}"`)
    return { a, b }
  })

  if (sets.length === 3 && !isFinal) {
    const third = sets[2]
    const valid =
      (third.a === 7 && third.b === 6) || (third.a === 6 && third.b === 7)
    if (!valid) {
      throw new Error('El tercer set debe ser 7-6 o 6-7 (supertiebreak).')
    }
  }

  let setsA = 0
  let setsB = 0
  let gamesA = 0
  let gamesB = 0

  for (const set of sets) {
    if (set.a > set.b) setsA++
    else setsB++
    gamesA += set.a
    gamesB += set.b
  }

  return { setsA, setsB, gamesA, gamesB }
}

export function determineWinner(
  setsA: number,
  setsB: number,
  participantAId: string,
  participantBId: string,
): string {
  if (setsA > setsB) return participantAId
  if (setsB > setsA) return participantBId
  throw new Error("El match no tiene un ganador claro (sets iguales).")
}
