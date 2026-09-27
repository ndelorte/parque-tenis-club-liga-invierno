// Búsqueda de jugadores por nombre para los autocompletar del panel. Sin
// distinguir mayúsculas ni acentos ("gomez" encuentra "Gómez"), y con varias
// palabras en cualquier orden ("delor nico" encuentra "Nicolás Delorte").

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

export function searchPlayers<T extends { displayName: string }>(players: T[], query: string, limit = 8): T[] {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const matches: Array<{ player: T; prefixHits: number }> = []
  for (const player of players) {
    const name = normalizeForSearch(player.displayName)
    if (!terms.every((term) => name.includes(term))) continue
    // Primero los que tienen palabras que EMPIEZAN con lo escrito (apellido
    // o nombre), después los que solo lo contienen en el medio.
    const words = name.split(/\s+/)
    const prefixHits = terms.filter((term) => words.some((word) => word.startsWith(term))).length
    matches.push({ player, prefixHits })
  }

  return matches
    .sort((a, b) => b.prefixHits - a.prefixHits || a.player.displayName.localeCompare(b.player.displayName, "es"))
    .slice(0, limit)
    .map((m) => m.player)
}
