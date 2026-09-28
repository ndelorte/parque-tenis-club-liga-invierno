import Image from "next/image"
import Link from "next/link"
import { SeasonCard } from "@/components/liga/SeasonCard"
import { getSeasonTheme, type Season } from "@/components/liga/season-theme"
import type { Tournament } from "@/lib/tournament/types"

// Título, logo y logoAlt salen de getSeasonTheme() (fuente única, `season-theme.ts`).
// Acá solo queda lo que ese helper no expone: el rango de fechas de cada estación.
const SEASON_DATES: Record<Exclude<Season, "neutro">, string> = {
  invierno: "Julio a septiembre",
  verano: "Diciembre a marzo",
}
const SEASONS: Exclude<Season, "neutro">[] = ["invierno", "verano"]

export function SeasonSelector({
  tournaments,
  championsByTournamentId = {},
}: {
  tournaments: Tournament[]
  championsByTournamentId?: Record<string, string>
}) {
  const sorted = [...tournaments].sort((a, b) => b.season - a.season)
  const groups = SEASONS.map((season) => {
    const theme = getSeasonTheme({ slug: `liga-${season}`, name: "" })
    return {
      season,
      title: theme.title,
      logo: theme.logo!,
      logoAlt: theme.logoAlt,
      dates: SEASON_DATES[season],
      editions: sorted.filter((t) => getSeasonTheme(t).season === season),
    }
  })
  const other = sorted.filter((t) => getSeasonTheme(t).season === "neutro")

  return (
    <div className="liga-selector liga-container">
      <header className="liga-selector-intro">
        <h1>Ligas de Invierno y Verano</h1>
        <p>Torneo por equipos de dobles: cada serie se juega en 3 canchas y gana quien se lleva 2. Elegí la edición.</p>
      </header>
      {tournaments.length === 0 ? (
        <p className="liga-empty">Todavía no hay ediciones cargadas.</p>
      ) : (
        <div className="liga-seasons-grid">
          {groups.map((group) => (
            <section key={group.season} className="liga-season-column" data-identity={`liga-${group.season}`} aria-labelledby={`liga-${group.season}-title`}>
              <div className="liga-season-column-head">
                <span className="liga-court-lines" aria-hidden="true" />
                <span className="liga-logo-disc"><Image src={group.logo} alt="" width={72} height={72} /></span>
                <div><h2 id={`liga-${group.season}-title`}>{group.title}</h2><p>{group.dates}</p></div>
              </div>
              {group.editions.length > 0 ? <ol className="liga-timeline">{group.editions.map((t) => <SeasonCard key={t.id} tournament={t} championsSummary={championsByTournamentId[t.id]} />)}</ol> : <p className="liga-column-empty">Todavía no hay ediciones cargadas.</p>}
            </section>
          ))}
          {other.length > 0 && <section className="liga-season-column liga-season-other" aria-labelledby="liga-other-title"><div className="liga-season-column-head"><div><h2 id="liga-other-title">Otras ediciones</h2></div></div><ol className="liga-timeline">{other.map((t) => <SeasonCard key={t.id} tournament={t} championsSummary={championsByTournamentId[t.id]} />)}</ol></section>}
        </div>
      )}
      <Link className="liga-rules-link" href="/ligas-invierno-verano/reglamento">Reglamento de la Liga <span aria-hidden="true">↗</span></Link>
    </div>
  )
}
