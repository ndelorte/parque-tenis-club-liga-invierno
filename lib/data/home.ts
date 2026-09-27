import { getAllTournaments } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getCircuitoEditions } from "@/lib/data/circuito/editions"
import { getCircuitoCategoriesForEdition } from "@/lib/data/circuito/categories"
import { getInterparqueMatches, getInterparquePlayers } from "@/lib/data/interparque"
import {
  buildInterparqueEnJuego,
  buildLigaEnJuego,
  countPlayedCategories,
  pickCircuitoEdition,
  type CircuitoEnJuego,
  type InterparqueEnJuego,
  type LigaEnJuego,
} from "@/lib/home/enJuego"

export type EnJuego = {
  liga: LigaEnJuego | null
  circuito: CircuitoEnJuego | null
  interparque: InterparqueEnJuego
}

// Datos del tablero "En juego" de la home. Solo lecturas existentes.
export async function getEnJuego(): Promise<EnJuego> {
  const [tournaments, editions, players, matches] = await Promise.all([
    getAllTournaments(),
    getCircuitoEditions(),
    getInterparquePlayers(),
    getInterparqueMatches(),
  ])

  const active = tournaments.find((t) => t.status === "active")
  const activeRounds = active
    ? await Promise.all((await getCategoriesForTournament(active.id)).map((c) => getRoundsWithSeries(c.id)))
    : []

  const edition = pickCircuitoEdition(editions)
  const circuito = edition
    ? {
        title: edition.name,
        slug: edition.slug,
        categories: countPlayedCategories(await getCircuitoCategoriesForEdition(edition.id)),
      }
    : null

  return {
    liga: buildLigaEnJuego(tournaments, activeRounds),
    circuito,
    interparque: buildInterparqueEnJuego(players, matches),
  }
}
