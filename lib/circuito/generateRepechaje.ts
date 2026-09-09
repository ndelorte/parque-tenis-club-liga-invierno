import type { CircuitoBracket, CircuitoFormatSpec, CircuitoParticipant } from "./types"
import { buildSingleElimination, sortBySeed } from "./generateBracket"

// El repechaje solo existe cuando el cuadro principal es eliminación simple
// (8+ inscriptos, ver reglas-circuito-del-parque.md) y solo entran quienes
// perdieron su partido de 1ª ronda — un bye no genera perdedor. Se arma
// recién cuando esos resultados están cargados (Sprint C5), por eso recibe
// la lista de perdedores ya resuelta en vez de calcularla acá. Usa el mismo
// armado de eliminación simple que el cuadro principal (mismo criterio de
// seeding/byes, ver reglas).
export function generateRepechaje(
  mainBracketFormat: CircuitoBracket["format"],
  round1Losers: CircuitoParticipant[],
  spec: CircuitoFormatSpec,
): CircuitoBracket | null {
  if (spec.repechaje.eligibility === "none") return null
  if (mainBracketFormat !== "single_elimination") return null
  // Con 0 o 1 perdedor de 1ª ronda (caso extremo: casi todo el cuadro entró
  // por bye) no hay con quién armar un partido — no tiene sentido un
  // "repechaje" de una sola persona.
  if (round1Losers.length < 2) return null

  return buildSingleElimination(sortBySeed(round1Losers), spec.byePolicy)
}
