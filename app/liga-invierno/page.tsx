import { LigaHeader } from "@/components/liga/liga-header"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { WhatsappFab } from "@/components/whatsapp-fab"

export const metadata = {
  title: "Liga de Invierno 2026 | Parque Tenis Club",
  description:
    "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorías Caballeros, Damas y Mixto.",
}

export default function LigaInviernoPage() {
  return (
    <main className="min-h-dvh bg-background">
      <LigaHeader />
      <LigaBoard />
      <LigaReglamento />
      <WhatsappFab />
    </main>
  )
}
