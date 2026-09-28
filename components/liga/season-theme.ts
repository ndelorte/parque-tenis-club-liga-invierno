import type { Tournament } from "@/lib/tournament/types"

export type Season = "invierno" | "verano" | "neutro"

export type SeasonTheme = {
  season: Season
  identity: "liga-invierno" | "liga-verano" | undefined
  label: string
  title: string
  logo: string | null
  logoAlt: string
  decoration: "snow" | "sun" | null
}

export function seasonFromSlug(slug: string): Season {
  if (/^liga-invierno(?:-|$)/i.test(slug)) return "invierno"
  if (/^liga-verano(?:-|$)/i.test(slug)) return "verano"
  return "neutro"
}

export function getSeasonTheme(tournament: Pick<Tournament, "slug" | "name">): SeasonTheme {
  const season = seasonFromSlug(tournament.slug)

  if (season === "invierno") return {
    season, identity: "liga-invierno", label: "Temporada de invierno", title: "Liga de Invierno",
    logo: "/images/logoligadeinvierno.png", logoAlt: "Logo de la Liga de Invierno", decoration: "snow",
  }
  if (season === "verano") return {
    season, identity: "liga-verano", label: "Temporada de verano", title: "Liga de Verano",
    logo: "/images/logoligaverano.png", logoAlt: "Logo de la Liga de Verano", decoration: "sun",
  }
  return {
    season, identity: undefined, label: "Temporada de Liga", title: "Liga Invierno/Verano",
    logo: null, logoAlt: "", decoration: null,
  }
}
