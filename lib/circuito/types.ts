// Motor de cuadros del Circuito del Parque — tipos puros, sin dependencia de
// Supabase ni de lib/tournament/lib/playoffs (aislamiento, ver ADR-002).
//
// El formato ilustrativo de plan-liga-multitemporada-y-circuito.md §4.5 se
// refina acá con los 4 formatos reales que confirmó C0
// (reglas-circuito-del-parque.md): round-robin+final (N=4), round-robin puro
// sin final (N=5), zonas+llave (N=6-7) y eliminación simple+repechaje (N≥8).
// Un solo drawRule por rango de N — es DATO (CircuitoFormatSpec), no un
// `if (n === ...)` en el motor.

export interface CircuitoParticipant {
  id: string
  seed: number | null
}

export type DrawFormatKind =
  | "round_robin_with_final" // N=4: zona única, los 2 primeros juegan la final
  | "round_robin_pure" // N=5: zona única, sin final — campeón = 1° de la tabla
  | "groups_then_knockout" // N=6-7: dos zonas, 2 primeros de c/u a semifinal, hay final
  | "single_elimination" // N≥8: byes a potencia de 2, repechaje aparte

export interface DrawRule {
  minN: number
  maxN: number | null // null = sin techo
  format: DrawFormatKind
}

export type SeedingSource = "ranking" | "manual"
export type ByePolicy = "top_seeds"

export interface RepechajeSpec {
  eligibility: "all_r1_losers" | "none"
  winnerReentersMain: boolean
}

export interface MatchFormatSpec {
  bestOf: number
  thirdSet: "7-6_fixed" | "real"
  finalUsesRealThirdSet: boolean // excepción de reglas-circuito-del-parque.md: en la final, 3er set real
  walkover: boolean
}

export interface CircuitoFormatSpec {
  drawRules: DrawRule[]
  seedingSource: SeedingSource
  byePolicy: ByePolicy
  repechaje: RepechajeSpec
  match: MatchFormatSpec
}

// ── Cuadro generado ──────────────────────────────────────────────

export interface BracketMatch {
  round: number
  group: "A" | "B" | null
  participantA: CircuitoParticipant | null // null = bye o todavía no definido (TBD)
  participantB: CircuitoParticipant | null
  isBye: boolean // true = participantA avanza automático, no se juega
}

export interface CircuitoBracket {
  format: DrawFormatKind
  rounds: BracketMatch[][] // rounds[0] = ronda 1 (o la zona única en formatos round-robin)
}
