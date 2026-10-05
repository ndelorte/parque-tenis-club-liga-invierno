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

// `superTiebreakAsSet`: solo para el DESEMPATE y las tablas de zona. Los
// partidos importados de Challonge traen el 3er set como supertiebreak real
// ("10-3", "5-10", "13-15"); para contar sets y games se lo toma como el
// 7-6 o 6-7 fijo que prevé el reglamento (gana el set quien ganó el
// supertiebreak). No cambia el score guardado ni lo que se acepta al cargar
// un resultado.
export function parseCircuitoScore(
  score: string,
  options: { isFinal: boolean; superTiebreakAsSet?: boolean },
): ParsedCircuitoScore {
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
    if (!valid && options.superTiebreakAsSet) {
      const hi = Math.max(third.a, third.b)
      const lo = Math.min(third.a, third.b)
      const isRealSet = (hi === 6 && lo <= 4) || (hi === 7 && lo >= 5)
      // Un set completo (6-4, 7-5) se cuenta tal cual; lo que no es un set
      // real (10-3, 5-10, 3-7, 13-15) es el supertiebreak: vale 7-6 o 6-7.
      if (!isRealSet && hi >= 7 && hi - lo >= 2) sets[2] = third.a > third.b ? { a: 7, b: 6 } : { a: 6, b: 7 }
      else if (!isRealSet) throw new Error(`Tercer set no interpretable: "${parts[2]}"`)
    } else if (!valid) {
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
