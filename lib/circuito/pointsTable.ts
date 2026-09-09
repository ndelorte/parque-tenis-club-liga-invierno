// Escala de puntos por instancia — reglas-circuito-del-parque.md, sección
// "Puntos y ranking". Enero/Mayo/Julio/Septiembre son "Grand Slam" (escala
// mayor); el resto de los meses usan la escala "normal". El repechaje nunca
// otorga puntos, sea cual sea su resultado.

export type CircuitoInstance =
  | "champion"
  | "runner_up"
  | "semifinalist"
  | "quarterfinalist"
  | "round_of_16" // "Octavos" (16 jugadores completan esta ronda)
  | "round_of_32_plus" // "16vos o más" — eliminado antes de octavos

const GRAND_SLAM_MONTHS = new Set([1, 5, 7, 9])

export function isGrandSlamMonth(month: number): boolean {
  return GRAND_SLAM_MONTHS.has(month)
}

const POINTS_TABLE: Record<"grandSlam" | "normal", Record<CircuitoInstance, number>> = {
  grandSlam: {
    champion: 2000,
    runner_up: 1300,
    semifinalist: 800,
    quarterfinalist: 400,
    round_of_16: 200,
    round_of_32_plus: 100,
  },
  normal: {
    champion: 1000,
    runner_up: 650,
    semifinalist: 400,
    quarterfinalist: 200,
    round_of_16: 100,
    round_of_32_plus: 50,
  },
}

export function pointsForInstance(instance: CircuitoInstance, isGrandSlam: boolean): number {
  return POINTS_TABLE[isGrandSlam ? "grandSlam" : "normal"][instance]
}
