import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { getSeasonTheme } from "@/components/liga/season-theme"
import { seasonHref } from "@/lib/tournament/seasonRoutes"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"
import type { Tournament } from "@/lib/tournament/types"

const STATUS_LABEL = {
  active: "En juego",
  upcoming: "Próxima",
  finished: "Finalizada",
} satisfies Record<Tournament["status"], string>

export function SeasonCard({ tournament }: { tournament: Tournament }) {
  const theme = getSeasonTheme(tournament)
  const featured = tournament.status !== "finished"

  return (
    <li className={`liga-timeline-item${featured ? " liga-timeline-item-featured" : ""}`} data-identity={theme.identity}>
      <span className="liga-timeline-dot" aria-hidden="true" />
      <Link href={seasonHref(tournament.slug)} className="liga-season-link">
        <span className="liga-season-name">
          {formatTournamentTitle(tournament)}
          <span className={`liga-status liga-status-${tournament.status}`}>{STATUS_LABEL[tournament.status]}</span>
        </span>
        {tournament.description && <span className="liga-season-description">{tournament.description}</span>}
        {featured && <span className="liga-season-go">{tournament.status === "active" ? "Ver tabla y fixture" : "Ver edición"}<ArrowUpRight aria-hidden="true" size={16} /></span>}
      </Link>
    </li>
  )
}
