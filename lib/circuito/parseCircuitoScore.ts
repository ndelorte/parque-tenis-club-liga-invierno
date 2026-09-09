// Parsea el score de un partido del Circuito. Formato igual al de
// lib/tournament/parseScore.ts (Liga/Mid Master) salvo por una excepción de
// reglas-circuito-del-parque.md: el 3er set es siempre "7-6" fijo, EXCEPTO
// en la final de cada categoría, donde se juega completo y se registra con
// el score real. Por eso no se puede reusar parseScore tal cual (ADR-002 +
// nota de generateBracket.ts §4.5 del plan) — created acá un parser propio
// que acepta un flag `isFinal`.

export interface ParsedCircuitoScore {
  sets: Array<{ a: number; b: number }>
  setsWonA: number
  setsWonB: number
  gamesWonA: number
  gamesWonB: number
}

export function parseCircuitoScore(score: string, options: { isFinal: boolean }): ParsedCircuitoScore {
  if (!score || !score.trim()) throw new Error("Score vacío")

  const parts = score.trim().split(/\s+/)
  if (parts.length < 2) throw new Error(`Score inválido: debe tener al menos 2 sets, recibido "${score}"`)
  if (parts.length > 3) throw new Error(`Score inválido: no puede tener más de 3 sets, recibido "${score}"`)

  const sets = parts.map((part) => {
    if (!part.includes("-")) throw new Error(`Set mal formateado: "${part}"`)
    const [aStr, bStr] = part.split("-")
    const a = parseInt(aStr, 10)
    const b = parseInt(bStr, 10)
    if (isNaN(a) || isNaN(b)) throw new Error(`Score inválido: "${part}"`)
    if (a === b) throw new Error(`Set empatado inválido: "${part}"`)
    return { a, b }
  })

  if (sets.length === 3 && !options.isFinal) {
    const third = sets[2]
    const valid = (third.a === 7 && third.b === 6) || (third.a === 6 && third.b === 7)
    if (!valid) {
      throw new Error(
        `Tercer set inválido: debe ser 7-6 o 6-7 (fijo, salvo en la final), recibido "${parts[2]}"`,
      )
    }
  }

  let setsWonA = 0
  let setsWonB = 0
  let gamesWonA = 0
  let gamesWonB = 0

  for (const set of sets) {
    if (set.a > set.b) setsWonA++
    else setsWonB++
    gamesWonA += set.a
    gamesWonB += set.b
  }

  return { sets, setsWonA, setsWonB, gamesWonA, gamesWonB }
}
