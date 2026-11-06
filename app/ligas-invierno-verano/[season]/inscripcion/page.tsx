import Link from "next/link"
import { notFound } from "next/navigation"
import { SectionHero } from "@/components/liga/SectionHero"
import { RegistrationSection } from "@/components/liga/RegistrationSection"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getSeasonTheme } from "@/components/liga/season-theme"
import { getRegistrationPageData } from "@/lib/data/liga-registration"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"
import { getTournamentBySlug } from "@/lib/data/tournaments"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ season: string }>
}

export async function generateMetadata({ params }: Props) {
  const { season } = await params
  const tournament = await getTournamentBySlug(season)
  if (!tournament) return {}
  return {
    title: `Inscripción | ${formatTournamentTitle(tournament)} | Parque Tenis Club`,
    description: "Inscribí a tu equipo en la liga de Parque Tenis Club.",
  }
}

export default async function RegistrationPage({ params }: Props) {
  const { season } = await params
  const data = await getRegistrationPageData(season)
  if (!data) notFound()
  const { tournament, categories, availability } = data
  const theme = getSeasonTheme(tournament)

  return (
    <main className="min-h-dvh bg-background" data-identity={theme.identity}>
      <SectionHero tournament={tournament} />
      <div className="liga-container liga-registration-page" data-identity={theme.identity}>
        <Link href={`/ligas-invierno-verano/${tournament.slug}`} className="liga-back-link">
          ← Volver a la edición
        </Link>
        <RegistrationSection seasonSlug={tournament.slug} categories={categories} availability={availability} />
      </div>
      <WhatsappFab />
    </main>
  )
}
