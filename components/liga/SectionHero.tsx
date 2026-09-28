import Image from "next/image"
import Link from "next/link"
import { SeasonAtmosphere } from "@/components/liga/SeasonAtmosphere"
import { getSeasonTheme } from "@/components/liga/season-theme"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"
import type { Tournament } from "@/lib/tournament/types"

const STATUS_LABEL = { active: "En juego", upcoming: "Próxima", finished: "Finalizada" } satisfies Record<Tournament["status"], string>

export function SectionHero({ tournament }: { tournament: Tournament }) {
  const theme = getSeasonTheme(tournament)
  return (
    <header className="liga-section-hero" data-identity={theme.identity}>
      <div className="liga-hero-grid liga-container">
        <div className="liga-hero-copy">
          <Link className="liga-back-link" href="/ligas-invierno-verano">← Todas las ediciones</Link>
          <div className="liga-hero-kicker-row">
            {theme.logo && <span className="liga-logo-disc liga-hero-logo"><Image src={theme.logo} alt={theme.logoAlt} width={88} height={88} priority /></span>}
            <span className="liga-hero-kicker">{theme.label}</span>
          </div>
          <h1>{formatTournamentTitle(tournament)}</h1>
          <div className="liga-hero-meta"><span className={`liga-status liga-status-${tournament.status}`}>{STATUS_LABEL[tournament.status]}</span>{tournament.description && <p>{tournament.description}</p>}</div>
        </div>
        <SeasonAtmosphere decoration={theme.decoration} />
      </div>
    </header>
  )
}
