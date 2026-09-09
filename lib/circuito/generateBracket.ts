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
export function sortBySeed(participants: CircuitoParticipant[]): CircuitoParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.seed !== null && b.seed !== null) return a.seed - b.seed
    if (a.seed !== null) return -1
    if (b.seed !== null) return 1
    return a.id.localeCompare(b.id)
  })
}

export function nextPowerOfTwo(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

export function generateBracket(
  participants: CircuitoParticipant[],
  spec: CircuitoFormatSpec,
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

  const seeded = sortBySeed(participants)

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
// equilibrar el nivel de las 2 zonas. reglas-circuito-del-parque.md no
// especifica el criterio de armado de zonas para este formato — default
// razonable documentado en OQ-36 (product/open-questions.md), a confirmar.
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

// Exportada para que generateRepechaje.ts reuse el mismo armado de
// eliminación simple (byes a los mejores sembrados, resto emparejado de
// mejor a peor cerrando hacia el medio) en vez de duplicar el algoritmo.
export function buildSingleElimination(
  participants: CircuitoParticipant[],
  byePolicy: ByePolicy,
): CircuitoBracket {
  if (byePolicy !== "top_seeds") {
    throw new Error(`byePolicy "${byePolicy}" no implementada`)
  }

  const n = participants.length
  const bracketSize = nextPowerOfTwo(n)
  const byeCount = bracketSize - n

  const byeParticipants = participants.slice(0, byeCount)
  const playing = participants.slice(byeCount)

  const round1: BracketMatch[] = byeParticipants.map((p) => ({
    round: 1,
    group: null,
    participantA: p,
    participantB: null,
    isBye: true,
  }))

  // Mejor sembrado restante vs peor sembrado restante, cerrando hacia el medio.
  let lo = 0
  let hi = playing.length - 1
  while (lo < hi) {
    round1.push({
      round: 1,
      group: null,
      participantA: playing[lo],
      participantB: playing[hi],
      isBye: false,
    })
    lo++
    hi--
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
