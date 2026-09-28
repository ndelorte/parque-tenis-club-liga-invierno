import Link from "next/link"
import { CalendarDays, ArrowUpRight } from "lucide-react"
import { getSeasonTheme } from "@/components/liga/season-theme"
import type { Tournament } from "@/lib/tournament/types"

export function ComingSoonView({ tournament }: { tournament: Tournament }) {
  const theme = getSeasonTheme(tournament)
  return (
    <section className="liga-coming-soon liga-container" data-identity={theme.identity} aria-labelledby="liga-coming-title">
      <div className="liga-coming-mark"><CalendarDays size={32} aria-hidden="true" /></div>
      <p className="liga-eyebrow">{theme.label}</p>
      <h2 id="liga-coming-title">Próximamente en la cancha</h2>
      <p>Esta edición todavía no comenzó. Cuando arranque, vas a encontrar acá las categorías, los equipos, la tabla y el fixture.</p>
      {tournament.start_date && <p className="liga-coming-date">Inicio previsto: <time dateTime={tournament.start_date}>{new Date(`${tournament.start_date}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</time></p>}
      <Link href="/ligas-invierno-verano" className="liga-solid-link">Ver todas las ediciones <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </section>
  )
}
