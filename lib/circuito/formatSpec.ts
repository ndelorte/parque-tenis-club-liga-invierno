// CircuitoFormatSpec canónica — todas las categorías comparten la misma
// (reglas-circuito-del-parque.md: "no hay reglas diferenciadas por
// categoría"). No hardcodear estos valores en generateBracket.ts: el motor
// los interpreta como datos, así que un cambio de regla es un cambio acá,
// no en el código del motor.

import type { CircuitoFormatSpec } from "./types"

export const CIRCUITO_FORMAT_SPEC: CircuitoFormatSpec = {
  drawRules: [
    { minN: 4, maxN: 4, format: "round_robin_with_final" },
    { minN: 5, maxN: 5, format: "round_robin_pure" },
    { minN: 6, maxN: 7, format: "groups_then_knockout" },
    { minN: 8, maxN: null, format: "single_elimination" },
  ],
  // Ranking vigente del año en curso (o del año anterior si todavía no hay
  // resultados del año en curso); el primer torneo de 2026 es la única
  // excepción manual — eso lo resuelve quien arma el seed, no el motor.
  seedingSource: "ranking",
  byePolicy: "top_seeds",
  repechaje: {
    eligibility: "all_r1_losers",
    winnerReentersMain: false,
  },
  match: {
    bestOf: 3,
    thirdSet: "7-6_fixed",
    finalUsesRealThirdSet: true,
    walkover: true,
  },
}
