import { redirect } from "next/navigation"
import { getActiveTournament } from "@/lib/data/tournaments"

interface Props {
  params: Promise<{ slug: string }>
}

// Ruta vieja (sin temporada). Redirige a la edición activa — Sprint L2.
export default async function CategoriaRedirectPage({ params }: Props) {
  const { slug } = await params
  const tournament = await getActiveTournament()
  redirect(tournament ? `/liga-invierno/${tournament.slug}/categorias/${slug}` : "/liga-invierno")
}
