import { classifyMainBracketSections, type DisplayMatch } from "./bracketDisplay"
import type { CircuitoBracketMatchResult } from "./calculateRankingPoints"
import type { DrawFormatKind } from "./types"

// El motor propio persiste round/zone con una semántica limpia (round 1 = zona,
// 2 = final o semis, 3 = final). El import de Challonge guarda el `round` crudo
// de su API: en las categorías de zona (4, 5, 6-7 inscriptos) son fechas de la
// zona, y la final es la REVANCHA de un par que ya se había enfrentado, en
// cualquier posición. Para calcular los puntos hay que reconstruir qué partido
// es qué (mismo criterio que la página pública: bracketDisplay.ts).
//
// Si el cuadro ya viene numerado como lo arma el motor, se devuelve igual.
export function normalizeZoneMatches(
  format: DrawFormatKind,
  matches: CircuitoBracketMatchResult[],
): CircuitoBracketMatchResult[] {
  if (format === "single_elimination") return matches

  const main = matches.filter((m) => m.bracket === "main")
  const rest = matches.filter((m) => m.bracket !== "main")
  if (main.length === 0) return matches

  if (alreadyEngineNumbered(format, main)) return matches

  // Orden estable por ronda y posición: la "segunda vez que se enfrentan" depende del orden.
  const ordered = main
    .map((m, index) => ({ m, index }))
    .sort((a, b) => a.m.round - b.m.round || (a.m.position ?? 0) - (b.m.position ?? 0) || a.index - b.index)
    .map((x) => x.m)

  const display: DisplayMatch[] = ordered.map((m, i) => ({
    id: String(i),
    round_number: m.round,
    participant_a_id: m.participantAId,
    participant_b_id: m.participantBId,
    score: m.score,
    winner_id: m.winnerId,
    status: m.winnerId ? "played" : "pending",
  }))
  const sections = classifyMainBracketSections(display)
  const sectionOf = new Map<string, string>()
  for (const s of sections) for (const d of s.matches) sectionOf.set(d.id, s.label)

  const relabel = (label: string | undefined): { round: number; zone: "A" | "B" | null } | null => {
    if (!label) return null
    if (format === "round_robin_pure") return { round: 1, zone: null }
    if (format === "round_robin_with_final") {
      if (label === "Final") return { round: 2, zone: null }
      if (label.startsWith("Fase de grupos")) return { round: 1, zone: null }
    }
    if (format === "groups_then_knockout") {
      if (label === "Zona A") return { round: 1, zone: "A" }
      if (label === "Zona B") return { round: 1, zone: "B" }
      if (label === "Semifinales") return { round: 2, zone: null }
      if (label === "Final") return { round: 3, zone: null }
    }
    return null
  }

  // Si algo no se pudo reconstruir con confianza, no se toca ese partido
  // (mejor sin puntos que con puntos mal asignados).
  const normalized = ordered.map((m, i) => {
    const r = relabel(sectionOf.get(String(i)))
    return r ? { ...m, round: r.round, zone: r.zone } : m
  })
  return [...normalized, ...rest]
}

function alreadyEngineNumbered(format: DrawFormatKind, main: CircuitoBracketMatchResult[]): boolean {
  const countRound = (r: number) => main.filter((m) => m.round === r).length
  switch (format) {
    case "round_robin_pure":
      return main.every((m) => m.round === 1)
    case "round_robin_with_final":
      return main.every((m) => m.round === 1 || m.round === 2) && countRound(2) <= 1
    case "groups_then_knockout":
      return main.some((m) => m.zone !== null)
    default:
      return true
  }
}
