import type { MmCategory, MmEdition, MmZone } from "@/lib/mid-master/types"

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function pending(
  a: string,
  b: string,
  id: string,
  date?: string,
  time?: string,
) {
  return {
    id,
    participantAId: a,
    participantBId: b,
    status: (date ? "scheduled" : "pending") as "scheduled" | "pending",
    ...(date && { scheduledDate: date }),
    ...(time && { scheduledTime: time }),
  }
}

function played(
  a: string,
  b: string,
  id: string,
  score: string,
  winnerId: string,
) {
  return {
    id,
    participantAId: a,
    participantBId: b,
    status: "played" as const,
    score,
    winnerId,
  }
}

// â”€â”€â”€ Single Caballeros Primera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const cabPrimera: MmCategory = {
  id: "cab-primera",
  slug: "single-caballeros-primera",
  name: "Single Caballeros Primera",
  shortName: "Cab. Primera",
  type: "singles",
  zoneSize: 4,
  zones: [
    {
      id: "cab-primera-za",
      name: "Zona A",
      participants: [
        { id: "cp-a1", displayName: "MartÃ­n AgÃ¼ero" },
        { id: "cp-a2", displayName: "Diego Ferreyra" },
        { id: "cp-a3", displayName: "Pablo GuzmÃ¡n" },
        { id: "cp-a4", displayName: "Lucas Herrera" },
      ],
      matches: [
        played("cp-a1", "cp-a2", "cp-za-m1", "6-3 6-4", "cp-a1"),
        played("cp-a1", "cp-a3", "cp-za-m2", "6-1 6-2", "cp-a1"),
        played("cp-a2", "cp-a4", "cp-za-m3", "7-5 6-3", "cp-a2"),
        played("cp-a3", "cp-a4", "cp-za-m4", "6-4 6-4", "cp-a3"),
        pending("cp-a1", "cp-a4", "cp-za-m5", "2026-07-19", "20:00"),
        pending("cp-a2", "cp-a3", "cp-za-m6", "2026-07-19", "21:30"),
      ],
      standings: [
        { participantId: "cp-a1", position: 1, played: 2, won: 2, lost: 0, setsWon: 4, setsLost: 0, setsDiff: 4, gamesWon: 24, gamesLost: 10, gamesDiff: 14, advances: true },
        { participantId: "cp-a2", position: 2, played: 2, won: 1, lost: 1, setsWon: 2, setsLost: 2, setsDiff: 0, gamesWon: 20, gamesLost: 20, gamesDiff: 0, advances: true },
        { participantId: "cp-a3", position: 3, played: 2, won: 1, lost: 1, setsWon: 2, setsLost: 2, setsDiff: 0, gamesWon: 15, gamesLost: 20, gamesDiff: -5, advances: false },
        { participantId: "cp-a4", position: 4, played: 2, won: 0, lost: 2, setsWon: 0, setsLost: 4, setsDiff: -4, gamesWon: 16, gamesLost: 25, gamesDiff: -9, advances: false },
      ],
    },
    {
      id: "cab-primera-zb",
      name: "Zona B",
      participants: [
        { id: "cp-b1", displayName: "Roberto Silva" },
        { id: "cp-b2", displayName: "Carlos MÃ©ndez" },
        { id: "cp-b3", displayName: "SebastiÃ¡n Torres" },
        { id: "cp-b4", displayName: "Federico Ramos" },
      ],
      matches: [
        played("cp-b1", "cp-b2", "cp-zb-m1", "6-4 6-2", "cp-b1"),
        played("cp-b3", "cp-b4", "cp-zb-m2", "7-5 4-6 7-6", "cp-b3"),
        pending("cp-b1", "cp-b3", "cp-zb-m3", "2026-07-19", "20:00"),
        pending("cp-b2", "cp-b4", "cp-zb-m4", "2026-07-19", "21:30"),
        pending("cp-b1", "cp-b4", "cp-zb-m5", "2026-07-26", "20:00"),
        pending("cp-b2", "cp-b3", "cp-zb-m6", "2026-07-26", "21:30"),
      ],
      standings: [
        { participantId: "cp-b1", position: 1, played: 1, won: 1, lost: 0, setsWon: 2, setsLost: 0, setsDiff: 2, gamesWon: 12, gamesLost: 6, gamesDiff: 6, advances: true },
        { participantId: "cp-b3", position: 2, played: 1, won: 1, lost: 0, setsWon: 2, setsLost: 1, setsDiff: 1, gamesWon: 18, gamesLost: 17, gamesDiff: 1, advances: true },
        { participantId: "cp-b4", position: 3, played: 1, won: 0, lost: 1, setsWon: 1, setsLost: 2, setsDiff: -1, gamesWon: 17, gamesLost: 18, gamesDiff: -1, advances: false },
        { participantId: "cp-b2", position: 4, played: 1, won: 0, lost: 1, setsWon: 0, setsLost: 2, setsDiff: -2, gamesWon: 6, gamesLost: 12, gamesDiff: -6, advances: false },
      ],
    },
  ],
  knockout: {
    semifinal1: { id: "cp-sf1", phase: "semifinal", label: "Semifinal 1", participantALabel: "1Â° Zona A", participantBLabel: "2Â° Zona B", status: "pending" },
    semifinal2: { id: "cp-sf2", phase: "semifinal", label: "Semifinal 2", participantALabel: "1Â° Zona B", participantBLabel: "2Â° Zona A", status: "pending" },
    final: { id: "cp-f", phase: "final", label: "Final", participantALabel: "Ganador SF 1", participantBLabel: "Ganador SF 2", status: "pending" },
  },
}

// â”€â”€â”€ Single Caballeros Intermedia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const cabIntermedia: MmCategory = {
  id: "cab-intermedia",
  slug: "single-caballeros-intermedia",
  name: "Single Caballeros Intermedia",
  shortName: "Cab. Intermedia",
  type: "singles",
  zoneSize: 4,
  zones: [
    {
      id: "ci-za",
      name: "Zona A",
      participants: [
        { id: "ci-a1", displayName: "NicolÃ¡s Paredes" },
        { id: "ci-a2", displayName: "TomÃ¡s Acosta" },
        { id: "ci-a3", displayName: "Leandro Vargas" },
        { id: "ci-a4", displayName: "MatÃ­as Soria" },
      ],
      matches: [
        pending("ci-a1", "ci-a2", "ci-za-m1", "2026-07-12", "20:00"),
        pending("ci-a1", "ci-a3", "ci-za-m2", "2026-07-12", "21:30"),
        pending("ci-a2", "ci-a4", "ci-za-m3", "2026-07-19", "20:00"),
        pending("ci-a3", "ci-a4", "ci-za-m4", "2026-07-19", "21:30"),
        pending("ci-a1", "ci-a4", "ci-za-m5", "2026-07-26", "20:00"),
        pending("ci-a2", "ci-a3", "ci-za-m6", "2026-07-26", "21:30"),
      ],
      standings: [
        { participantId: "ci-a1", position: 1, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-a2", position: 2, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-a3", position: 3, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-a4", position: 4, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
      ],
    },
    {
      id: "ci-zb",
      name: "Zona B",
      participants: [
        { id: "ci-b1", displayName: "Ramiro DÃ­az" },
        { id: "ci-b2", displayName: "Facundo Romero" },
        { id: "ci-b3", displayName: "Ignacio SuÃ¡rez" },
        { id: "ci-b4", displayName: "Ezequiel Castro" },
      ],
      matches: [
        pending("ci-b1", "ci-b2", "ci-zb-m1", "2026-07-12", "20:00"),
        pending("ci-b1", "ci-b3", "ci-zb-m2", "2026-07-12", "21:30"),
        pending("ci-b2", "ci-b4", "ci-zb-m3", "2026-07-19", "20:00"),
        pending("ci-b3", "ci-b4", "ci-zb-m4", "2026-07-19", "21:30"),
        pending("ci-b1", "ci-b4", "ci-zb-m5", "2026-07-26", "20:00"),
        pending("ci-b2", "ci-b3", "ci-zb-m6", "2026-07-26", "21:30"),
      ],
      standings: [
        { participantId: "ci-b1", position: 1, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-b2", position: 2, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-b3", position: 3, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
        { participantId: "ci-b4", position: 4, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
      ],
    },
  ],
  knockout: {
    semifinal1: { id: "ci-sf1", phase: "semifinal", label: "Semifinal 1", participantALabel: "1Â° Zona A", participantBLabel: "2Â° Zona B", status: "pending" },
    semifinal2: { id: "ci-sf2", phase: "semifinal", label: "Semifinal 2", participantALabel: "1Â° Zona B", participantBLabel: "2Â° Zona A", status: "pending" },
    final: { id: "ci-f", phase: "final", label: "Final", participantALabel: "Ganador SF 1", participantBLabel: "Ganador SF 2", status: "pending" },
  },
}

// â”€â”€â”€ Single Caballeros Segunda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function emptyZone(
  id: string,
  name: "Zona A" | "Zona B",
  players: { id: string; displayName: string }[],
  matchDates: { date: string; time: string }[],
): MmZone {
  const ids = players.map((p) => p.id)
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i], ids[j]])
    }
  }
  return {
    id,
    name,
    participants: players,
    matches: pairs.map(([a, b], idx) => {
      const d = matchDates[idx]
      return pending(a, b, `${id}-m${idx + 1}`, d?.date, d?.time)
    }),
    standings: players.map((p, idx) => ({
      participantId: p.id,
      position: idx + 1,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDiff: 0,
      advances: false,
    })),
  }
}

function emptyKnockout(prefix: string): MmCategory["knockout"] {
  return {
    semifinal1: { id: `${prefix}-sf1`, phase: "semifinal", label: "Semifinal 1", participantALabel: "1Â° Zona A", participantBLabel: "2Â° Zona B", status: "pending" },
    semifinal2: { id: `${prefix}-sf2`, phase: "semifinal", label: "Semifinal 2", participantALabel: "1Â° Zona B", participantBLabel: "2Â° Zona A", status: "pending" },
    final: { id: `${prefix}-f`, phase: "final", label: "Final", participantALabel: "Ganador SF 1", participantBLabel: "Ganador SF 2", status: "pending" },
  }
}

const DATES_A = [
  { date: "2026-07-12", time: "20:00" },
  { date: "2026-07-12", time: "21:30" },
  { date: "2026-07-19", time: "20:00" },
  { date: "2026-07-19", time: "21:30" },
  { date: "2026-07-26", time: "20:00" },
  { date: "2026-07-26", time: "21:30" },
]

const cabSegunda: MmCategory = {
  id: "cab-segunda",
  slug: "single-caballeros-segunda",
  name: "Single Caballeros Segunda",
  shortName: "Cab. Segunda",
  type: "singles",
  zoneSize: 4,
  zones: [
    emptyZone("cs-za", "Zona A", [
      { id: "cs-a1", displayName: "Juan Ãlvarez" },
      { id: "cs-a2", displayName: "Marcos BenÃ­tez" },
      { id: "cs-a3", displayName: "Santiago Delgado" },
      { id: "cs-a4", displayName: "Rodrigo Espinoza" },
    ], DATES_A),
    emptyZone("cs-zb", "Zona B", [
      { id: "cs-b1", displayName: "DamiÃ¡n Fuentes" },
      { id: "cs-b2", displayName: "Pablo Godoy" },
      { id: "cs-b3", displayName: "Mateo IbÃ¡Ã±ez" },
      { id: "cs-b4", displayName: "AgustÃ­n JimÃ©nez" },
    ], DATES_A),
  ],
  knockout: emptyKnockout("cs"),
}

// â”€â”€â”€ Single Caballeros Tercera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const cabTercera: MmCategory = {
  id: "cab-tercera",
  slug: "single-caballeros-tercera",
  name: "Single Caballeros Tercera",
  shortName: "Cab. Tercera",
  type: "singles",
  zoneSize: 4,
  zones: [
    emptyZone("ct-za", "Zona A", [
      { id: "ct-a1", displayName: "Esteban Leal" },
      { id: "ct-a2", displayName: "RubÃ©n Molina" },
      { id: "ct-a3", displayName: "Claudio Navarro" },
      { id: "ct-a4", displayName: "Horacio Ojeda" },
    ], DATES_A),
    emptyZone("ct-zb", "Zona B", [
      { id: "ct-b1", displayName: "Marcelo Ponce" },
      { id: "ct-b2", displayName: "Osvaldo Quiroga" },
      { id: "ct-b3", displayName: "Bernardo Reyes" },
      { id: "ct-b4", displayName: "AdriÃ¡n Serrano" },
    ], DATES_A),
  ],
  knockout: emptyKnockout("ct"),
}

// â”€â”€â”€ Single Caballeros +50 (con resultados completos) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const cab50: MmCategory = {
  id: "cab-50",
  slug: "single-caballeros-50",
  name: "Single Caballeros +50",
  shortName: "Cab. +50",
  type: "singles",
  zoneSize: 4,
  zones: [
    {
      id: "c50-za",
      name: "Zona A",
      participants: [
        { id: "c50-a1", displayName: "Gustavo Pereyra" },
        { id: "c50-a2", displayName: "HernÃ¡n Contreras" },
        { id: "c50-a3", displayName: "Miguel Castillo" },
        { id: "c50-a4", displayName: "Jorge Flores" },
      ],
      matches: [
        played("c50-a1", "c50-a2", "c50-za-m1", "6-3 6-4", "c50-a1"),
        played("c50-a1", "c50-a3", "c50-za-m2", "6-2 6-1", "c50-a1"),
        played("c50-a1", "c50-a4", "c50-za-m3", "6-0 6-1", "c50-a1"),
        played("c50-a2", "c50-a3", "c50-za-m4", "6-4 7-5", "c50-a2"),
        played("c50-a2", "c50-a4", "c50-za-m5", "6-3 6-2", "c50-a2"),
        played("c50-a3", "c50-a4", "c50-za-m6", "6-3 6-4", "c50-a3"),
      ],
      standings: [
        { participantId: "c50-a1", position: 1, played: 3, won: 3, lost: 0, setsWon: 6, setsLost: 0, setsDiff: 6, gamesWon: 36, gamesLost: 11, gamesDiff: 25, advances: true },
        { participantId: "c50-a2", position: 2, played: 3, won: 2, lost: 1, setsWon: 4, setsLost: 2, setsDiff: 2, gamesWon: 32, gamesLost: 26, gamesDiff: 6, advances: true },
        { participantId: "c50-a3", position: 3, played: 3, won: 1, lost: 2, setsWon: 2, setsLost: 4, setsDiff: -2, gamesWon: 24, gamesLost: 32, gamesDiff: -8, advances: false },
        { participantId: "c50-a4", position: 4, played: 3, won: 0, lost: 3, setsWon: 0, setsLost: 6, setsDiff: -6, gamesWon: 13, gamesLost: 36, gamesDiff: -23, advances: false },
      ],
    },
    {
      id: "c50-zb",
      name: "Zona B",
      participants: [
        { id: "c50-b1", displayName: "Daniel MuÃ±oz" },
        { id: "c50-b2", displayName: "Cristian Ortiz" },
        { id: "c50-b3", displayName: "Eduardo RÃ­os" },
        { id: "c50-b4", displayName: "AndrÃ©s Vega" },
      ],
      matches: [
        played("c50-b1", "c50-b2", "c50-zb-m1", "7-5 6-3", "c50-b1"),
        played("c50-b1", "c50-b3", "c50-zb-m2", "6-4 6-4", "c50-b1"),
        played("c50-b1", "c50-b4", "c50-zb-m3", "6-3 6-2", "c50-b1"),
        played("c50-b2", "c50-b3", "c50-zb-m4", "6-4 6-3", "c50-b2"),
        played("c50-b2", "c50-b4", "c50-zb-m5", "6-2 6-1", "c50-b2"),
        played("c50-b3", "c50-b4", "c50-zb-m6", "6-4 6-3", "c50-b3"),
      ],
      standings: [
        { participantId: "c50-b1", position: 1, played: 3, won: 3, lost: 0, setsWon: 6, setsLost: 0, setsDiff: 6, gamesWon: 37, gamesLost: 21, gamesDiff: 16, advances: true },
        { participantId: "c50-b2", position: 2, played: 3, won: 2, lost: 1, setsWon: 4, setsLost: 2, setsDiff: 2, gamesWon: 32, gamesLost: 23, gamesDiff: 9, advances: true },
        { participantId: "c50-b3", position: 3, played: 3, won: 1, lost: 2, setsWon: 2, setsLost: 4, setsDiff: -2, gamesWon: 27, gamesLost: 31, gamesDiff: -4, advances: false },
        { participantId: "c50-b4", position: 4, played: 3, won: 0, lost: 3, setsWon: 0, setsLost: 6, setsDiff: -6, gamesWon: 15, gamesLost: 36, gamesDiff: -21, advances: false },
      ],
    },
  ],
  knockout: {
    semifinal1: {
      id: "c50-sf1",
      phase: "semifinal",
      label: "Semifinal 1",
      participantAId: "c50-a1",
      participantBId: "c50-b2",
      participantALabel: "Gustavo Pereyra",
      participantBLabel: "Cristian Ortiz",
      status: "scheduled",
      scheduledDate: "2026-07-26",
      scheduledTime: "14:00",
    },
    semifinal2: {
      id: "c50-sf2",
      phase: "semifinal",
      label: "Semifinal 2",
      participantAId: "c50-b1",
      participantBId: "c50-a2",
      participantALabel: "Daniel MuÃ±oz",
      participantBLabel: "HernÃ¡n Contreras",
      status: "scheduled",
      scheduledDate: "2026-07-26",
      scheduledTime: "16:00",
    },
    final: {
      id: "c50-f",
      phase: "final",
      label: "Final",
      participantALabel: "Ganador SF 1",
      participantBLabel: "Ganador SF 2",
      status: "pending",
    },
  },
}

// â”€â”€â”€ Single Damas Segunda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DATES_DAMAS = [
  { date: "2026-07-13", time: "10:00" },
  { date: "2026-07-13", time: "11:30" },
  { date: "2026-07-20", time: "10:00" },
  { date: "2026-07-20", time: "11:30" },
  { date: "2026-07-27", time: "10:00" },
  { date: "2026-07-27", time: "11:30" },
]

const damasSegunda: MmCategory = {
  id: "damas-segunda",
  slug: "single-damas-segunda",
  name: "Single Damas Segunda",
  shortName: "Damas Segunda",
  type: "singles",
  zoneSize: 4,
  zones: [
    {
      id: "ds-za",
      name: "Zona A",
      participants: [
        { id: "ds-a1", displayName: "Laura FernÃ¡ndez" },
        { id: "ds-a2", displayName: "Ana Bergara" },
        { id: "ds-a3", displayName: "SofÃ­a Peralta" },
        { id: "ds-a4", displayName: "Por definir" },
      ],
      matches: [
        played("ds-a1", "ds-a2", "ds-za-m1", "6-4 6-3", "ds-a1"),
        pending("ds-a1", "ds-a3", "ds-za-m2", "2026-07-20", "10:00"),
        pending("ds-a2", "ds-a3", "ds-za-m3", "2026-07-20", "11:30"),
        pending("ds-a1", "ds-a4", "ds-za-m4"),
        pending("ds-a2", "ds-a4", "ds-za-m5"),
        pending("ds-a3", "ds-a4", "ds-za-m6"),
      ],
      standings: [
        { participantId: "ds-a1", position: 1, played: 1, won: 1, lost: 0, setsWon: 2, setsLost: 0, setsDiff: 2, gamesWon: 12, gamesLost: 7, gamesDiff: 5, advances: true },
        { participantId: "ds-a3", position: 2, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: true },
        { participantId: "ds-a2", position: 3, played: 1, won: 0, lost: 1, setsWon: 0, setsLost: 2, setsDiff: -2, gamesWon: 7, gamesLost: 12, gamesDiff: -5, advances: false },
        { participantId: "ds-a4", position: 4, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, setsDiff: 0, gamesWon: 0, gamesLost: 0, gamesDiff: 0, advances: false },
      ],
    },
    emptyZone("ds-zb", "Zona B", [
      { id: "ds-b1", displayName: "Valeria Sosa" },
      { id: "ds-b2", displayName: "Marina GÃ³mez" },
      { id: "ds-b3", displayName: "Luciana Paz" },
      { id: "ds-b4", displayName: "Por definir" },
    ], DATES_DAMAS),
  ],
  knockout: emptyKnockout("ds"),
}

// â”€â”€â”€ Doble Caballeros Segunda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const dobleCabSegunda: MmCategory = {
  id: "doble-cab-segunda",
  slug: "doble-caballeros-segunda",
  name: "Doble Caballeros Segunda",
  shortName: "Doble Cab. Seg.",
  type: "doubles",
  zoneSize: 4,
  zones: [
    emptyZone("dcs-za", "Zona A", [
      { id: "dcs-a1", displayName: "AgÃ¼ero / Ferreyra" },
      { id: "dcs-a2", displayName: "Silva / MÃ©ndez" },
      { id: "dcs-a3", displayName: "Torres / Ramos" },
      { id: "dcs-a4", displayName: "GuzmÃ¡n / Herrera" },
    ], DATES_A),
    emptyZone("dcs-zb", "Zona B", [
      { id: "dcs-b1", displayName: "Pereyra / Contreras" },
      { id: "dcs-b2", displayName: "Castillo / Flores" },
      { id: "dcs-b3", displayName: "MuÃ±oz / Ortiz" },
      { id: "dcs-b4", displayName: "RÃ­os / Vega" },
    ], DATES_A),
  ],
  knockout: emptyKnockout("dcs"),
}

// â”€â”€â”€ Doble Mixto Segunda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const dobleMixtoSegunda: MmCategory = {
  id: "doble-mixto-segunda",
  slug: "doble-mixto-segunda",
  name: "Doble Mixto Segunda",
  shortName: "Doble Mixto Seg.",
  type: "doubles",
  zoneSize: 4,
  zones: [
    emptyZone("dms-za", "Zona A", [
      { id: "dms-a1", displayName: "AgÃ¼ero / FernÃ¡ndez" },
      { id: "dms-a2", displayName: "Ferreyra / Bergara" },
      { id: "dms-a3", displayName: "GuzmÃ¡n / Peralta" },
      { id: "dms-a4", displayName: "Herrera / Sosa" },
    ], DATES_A),
    emptyZone("dms-zb", "Zona B", [
      { id: "dms-b1", displayName: "Silva / GÃ³mez" },
      { id: "dms-b2", displayName: "MÃ©ndez / Paz" },
      { id: "dms-b3", displayName: "Torres / Vargas" },
      { id: "dms-b4", displayName: "Ramos / Acosta" },
    ], DATES_A),
  ],
  knockout: emptyKnockout("dms"),
}

// â”€â”€â”€ Edition export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MID_MASTER_EDITION: MmEdition = {
  id: "mm-2026",
  name: "Mid Master",
  year: 2026,
  status: "active",
  categories: [
    cabPrimera,
    cabIntermedia,
    cabSegunda,
    cabTercera,
    cab50,
    damasSegunda,
    dobleCabSegunda,
    dobleMixtoSegunda,
  ],
}
