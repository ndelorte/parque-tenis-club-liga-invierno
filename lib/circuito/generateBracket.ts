import type {
  BracketMatch,
  ByePolicy,
  CircuitoBracket,
  CircuitoFormatSpec,
  CircuitoParticipant,
  DrawRule,
} from "./types"

export function selectDrawRule(n: number, spec: CircuitoFormatSpec): DrawRule | null {
  return spec.drawRules.find((r) => n >= r.minN && (r.maxN === null || n <= r.maxN)) ?? null
}

// Sembrados primero (seed ascendente = mejor ubicado), sin sembrar al final
// en orden estable por id. No decide DE DÓNDE sale el seed (ranking vs
// manual) — eso lo asigna quien arma la lista de participantes; el motor
// solo consume el valor ya asignado, de forma determinista.
export function sortBySeed(participants: CircuitoParticipant[], random?: () => number): CircuitoParticipant[] {
  const sorted = [...participants].sort((a, b) => {
    if (a.seed !== null && b.seed !== null) return a.seed - b.seed
    if (a.seed !== null) return -1
    if (b.seed !== null) return 1
    return a.id.localeCompare(b.id)
  })
  if (!random) return sorted

  // Sorteo de los no sembrados (Fisher-Yates); los sembrados quedan primero.
  const seededCount = sorted.filter((p) => p.seed !== null).length
  for (let i = sorted.length - 1; i > seededCount; i--) {
    const j = seededCount + Math.floor(random() * (i - seededCount + 1))
    ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
  }
  return sorted
}

export function nextPowerOfTwo(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

export function generateBracket(
  participants: CircuitoParticipant[],
  spec: CircuitoFormatSpec,
  // Si se pasa, los participantes sin seed se ubican al azar (en vez de por id).
  random?: () => number,
): CircuitoBracket {
  const ids = new Set(participants.map((p) => p.id))
  if (ids.size !== participants.length) {
    throw new Error("Hay participantes duplicados (id repetido)")
  }

  const n = participants.length
  const rule = selectDrawRule(n, spec)
  if (!rule) {
    throw new Error(
      `No hay drawRule para ${n} inscriptos — según reglas-circuito-del-parque.md, ` +
        `con menos de 4 inscriptos la categoría no se disputa ese mes.`,
    )
  }

  const seeded = sortBySeed(participants, random)

  switch (rule.format) {
    case "round_robin_with_final":
      return buildRoundRobinWithFinal(seeded)
    case "round_robin_pure":
      return buildRoundRobinPure(seeded)
    case "groups_then_knockout":
      return buildGroupsThenKnockout(seeded)
    case "single_elimination":
      return buildSingleElimination(seeded, spec.byePolicy)
  }
}

function allPairs(participants: CircuitoParticipant[], group: "A" | "B" | null): BracketMatch[] {
  const matches: BracketMatch[] = []
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        round: 1,
        group,
        participantA: participants[i],
        participantB: participants[j],
        isBye: false,
      })
    }
  }
  return matches
}

function tbdMatch(round: number, group: "A" | "B" | null = null): BracketMatch {
  return { round, group, participantA: null, participantB: null, isBye: false }
}

function buildRoundRobinPure(participants: CircuitoParticipant[]): CircuitoBracket {
  return { format: "round_robin_pure", rounds: [allPairs(participants, null)] }
}

function buildRoundRobinWithFinal(participants: CircuitoParticipant[]): CircuitoBracket {
  // La final la juegan los 2 primeros de la zona — recién se sabe cuando
  // termina la fase de todos-contra-todos (Sprint C5), por eso queda TBD.
  return {
    format: "round_robin_with_final",
    rounds: [allPairs(participants, null), [tbdMatch(2)]],
  }
}

// Reparto en serpentina por seed (1→A, 2→B, 3→B, 4→A, 5→A, 6→B, ...) para
// equilibrar el nivel de las 2 zonas — ver reglas-circuito-del-parque.md,
// sección "Seeding" (respuesta a OQ-36).
function splitIntoTwoZones(
  participants: CircuitoParticipant[],
): { zoneA: CircuitoParticipant[]; zoneB: CircuitoParticipant[] } {
  const zoneA: CircuitoParticipant[] = []
  const zoneB: CircuitoParticipant[] = []
  let block = 0
  let i = 0
  while (i < participants.length) {
    const target = block % 2 === 0 ? zoneA : zoneB
    // cada "bloque" tiene 2 lugares antes de alternar, salvo el primero (1 lugar)
    const blockSize = block === 0 ? 1 : 2
    for (let k = 0; k < blockSize && i < participants.length; k++, i++) {
      target.push(participants[i])
    }
    block++
  }
  return { zoneA, zoneB }
}

function buildGroupsThenKnockout(participants: CircuitoParticipant[]): CircuitoBracket {
  const { zoneA, zoneB } = splitIntoTwoZones(participants)
  const zoneMatches = [...allPairs(zoneA, "A"), ...allPairs(zoneB, "B")]
  // Semifinales cruzadas (1°A vs 2°B, 1°B vs 2°A) — TBD hasta que las zonas
  // terminen de jugarse. Sin partido de 3er puesto (ver reglas).
  const semifinals: BracketMatch[] = [tbdMatch(2), tbdMatch(2)]
  const final: BracketMatch[] = [tbdMatch(3)]
  return { format: "groups_then_knockout", rounds: [zoneMatches, semifinals, final] }
}

// Orden de las líneas del cuadro, de arriba abajo, expresado como posición
// en el ranking (1 = mejor sembrado). Orden clásico que separa a los
// mejores lo más posible (con 8: 1,8 | 4,5 | 3,6 | 2,7 por partido), con la
// mitad de abajo espejada para que el 2 quede abajo de todo — ver
// reglas-circuito-del-parque.md, "Ubicación en el cuadro".
export function drawLineOrder(bracketSize: number): number[] {
  let order = [1]
  while (order.length < bracketSize) {
    const size = order.length * 2
    order = order.flatMap((rank) => [rank, size + 1 - rank])
  }
  const half = bracketSize / 2
  return [...order.slice(0, half), ...order.slice(half).reverse()]
}

// Exportada para que generateRepechaje.ts reuse el mismo armado de
// eliminación simple (mismo criterio de seeding/byes) en vez de duplicarlo.
// Los lugares del ranking que exceden a los inscriptos son byes: por el
// orden de líneas, siempre le tocan a los mejores sembrados.
export function buildSingleElimination(
  participants: CircuitoParticipant[],
  byePolicy: ByePolicy,
): CircuitoBracket {
  if (byePolicy !== "top_seeds") {
    throw new Error(`byePolicy "${byePolicy}" no implementada`)
  }

  const bracketSize = nextPowerOfTwo(participants.length)
  const lines = drawLineOrder(bracketSize)

  const round1: BracketMatch[] = []
  for (let i = 0; i < lines.length; i += 2) {
    // El mejor sembrado del partido va como A: un bye es "A sin rival".
    const better = participants[Math.min(lines[i], lines[i + 1]) - 1]
    const worse = participants[Math.max(lines[i], lines[i + 1]) - 1] ?? null
    round1.push({ round: 1, group: null, participantA: better, participantB: worse, isBye: worse === null })
  }

  const rounds: BracketMatch[][] = [round1]
  let matchesInRound = round1.length
  let roundNumber = 2
  while (matchesInRound > 1) {
    matchesInRound = matchesInRound / 2
    rounds.push(Array.from({ length: matchesInRound }, () => tbdMatch(roundNumber)))
    roundNumber++
  }

  return { format: "single_elimination", rounds }
}
