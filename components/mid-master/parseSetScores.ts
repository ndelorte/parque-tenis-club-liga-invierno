export interface SetScore {
  a: number
  b: number
}

/**
 * Parsea un score ya validado y persistido (formato "6-4 3-6 6-3", ver
 * lib/mid-master/parseMmScore.ts) en pares por set, solo para poder
 * mostrarlo en columnas separadas (una por set) como pide la maqueta.
 *
 * No determina ganador de partido ni aplica ninguna regla deportiva: el
 * ganador del match ya viene resuelto en match.winnerId/status. Comparar
 * a vs b dentro de un mismo set es aritmética trivial sobre los números que
 * ya están en el string, no una regla a inventar.
 *
 * Si el string no matchea el formato esperado, devuelve [] y el caller debe
 * mostrar el string crudo como fallback.
 */
export function parseSetScores(score: string | undefined): SetScore[] {
  if (!score?.trim()) return []
  const parts = score.trim().split(/\s+/)
  const sets: SetScore[] = []
  for (const part of parts) {
    const match = /^(\d+)-(\d+)$/.exec(part)
    if (!match) return []
    sets.push({ a: Number(match[1]), b: Number(match[2]) })
  }
  return sets
}
