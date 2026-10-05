// Detección de jugadores duplicados por nombre, para que el ranking sume los
// puntos de una misma persona en un solo player_id.
//
// - "same": mismas palabras, sin importar mayúsculas, acentos, signos ni
//   orden ("Pérez, Juan" = "juan perez" = "Juan Pérez").
// - "similar": palabras casi iguales (un error de tipeo, una inicial, un
//   apellido de más). Hay que revisarlo a mano: puede ser otra persona.

export type NameMatch = "same" | "similar"

export function nameTokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

// Misma clave = mismo nombre en cualquier orden.
export function nameKey(name: string): string {
  return nameTokens(name).sort().join(" ")
}

// Distancia de edición con intercambio de letras contiguas ("Kilmunda" vs
// "Klimunda" cuesta 1, no 2).
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

// Dos palabras "casi iguales": un error de tipeo (o dos letras cambiadas de
// lugar) en palabras de 5+ letras, hasta dos errores en palabras de 7+, o una
// inicial ("n" por "nicolas").
function tokensClose(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length === 1 || b.length === 1) return a[0] === b[0]
  const shortest = Math.min(a.length, b.length)
  const distance = editDistance(a, b)
  return (shortest >= 5 && distance <= 1) || (shortest >= 7 && distance <= 2)
}

// Cada palabra de `small` encuentra una palabra distinta de `big`.
function allMatched(small: string[], big: string[]): boolean {
  const used = new Set<number>()
  return small.every((t) => {
    const i = big.findIndex((u, idx) => !used.has(idx) && tokensClose(t, u))
    if (i === -1) return false
    used.add(i)
    return true
  })
}

export function compareNames(a: string, b: string): NameMatch | null {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  if (ta.length === 0 || tb.length === 0) return null
  if (ta.length === tb.length && ta.slice().sort().join(" ") === tb.slice().sort().join(" ")) return "same"

  const [small, big] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  // Una sola palabra suelta ("Juan") coincide con medio mundo: no cuenta.
  if (small.length < 2) return null
  return allMatched(small, big) ? "similar" : null
}

export interface NamedPlayer {
  id: string
  displayName: string
}

export function findSimilarPlayers<T extends NamedPlayer>(
  players: T[],
  name: string,
  excludeId?: string,
): Array<{ player: T; match: NameMatch }> {
  const found: Array<{ player: T; match: NameMatch }> = []
  for (const player of players) {
    if (player.id === excludeId) continue
    const match = compareNames(name, player.displayName)
    if (match) found.push({ player, match })
  }
  return found.sort((x, y) => (x.match === y.match ? 0 : x.match === "same" ? -1 : 1))
}

export interface DuplicateCluster<T extends NamedPlayer> {
  players: T[]
  // "same": todos tienen las mismas palabras (se pueden unificar solos).
  // "similar": hay que revisarlo a mano.
  kind: NameMatch
}

// Agrupa los jugadores que parecen la misma persona (transitivo).
export function clusterDuplicates<T extends NamedPlayer>(players: T[]): Array<DuplicateCluster<T>> {
  const parent = players.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))

  // Mismas palabras: por clave, sin comparar de a pares.
  const byKey = new Map<string, number>()
  players.forEach((p, i) => {
    const key = nameKey(p.displayName)
    if (!key) return
    const first = byKey.get(key)
    if (first === undefined) byKey.set(key, i)
    else parent[find(i)] = find(first)
  })

  // Raíces de la agrupación por mismas palabras, antes de la comparación difusa.
  const sameRootOf = players.map((_, i) => find(i))

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (find(i) !== find(j) && compareNames(players[i].displayName, players[j].displayName)) parent[find(j)] = find(i)
    }
  }

  const groups = new Map<number, number[]>()
  players.forEach((_, i) => {
    const root = find(i)
    groups.set(root, [...(groups.get(root) ?? []), i])
  })

  return [...groups.values()]
    .filter((idxs) => idxs.length > 1)
    .map((idxs) => {
      // "same" si, antes de la comparación difusa, ya estaban todos unidos.
      const rootsBefore = new Set(idxs.map((i) => sameRootOf[i]))
      return { players: idxs.map((i) => players[i]), kind: (rootsBefore.size === 1 ? "same" : "similar") as NameMatch }
    })
}

// Se lanza al querer crear/renombrar un jugador con un nombre que ya parece
// existir; la UI muestra el cartel "¿es el mismo?".
export class SimilarPlayersError extends Error {
  constructor(
    public readonly similar: Array<{ id: string; displayName: string; match: NameMatch }>,
    message = "Ya hay jugadores con un nombre igual o parecido.",
  ) {
    super(message)
    this.name = "SimilarPlayersError"
  }
}
