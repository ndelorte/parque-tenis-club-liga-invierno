import { SeasonSelector } from "@/components/liga/SeasonSelector"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getAllTournaments } from "@/lib/data/tournaments"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Liga de Invierno | Parque Tenis Club",
  description: "Elegí una temporada de la Liga de Invierno o Verano: tabla, fixture y equipos.",
}

export default async function LigaInviernoSelectorPage() {
  const tournaments = await getAllTournaments()

  return (
    <main className="min-h-dvh bg-background">
      <SeasonSelector tournaments={tournaments} />
      <WhatsappFab />
    </main>
  )
}
