import { SiteHeader } from "@/components/site-header"
import { HomeHero } from "@/components/home/home-hero"
import { Competitions } from "@/components/home/competitions"
import { ClubActivities } from "@/components/home/club-activities"
import { VisitClub } from "@/components/home/visit-club"
import { SiteFooter } from "@/components/site-footer"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getEnJuego } from "@/lib/data/home"

export const dynamic = "force-dynamic"

export default async function Home() {
  const enJuego = await getEnJuego()

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main id="contenido" className="scroll-mt-20">
        <HomeHero enJuego={enJuego} />
        <Competitions />
        <ClubActivities />
        <VisitClub />
      </main>
      <SiteFooter />
      <WhatsappFab />
    </div>
  )
}
