import { describe, it, expect } from "vitest";
import { parseScore } from "../parseScore";
import { calculateCourtMatchResult } from "../calculateCourtMatchResult";
import { calculateSeriesResult } from "../calculateSeriesResult";
import { calculateWalkoverSeriesResult } from "../calculateWalkoverSeriesResult";
import { calculateStandings } from "../calculateStandings";
import { sortStandings } from "../sortStandings";
import { getTeamSchedule } from "../getTeamSchedule";
import { CourtMatch, Series, StandingsRow, Team, DEFAULT_RULES } from "../types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTeam(id: string): Team {
  return { id, name: `Equipo ${id}`, slug: `equipo-${id}`, category_id: "cat1", active: true };
}

function makeCourtMatch(
  id: string,
  seriesId: string,
  courtNumber: 1 | 2 | 3,
  score: string,
  is_court_walkover = false
): CourtMatch {
  return {
    id,
    series_id: seriesId,
    court_number: courtNumber,
    score,
    is_court_walkover,
  };
}

function makeSeries(
  id: string,
  homeId: string,
  awayId: string,
  opts: Partial<Series> = {}
): Series {
  return {
    id,
    round_id: "r1",
    category_id: "cat1",
    home_team_id: homeId,
    away_team_id: awayId,
    status: "completed",
    is_general_walkover: false,
    ...opts,
  };
}

function makeRow(
  team: Team,
  pts: number,
  courts_diff: number,
  sets_diff: number,
  games_diff: number
): StandingsRow {
  return {
    team_id: team.id,
    team,
    played: 1,
    won: pts === 2 ? 1 : 0,
    lost: pts < 2 ? 1 : 0,
    points: pts,
    courts_won: 0,
    courts_lost: 0,
    courts_diff,
    sets_won: 0,
    sets_lost: 0,
    sets_diff,
    games_won: 0,
    games_lost: 0,
    games_diff,
    position: 0,
  };
}

// ─── parseScore ──────────────────────────────────────────────────────────────

describe("parseScore", () => {
  it("parsea un score de 2 sets", () => {
    const result = parseScore("6-4 6-2");
    expect(result.sets).toEqual([
      { home: 6, away: 4 },
      { home: 6, away: 2 },
    ]);
    expect(result.home_sets_won).toBe(2);
    expect(result.away_sets_won).toBe(0);
    expect(result.home_games_won).toBe(12);
    expect(result.away_games_won).toBe(6);
  });

  it("parsea un score con tercer set 7-6 (supertiebreak)", () => {
    const result = parseScore("6-4 3-6 7-6");
    expect(result.sets).toHaveLength(3);
    expect(result.sets[2]).toEqual({ home: 7, away: 6 });
    expect(result.home_sets_won).toBe(2);
    expect(result.away_sets_won).toBe(1);
    expect(result.home_games_won).toBe(16);
    expect(result.away_games_won).toBe(16);
  });

  it("parsea un score de WO de cancha 6-0 6-0", () => {
    const result = parseScore("6-0 6-0");
    expect(result.home_sets_won).toBe(2);
    expect(result.away_sets_won).toBe(0);
    expect(result.home_games_won).toBe(12);
    expect(result.away_games_won).toBe(0);
  });

  it("parsea un score donde gana el visitante", () => {
    const result = parseScore("4-6 6-3 6-7");
    expect(result.home_sets_won).toBe(1);
    expect(result.away_sets_won).toBe(2);
  });

  it("lanza error si el score está vacío", () => {
    expect(() => parseScore("")).toThrow("Score vacío");
    expect(() => parseScore("   ")).toThrow("Score vacío");
  });

  it("lanza error si hay menos de 2 sets (1 solo set)", () => {
    expect(() => parseScore("6-4")).toThrow("al menos 2 sets");
  });

  it("lanza error si hay más de 3 sets", () => {
    expect(() => parseScore("6-4 3-6 7-6 6-2")).toThrow("más de 3 sets");
  });

  it("lanza error si un set está mal formateado (sin guión)", () => {
    expect(() => parseScore("64 6-2")).toThrow("Set mal formateado");
  });

  it("lanza error si un set está empatado (6-6)", () => {
    expect(() => parseScore("6-6 6-4")).toThrow("Set empatado inválido");
  });

  it("lanza error si el tercer set no es 7-6 ni 6-7", () => {
    expect(() => parseScore("6-4 3-6 7-5")).toThrow("Tercer set inválido");
  });
});

// ─── calculateCourtMatchResult ───────────────────────────────────────────────

describe("calculateCourtMatchResult", () => {
  it("determina que gana el local 2-1 sets", () => {
    const result = calculateCourtMatchResult({ score: "6-4 3-6 7-6" });
    expect(result.winner_side).toBe("home");
    expect(result.home_sets_won).toBe(2);
    expect(result.away_sets_won).toBe(1);
  });

  it("determina que gana el visitante con score 0-6 6-4 6-7", () => {
    const result = calculateCourtMatchResult({ score: "0-6 6-4 6-7" });
    expect(result.winner_side).toBe("away");
    expect(result.home_sets_won).toBe(1);
    expect(result.away_sets_won).toBe(2);
  });

  it("WO de cancha individual: local gana 6-0 6-0", () => {
    const result = calculateCourtMatchResult({ score: "6-0 6-0", is_court_walkover: true });
    expect(result.winner_side).toBe("home");
    expect(result.home_sets_won).toBe(2);
    expect(result.away_sets_won).toBe(0);
    expect(result.home_games_won).toBe(12);
    expect(result.away_games_won).toBe(0);
  });

  it("WO de cancha individual: visitante gana 0-6 0-6", () => {
    const result = calculateCourtMatchResult({ score: "0-6 0-6", is_court_walkover: true });
    expect(result.winner_side).toBe("away");
    expect(result.home_games_won).toBe(0);
    expect(result.away_games_won).toBe(12);
  });
});

// ─── calculateSeriesResult ───────────────────────────────────────────────────

describe("calculateSeriesResult", () => {
  it("serie 3-0: local gana las 3 canchas", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "6-4 6-2", is_court_walkover: false },
        { score: "6-3 6-1", is_court_walkover: false },
        { score: "6-0 6-2", is_court_walkover: false },
      ],
    };
    const result = calculateSeriesResult(series);
    expect(result.winner_team_id).toBe("A");
    expect(result.home_courts_won).toBe(3);
    expect(result.away_courts_won).toBe(0);
  });

  it("serie 2-1: local gana 2 canchas, pierde 1", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "6-4 6-2", is_court_walkover: false },
        { score: "3-6 4-6", is_court_walkover: false },
        { score: "6-3 6-4", is_court_walkover: false },
      ],
    };
    const result = calculateSeriesResult(series);
    expect(result.winner_team_id).toBe("A");
    expect(result.home_courts_won).toBe(2);
    expect(result.away_courts_won).toBe(1);
  });

  it("serie 1-2: visitante gana la serie", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "3-6 4-6", is_court_walkover: false },
        { score: "6-4 6-2", is_court_walkover: false },
        { score: "3-6 4-6", is_court_walkover: false },
      ],
    };
    const result = calculateSeriesResult(series);
    expect(result.winner_team_id).toBe("B");
    expect(result.home_courts_won).toBe(1);
    expect(result.away_courts_won).toBe(2);
  });

  it("serie con tercer set 7-6 registrado correctamente", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "6-4 3-6 7-6", is_court_walkover: false },
        { score: "4-6 3-6", is_court_walkover: false },
        { score: "7-6 6-4", is_court_walkover: false },
      ],
    };
    const result = calculateSeriesResult(series);
    // Cancha 1: home gana 7-6 en 3er set → home
    // Cancha 2: away gana 6-4 6-3 → away
    // Cancha 3: home gana 7-6 6-4 → home
    expect(result.winner_team_id).toBe("A");
    expect(result.home_courts_won).toBe(2);
    expect(result.away_courts_won).toBe(1);
  });

  it("WO de cancha individual: no cambia el resultado de la serie", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "6-4 6-2", is_court_walkover: false },
        { score: "0-6 0-6", is_court_walkover: true }, // WO: visitante gana esta cancha
        { score: "6-3 6-1", is_court_walkover: false },
      ],
    };
    const result = calculateSeriesResult(series);
    // Local gana cancha 1 y 3, visitante gana cancha 2 (WO individual)
    expect(result.home_courts_won).toBe(2);
    expect(result.away_courts_won).toBe(1);
    expect(result.winner_team_id).toBe("A");
  });

  it("lanza error si la serie tiene solo 2 canchas con score", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [
        { score: "6-4 6-2", is_court_walkover: false },
        { score: "3-6 4-6", is_court_walkover: false },
        { is_court_walkover: false },
      ],
    };
    expect(() => calculateSeriesResult(series)).toThrow("Serie incompleta");
  });

  it("lanza error si la serie no tiene ninguna cancha con score", () => {
    const series = {
      home_team_id: "A",
      away_team_id: "B",
      court_matches: [],
    };
    expect(() => calculateSeriesResult(series)).toThrow("Serie incompleta");
  });
});

// ─── calculateWalkoverSeriesResult ───────────────────────────────────────────

describe("calculateWalkoverSeriesResult", () => {
  it("WO general: ganador suma 2 puntos, 3 canchas, 6 sets, 36 games", () => {
    const result = calculateWalkoverSeriesResult("A", "B");
    expect(result.winner_team_id).toBe("A");
    expect(result.winner_points).toBe(2);
    expect(result.winner_courts).toBe(3);
    expect(result.winner_sets).toBe(6);
    expect(result.winner_games).toBe(36);
  });

  it("WO general: perdedor suma 0 puntos, 0 canchas ganadas", () => {
    const result = calculateWalkoverSeriesResult("A", "B");
    expect(result.loser_team_id).toBe("B");
    expect(result.loser_points).toBe(0);
    expect(result.loser_courts).toBe(0);
    expect(result.loser_sets).toBe(0);
    expect(result.loser_games).toBe(0);
  });
});

// ─── calculateStandings ──────────────────────────────────────────────────────

describe("calculateStandings", () => {
  it("calcula standings para una serie normal 2-1", () => {
    const teamA = makeTeam("A");
    const teamB = makeTeam("B");
    const s1 = makeSeries("s1", "A", "B");
    const matches = [
      makeCourtMatch("m1", "s1", 1, "6-4 6-2"),
      makeCourtMatch("m2", "s1", 2, "3-6 4-6"),
      makeCourtMatch("m3", "s1", 3, "6-3 6-4"),
    ];

    const rows = calculateStandings([teamA, teamB], [s1], matches, DEFAULT_RULES);
    const rowA = rows.find((r) => r.team_id === "A")!;
    const rowB = rows.find((r) => r.team_id === "B")!;

    expect(rowA.points).toBe(2);
    expect(rowA.won).toBe(1);
    expect(rowA.courts_won).toBe(2);
    expect(rowA.courts_lost).toBe(1);
    expect(rowB.points).toBe(1);
    expect(rowB.won).toBe(0);
    expect(rowB.lost).toBe(1);
    expect(rowB.courts_won).toBe(1);
    expect(rowB.courts_lost).toBe(2);
  });

  it("calcula standings con WO general", () => {
    const teamA = makeTeam("A");
    const teamB = makeTeam("B");
    const s1 = makeSeries("s1", "A", "B", {
      status: "walkover",
      is_general_walkover: true,
      walkover_winner_team_id: "A",
    });

    const rows = calculateStandings([teamA, teamB], [s1], [], DEFAULT_RULES);
    const rowA = rows.find((r) => r.team_id === "A")!;
    const rowB = rows.find((r) => r.team_id === "B")!;

    expect(rowA.points).toBe(2);
    expect(rowA.courts_won).toBe(3);
    expect(rowA.sets_won).toBe(6);
    expect(rowA.games_won).toBe(36);
    expect(rowB.points).toBe(0);
    expect(rowB.courts_lost).toBe(3);
    expect(rowB.sets_lost).toBe(6);
    expect(rowB.games_lost).toBe(36);
  });

  it("ignora series no jugadas (scheduled)", () => {
    const teamA = makeTeam("A");
    const teamB = makeTeam("B");
    const s1 = makeSeries("s1", "A", "B", { status: "scheduled" });

    const rows = calculateStandings([teamA, teamB], [s1], [], DEFAULT_RULES);
    const rowA = rows.find((r) => r.team_id === "A")!;
    expect(rowA.played).toBe(0);
    expect(rowA.points).toBe(0);
  });
});

// ─── sortStandings ───────────────────────────────────────────────────────────

describe("sortStandings", () => {
  it("ordena por puntos descendente", () => {
    const [A, B, C] = ["A", "B", "C"].map(makeTeam);
    const rows = [makeRow(B, 4, 0, 0, 0), makeRow(A, 6, 0, 0, 0), makeRow(C, 2, 0, 0, 0)];
    const sorted = sortStandings(rows, [], [], DEFAULT_RULES);
    expect(sorted.map((r) => r.team_id)).toEqual(["A", "B", "C"]);
    expect(sorted[0].position).toBe(1);
    expect(sorted[2].position).toBe(3);
  });

  it("desempate por diferencia de canchas", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    // Mismo pts, A tiene mejor courts_diff
    const rows = [makeRow(B, 4, 1, 0, 0), makeRow(A, 4, 3, 0, 0)];
    const sorted = sortStandings(rows, [], [], DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });

  it("desempate por diferencia de sets", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    // Mismo pts y courts_diff, A tiene mejor sets_diff
    const rows = [makeRow(B, 4, 2, 1, 0), makeRow(A, 4, 2, 3, 0)];
    const sorted = sortStandings(rows, [], [], DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });

  it("desempate por diferencia de games", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    // Mismo pts, courts_diff y sets_diff, A tiene mejor games_diff
    const rows = [makeRow(B, 4, 2, 2, 5), makeRow(A, 4, 2, 2, 10)];
    const sorted = sortStandings(rows, [], [], DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });

  it("desempate H2H por diferencia de canchas entre empatados", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    // A y B igualados en todo — A ganó el enfrentamiento directo 2-1
    const rows = [makeRow(B, 4, 2, 2, 0), makeRow(A, 4, 2, 2, 0)];
    const s1 = makeSeries("s1", "A", "B"); // A gana 2-1
    const matches = [
      makeCourtMatch("m1", "s1", 1, "6-4 6-2"),
      makeCourtMatch("m2", "s1", 2, "3-6 4-6"),
      makeCourtMatch("m3", "s1", 3, "6-3 6-4"),
    ];
    const sorted = sortStandings(rows, [s1], matches, DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });

  it("desempate H2H ida y vuelta: suma canchas de ambas series (A gana 3-0 en casa, pierde 1-2 de visitante)", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    const rows = [makeRow(B, 6, 0, 0, 0), makeRow(A, 6, 0, 0, 0)];
    // Serie 1: A local gana 3-0
    const s1 = makeSeries("s1", "A", "B");
    // Serie 2: B local gana 2-1 (A visitante gana solo 1 cancha)
    const s2 = makeSeries("s2", "B", "A");
    const matches = [
      makeCourtMatch("m1", "s1", 1, "6-4 6-2"), // A gana
      makeCourtMatch("m2", "s1", 2, "6-3 6-1"), // A gana
      makeCourtMatch("m3", "s1", 3, "6-0 6-2"), // A gana
      makeCourtMatch("m4", "s2", 1, "6-4 6-2"), // B (local) gana
      makeCourtMatch("m5", "s2", 2, "3-6 4-6"), // A (visitante) gana
      makeCourtMatch("m6", "s2", 3, "6-3 6-1"), // B (local) gana
    ];
    // H2H puntos: A=2+1=3, B=1+2=3 (empatados)
    // H2H courts_diff: A=(3-0)+(1-2)=+2, B=(0-3)+(2-1)=-2 → gana A
    const sorted = sortStandings(rows, [s1, s2], matches, DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });

  it("desempate H2H puntos: A gana ambas series (ida y vuelta)", () => {
    const [A, B] = ["A", "B"].map(makeTeam);
    const rows = [makeRow(B, 6, 0, 0, 0), makeRow(A, 6, 0, 0, 0)];
    // Serie 1: A local gana 2-1
    const s1 = makeSeries("s1", "A", "B");
    // Serie 2: B local, A visitante gana 2-1
    const s2 = makeSeries("s2", "B", "A");
    const matches = [
      makeCourtMatch("m1", "s1", 1, "6-4 6-2"), // A gana
      makeCourtMatch("m2", "s1", 2, "3-6 4-6"), // B gana
      makeCourtMatch("m3", "s1", 3, "6-3 6-4"), // A gana
      makeCourtMatch("m4", "s2", 1, "3-6 4-6"), // A (visitante) gana
      makeCourtMatch("m5", "s2", 2, "3-6 4-6"), // A (visitante) gana
      makeCourtMatch("m6", "s2", 3, "6-4 6-2"), // B (local) gana
    ];
    // H2H puntos: A=2+2=4, B=1+1=2 → gana A por puntos H2H
    const sorted = sortStandings(rows, [s1, s2], matches, DEFAULT_RULES);
    expect(sorted[0].team_id).toBe("A");
    expect(sorted[1].team_id).toBe("B");
  });
});

// ─── getTeamSchedule ─────────────────────────────────────────────────────────

describe("getTeamSchedule", () => {
  it("devuelve partidos jugados y pendientes para el equipo", () => {
    const s1 = makeSeries("s1", "A", "B", { status: "completed" });
    const s2 = makeSeries("s2", "C", "A", { status: "scheduled" });
    const s3 = makeSeries("s3", "A", "D", { status: "rescheduled" });

    const schedule = getTeamSchedule("A", [s1, s2, s3], []);
    expect(schedule).toHaveLength(3);
  });

  it("no incluye series de otros equipos", () => {
    const s1 = makeSeries("s1", "B", "C");
    const schedule = getTeamSchedule("A", [s1], []);
    expect(schedule).toHaveLength(0);
  });

  it("incluye court matches solo para partidos ya jugados", () => {
    const s1 = makeSeries("s1", "A", "B", { status: "completed" });
    const s2 = makeSeries("s2", "A", "C", { status: "scheduled" });
    const matches = [
      makeCourtMatch("m1", "s1", 1, "6-4 6-2"),
      makeCourtMatch("m2", "s1", 2, "3-6 4-6"),
      makeCourtMatch("m3", "s1", 3, "6-3 6-4"),
    ];

    const schedule = getTeamSchedule("A", [s1, s2], matches);
    const played = schedule.find((e) => e.series.id === "s1")!;
    const pending = schedule.find((e) => e.series.id === "s2")!;

    expect(played.courtMatches).toHaveLength(3);
    expect(pending.courtMatches).toHaveLength(0);
  });

  it("detalle de canchas visible solo en partidos ya jugados (WO general incluido)", () => {
    const s1 = makeSeries("s1", "A", "B", {
      status: "walkover",
      is_general_walkover: true,
      walkover_winner_team_id: "A",
    });
    const matches = [makeCourtMatch("m1", "s1", 1, "6-0 6-0")];

    const schedule = getTeamSchedule("A", [s1], matches);
    expect(schedule[0].courtMatches).toHaveLength(1);
  });

  it("identifica correctamente si el equipo es local o visitante", () => {
    const s1 = makeSeries("s1", "A", "B");
    const s2 = makeSeries("s2", "C", "A");

    const schedule = getTeamSchedule("A", [s1, s2], []);
    const asHome = schedule.find((e) => e.series.id === "s1")!;
    const asAway = schedule.find((e) => e.series.id === "s2")!;

    expect(asHome.isHome).toBe(true);
    expect(asAway.isHome).toBe(false);
  });
});
