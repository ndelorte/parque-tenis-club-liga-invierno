import { describe, it, expect } from "vitest"
import { buildMedalCandidates, candidateKey, preselectedKeys, type PodiumEntry } from "../candidates"
import { groupMedalsByTeam } from "../fromRows"

const entry = (over: Partial<PodiumEntry>): PodiumEntry => ({
  categoryId: "c1", categoryName: "Caballeros A", categorySlug: "caballeros-a",
  tournamentName: "Liga de Invierno", tournamentSlug: "liga-invierno-2025", season: 2025,
  place: 1, historicName: "Parque Tenis", ...over,
})

// Podios reales de supabase/seeds/003_liga_historica_podios.sql
const entries: PodiumEntry[] = [
  entry({ categoryId: "inv25-dama-a", categoryName: "Damas A", categorySlug: "damas-a", place: 1, historicName: "Pinamar" }),
  entry({ categoryId: "inv25-cab-a", place: 1, historicName: "Parque Tenis" }),
  entry({ categoryId: "ver26-cab-a", tournamentName: "Liga de Verano", tournamentSlug: "liga-verano-2025-2026", place: 1, historicName: "Parque tenis" }),
  entry({ categoryId: "inv25-dama-b", categoryName: "Damas B", categorySlug: "damas-b", place: 2, historicName: "Gin Tonic" }),
  entry({ categoryId: "ver26-dama-b", categoryName: "Damas B", categorySlug: "damas-b", tournamentName: "Liga de Verano", tournamentSlug: "liga-verano-2025-2026", place: 3, historicName: "La Red de amigas" }),
]

describe("buildMedalCandidates", () => {
  it("equipo de una palabra: solo el nombre idéntico", () => {
    const c = buildMedalCandidates(entries, "Pinamar")
    expect(c.filter((x) => x.match).map((x) => x.categoryId)).toEqual(["inv25-dama-a"])
    expect(preselectedKeys(c)).toEqual(["inv25-dama-a:1"])
  })
  it("las coincidencias exactas van primero, la más reciente antes, y se pretildan", () => {
    const c = buildMedalCandidates(entries, "Parque Tenis")
    expect(c.slice(0, 2).map((x) => x.categoryId)).toEqual(["ver26-cab-a", "inv25-cab-a"])
    expect(preselectedKeys(c)).toEqual(["ver26-cab-a:1", "inv25-cab-a:1"])
  })
  it("las parecidas no se pretildan", () => {
    const c = buildMedalCandidates(entries, "Gin Tonic Verano")
    expect(c[0]).toMatchObject({ categoryId: "inv25-dama-b", match: "similar" })
    expect(preselectedKeys(c)).toEqual([])
  })
  it("una sola categoría no se tilda dos veces", () => {
    const dup = [entry({ categoryId: "x", place: 1, historicName: "Dream Team" }), entry({ categoryId: "x", place: 2, historicName: "Dream Team" })]
    expect(preselectedKeys(buildMedalCandidates(dup, "Dream Team"))).toEqual(["x:1"])
  })
  it("candidateKey", () => {
    expect(candidateKey({ categoryId: "a", place: 2 })).toBe("a:2")
  })
})

describe("groupMedalsByTeam", () => {
  it("agrupa por equipo, ordena y descarta filas incompletas", () => {
    const grouped = groupMedalsByTeam([
      { team_id: "t1", place: 2, categories: { name: "Damas A", slug: "damas-a", tournaments: { slug: "liga-invierno-2025", season: 2025 } } },
      { team_id: "t1", place: 1, categories: { name: "Damas A", slug: "damas-a", tournaments: [{ slug: "liga-verano-2025-2026", season: 2025 }] } },
      { team_id: "t2", place: 1, categories: null },
      { team_id: "t2", place: 9, categories: { name: "X", slug: "x", tournaments: { slug: "liga-invierno-2025", season: 2025 } } },
    ])
    expect(Object.keys(grouped)).toEqual(["t1"])
    expect(grouped.t1.map((m) => m.tournamentSlug)).toEqual(["liga-verano-2025-2026", "liga-invierno-2025"])
  })
})
