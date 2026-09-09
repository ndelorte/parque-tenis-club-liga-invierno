import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Activities } from "@/components/activities"
import { WinterLeague } from "@/components/winter-league"
import { MidMasterPromo } from "@/components/mid-master/MidMasterPromo"
import { InterparquePromo } from "@/components/interparque/InterparquePromo"
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
        <MidMasterPromo />
        <LocationContact />
      </main>
      <SiteFooter />
      <WhatsappFab />
    </div>
  )
}
