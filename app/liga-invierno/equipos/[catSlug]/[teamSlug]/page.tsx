import { redirect } from "next/navigation"
import { getActiveTournament } from "@/lib/data/tournaments"

interface Props {
  params: Promise<{ catSlug: string; teamSlug: string }>
}

// Ruta vieja (sin temporada). Redirige a la edición activa — Sprint L2.
export default async function EquipoRedirectPage({ params }: Props) {
  const { catSlug, teamSlug } = await params
  const tournament = await getActiveTournament()
  redirect(
    tournament ? `/liga-invierno/${tournament.slug}/equipos/${catSlug}/${teamSlug}` : "/liga-invierno",
  )
}
