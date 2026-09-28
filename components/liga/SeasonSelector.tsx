import Image from "next/image"
import Link from "next/link"
import { SeasonCard } from "@/components/liga/SeasonCard"
import { getSeasonTheme, type Season } from "@/components/liga/season-theme"
import type { Tournament } from "@/lib/tournament/types"

const GROUPS: { season: Season; title: string; dates: string; logo: string }[] = [
  { season: "invierno", title: "Liga de Invierno", dates: "Julio a septiembre", logo: "/images/logoligadeinvierno.png" },
  { season: "verano", title: "Liga de Verano", dates: "Diciembre a marzo", logo: "/images/logoligaverano.png" },
]

export function SeasonSelector({ tournaments }: { tournaments: Tournament[] }) {
  const sorted = [...tournaments].sort((a, b) => b.season - a.season)
  const groups = GROUPS.map((group) => ({ ...group, editions: sorted.filter((t) => getSeasonTheme(t).season === group.season) }))
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
              {group.editions.length > 0 ? <ol className="liga-timeline">{group.editions.map((t) => <SeasonCard key={t.id} tournament={t} />)}</ol> : <p className="liga-column-empty">Todavía no hay ediciones cargadas.</p>}
            </section>
          ))}
          {other.length > 0 && <section className="liga-season-column liga-season-other" aria-labelledby="liga-other-title"><div className="liga-season-column-head"><div><h2 id="liga-other-title">Otras ediciones</h2></div></div><ol className="liga-timeline">{other.map((t) => <SeasonCard key={t.id} tournament={t} />)}</ol></section>}
        </div>
      )}
      <Link className="liga-rules-link" href="/ligas-invierno-verano/reglamento">Reglamento de la Liga <span aria-hidden="true">↗</span></Link>
    </div>
  )
}
