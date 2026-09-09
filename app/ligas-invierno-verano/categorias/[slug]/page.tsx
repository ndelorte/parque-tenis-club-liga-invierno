import { redirect } from "next/navigation"
import { getActiveTournament } from "@/lib/data/tournaments"
import { LIGAS_BASE, categoryHref } from "@/lib/tournament/seasonRoutes"

interface Props {
  params: Promise<{ slug: string }>
}

// Ruta vieja (sin temporada). Redirige a la edición activa — Sprint L2.
export default async function CategoriaRedirectPage({ params }: Props) {
  const { slug } = await params
  const tournament = await getActiveTournament()
  redirect(tournament ? categoryHref(tournament.slug, slug) : LIGAS_BASE)
}
