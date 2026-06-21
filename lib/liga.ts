// Mock data for the Liga de Invierno (Winter League).
// Doubles team tournament. Each series is between two teams over 3 courts.
// A team wins the series by winning 2 of 3 courts. No backend, all mocked.

export type CategoryId =
  | "cab-a"
  | "cab-b"
  | "dam-a"
  | "dam-b"
  | "mix-a"
  | "mix-b"

export type Category = {
  id: CategoryId
  label: string
  group: "Caballeros" | "Damas" | "Mixto"
}

export const CATEGORIES: Category[] = [
  { id: "cab-a", label: "Caballeros A", group: "Caballeros" },
  { id: "cab-b", label: "Caballeros B", group: "Caballeros" },
  { id: "dam-a", label: "Damas A", group: "Damas" },
  { id: "dam-b", label: "Damas B", group: "Damas" },
  { id: "mix-a", label: "Mixto A", group: "Mixto" },
  { id: "mix-b", label: "Mixto B", group: "Mixto" },
]

export type StandingRow = {
  pos: number
  team: string
  played: number
  won: number
  lost: number
  courtsFor: number
  courtsAgainst: number
  points: number
}

export type Match = {
  date: string // ISO date
  round: string
  home: string
  away: string
  // Court results: true = home won that court, false = away won, null = pending
  courts: [boolean | null, boolean | null, boolean | null]
  status: "played" | "upcoming"
}

export type LeagueData = {
  standings: StandingRow[]
  matches: Match[]
  teams: { name: string; players: [string, string] }[]
}

function row(
  pos: number,
  team: string,
  won: number,
  lost: number,
  courtsFor: number,
  courtsAgainst: number,
): StandingRow {
  return {
    pos,
    team,
    played: won + lost,
    won,
    lost,
    courtsFor,
    courtsAgainst,
    points: won * 2,
  }
}

export const LEAGUE: Record<CategoryId, LeagueData> = {
  "cab-a": {
    standings: [
      row(1, "Los Halcones", 4, 0, 11, 1),
      row(2, "Drop Shot", 3, 1, 9, 4),
      row(3, "Saque y Volea", 2, 2, 7, 6),
      row(4, "Polvo de Ladrillo", 1, 3, 4, 9),
      row(5, "Doble Falta", 0, 4, 1, 11),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Los Halcones",
        away: "Saque y Volea",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Drop Shot",
        away: "Doble Falta",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Los Halcones",
        away: "Polvo de Ladrillo",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Drop Shot",
        away: "Saque y Volea",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-13",
        round: "Fecha 3",
        home: "Saque y Volea",
        away: "Doble Falta",
        courts: [true, true, false],
        status: "played",
      },
    ],
    teams: [
      { name: "Los Halcones", players: ["M. Fernández", "J. Pérez"] },
      { name: "Drop Shot", players: ["L. Gómez", "R. Díaz"] },
      { name: "Saque y Volea", players: ["A. Suárez", "P. Romero"] },
      { name: "Polvo de Ladrillo", players: ["F. Castro", "N. Vega"] },
      { name: "Doble Falta", players: ["G. Ramos", "S. Ortiz"] },
    ],
  },
  "cab-b": {
    standings: [
      row(1, "Red Alta", 3, 1, 9, 5),
      row(2, "Los Pibes", 3, 1, 8, 5),
      row(3, "Smash", 2, 2, 6, 6),
      row(4, "Globeros", 1, 3, 4, 9),
      row(5, "Revés a Dos Manos", 1, 3, 3, 9),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Red Alta",
        away: "Smash",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Los Pibes",
        away: "Globeros",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Red Alta",
        away: "Revés a Dos Manos",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Los Pibes",
        away: "Smash",
        courts: [false, true, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Red Alta", players: ["D. Molina", "E. Sosa"] },
      { name: "Los Pibes", players: ["T. Acosta", "B. Luna"] },
      { name: "Smash", players: ["I. Herrera", "C. Medina"] },
      { name: "Globeros", players: ["H. Ríos", "V. Campos"] },
      { name: "Revés a Dos Manos", players: ["O. Bravo", "W. Núñez"] },
    ],
  },
  "dam-a": {
    standings: [
      row(1, "Las Tigras", 4, 0, 12, 2),
      row(2, "Volea Fina", 2, 2, 7, 6),
      row(3, "Slice", 2, 2, 6, 7),
      row(4, "Las Águilas", 0, 4, 2, 12),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Las Tigras",
        away: "Slice",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Las Tigras",
        away: "Las Águilas",
        courts: [true, true, true],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Volea Fina",
        away: "Slice",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Las Tigras", players: ["M. López", "C. Ferreyra"] },
      { name: "Volea Fina", players: ["A. Giménez", "L. Cabrera"] },
      { name: "Slice", players: ["P. Maldonado", "R. Ledesma"] },
      { name: "Las Águilas", players: ["S. Aguirre", "N. Paz"] },
    ],
  },
  "dam-b": {
    standings: [
      row(1, "Drive", 3, 0, 8, 3),
      row(2, "Las Gardenias", 2, 1, 6, 4),
      row(3, "Topspin", 1, 2, 4, 6),
      row(4, "Las Nuevas", 0, 3, 2, 7),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 4",
        home: "Drive",
        away: "Topspin",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 3",
        home: "Drive",
        away: "Las Nuevas",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 3",
        home: "Las Gardenias",
        away: "Topspin",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Drive", players: ["V. Torres", "F. Ibáñez"] },
      { name: "Las Gardenias", players: ["M. Ojeda", "J. Silva"] },
      { name: "Topspin", players: ["E. Rojas", "D. Cardozo"] },
      { name: "Las Nuevas", players: ["B. Figueroa", "G. Morales"] },
    ],
  },
  "mix-a": {
    standings: [
      row(1, "Match Point", 4, 0, 11, 2),
      row(2, "Dúo Dinámico", 3, 1, 9, 4),
      row(3, "Ace", 2, 2, 6, 7),
      row(4, "Tie Break", 1, 3, 3, 9),
      row(5, "Los Mixtos", 0, 4, 2, 11),
    ],
    matches: [
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Match Point",
        away: "Ace",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Dúo Dinámico",
        away: "Los Mixtos",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Match Point",
        away: "Tie Break",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Dúo Dinámico",
        away: "Ace",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Match Point", players: ["C. Vera", "M. Ruiz"] },
      { name: "Dúo Dinámico", players: ["L. Benítez", "A. Coronel"] },
      { name: "Ace", players: ["P. Godoy", "S. Méndez"] },
      { name: "Tie Break", players: ["R. Quiroga", "N. Vera"] },
      { name: "Los Mixtos", players: ["F. Arce", "V. Leiva"] },
    ],
  },
  "mix-b": {
    standings: [
      row(1, "Los Cracks", 3, 1, 8, 5),
      row(2, "Sin Drama", 3, 1, 8, 6),
      row(3, "Bandeja", 2, 2, 6, 6),
      row(4, "Cambio de Lado", 1, 3, 4, 8),
      row(5, "Los Domingueros", 1, 3, 4, 9),
    ],
    matches: [
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Los Cracks",
        away: "Bandeja",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Sin Drama",
        away: "Los Domingueros",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Los Cracks",
        away: "Cambio de Lado",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Sin Drama",
        away: "Bandeja",
        courts: [true, true, false],
        status: "played",
      },
    ],
    teams: [
      { name: "Los Cracks", players: ["J. Cáceres", "M. Roldán"] },
      { name: "Sin Drama", players: ["A. Peralta", "L. Sandoval"] },
      { name: "Bandeja", players: ["P. Escobar", "C. Villalba"] },
      { name: "Cambio de Lado", players: ["R. Domínguez", "S. Bustos"] },
      { name: "Los Domingueros", players: ["F. Navarro", "V. Juárez"] },
    ],
  },
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

export function seriesResult(courts: Match["courts"]) {
  const home = courts.filter((c) => c === true).length
  const away = courts.filter((c) => c === false).length
  return { home, away }
}
