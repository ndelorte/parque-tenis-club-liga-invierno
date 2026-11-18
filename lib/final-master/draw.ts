// Lógica pura del Final Master (sin Supabase): orden de los clasificados,
// reparto en zonas y fixture de todos contra todos. Formato y reglas en
// product/reglas-circuito-del-parque.md, "Mid Master y Final Master".

export const FINAL_MASTER_MIN_ENTRIES = 6
export const FINAL_MASTER_MAX_ENTRIES = 8

export interface FinalMasterEntryRanking {
  id: string
  // Orden en que se cargó (1 = el primero).
  loadOrder: number
  // Puntos del ranking anual del circuito en la categoría (en dobles, la suma
  // de los dos). 0 = sin ranking.
  rankingPoints: number
  // Mejor puesto en el ranking anual (en dobles, el mejor de los dos). Ya
  // trae aplicado el desempate del ranking (menos torneos jugados, más
  // ganados). null = sin ranking.
  rankingPosition: number | null
}

// Orden de los clasificados: primero los que tienen ranking (más puntos
// arriba; a igual puntaje, el puesto del ranking anual), después los que no
// tienen, en el orden en que se cargaron.
export function orderByRanking<T extends FinalMasterEntryRanking>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const aRanked = a.rankingPoints > 0
    const bRanked = b.rankingPoints > 0
    if (aRanked !== bRanked) return aRanked ? -1 : 1
    if (aRanked) {
      if (a.rankingPoints !== b.rankingPoints) return b.rankingPoints - a.rankingPoints
      const ap = a.rankingPosition ?? Number.MAX_SAFE_INTEGER
      const bp = b.rankingPosition ?? Number.MAX_SAFE_INTEGER
      if (ap !== bp) return ap - bp
    }
    return a.loadOrder - b.loadOrder
  })
}

// Zona de cada puesto, en serpentina: A = 1°, 4°, 5°, 8° · B = 2°, 3°, 6°, 7°.
// Con 7 queda A de 3 y B de 4; con 6, 3 y 3.
export function serpentineZone(seed: number): "A" | "B" {
  const posInPair = (seed - 1) % 4
  return posInPair === 0 || posInPair === 3 ? "A" : "B"
}

// Todos contra todos (método del círculo): cada ronda es una "fecha" en la
// que nadie juega dos veces. Con cantidad impar, uno libra por ronda.
export function roundRobinPairs<T>(items: T[]): Array<[T, T]> {
  const BYE = Symbol("bye")
  const list: Array<T | typeof BYE> = [...items]
  if (list.length % 2 === 1) list.push(BYE)
  const n = list.length
  const pairs: Array<[T, T]> = []
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]
      const b = list[n - 1 - i]
      if (a !== BYE && b !== BYE) pairs.push([a as T, b as T])
    }
    // Rota todos menos el primero.
    list.splice(1, 0, list.pop()!)
  }
  return pairs
}

export interface FinalMasterDrawEntry {
  id: string
  seed: number
  zone: "A" | "B"
}

// Sorteo de una categoría: puestos 1..n por ranking y zona en serpentina.
export function drawFinalMaster<T extends FinalMasterEntryRanking>(entries: T[]): FinalMasterDrawEntry[] {
  if (entries.length < FINAL_MASTER_MIN_ENTRIES || entries.length > FINAL_MASTER_MAX_ENTRIES) {
    throw new Error(
      `Para armar los cuadros hacen falta entre ${FINAL_MASTER_MIN_ENTRIES} y ${FINAL_MASTER_MAX_ENTRIES} jugadores (hay ${entries.length}).`,
    )
  }
  return orderByRanking(entries).map((e, i) => ({ id: e.id, seed: i + 1, zone: serpentineZone(i + 1) }))
}
