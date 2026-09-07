import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Activities } from "@/components/activities"
import { WinterLeague } from "@/components/winter-league"
import { InterparquePromo } from "@/components/interparque/InterparquePromo"
import { CircuitoPromo } from "@/components/circuito/CircuitoPromo"
import { LocationContact } from "@/components/location-contact"
import { SiteFooter } from "@/components/site-footer"
import { WhatsappFab } from "@/components/whatsapp-fab"

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main>
        <Hero />
        <Activities />
        <WinterLeague />
        <InterparquePromo />
        <CircuitoPromo />
        <LocationContact />
      </main>
      <SiteFooter />
      <WhatsappFab />
    </div>
  )
}
