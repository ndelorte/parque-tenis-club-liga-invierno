import { notFound, redirect } from "next/navigation"
import { getTeamBySlug } from "@/lib/data/teams"
import { getCategoryById } from "@/lib/data/categories"
import { getActiveTournament } from "@/lib/data/tournaments"

export default async function EquipoRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)
  if (!team) notFound()
  const category = await getCategoryById(team.category_id)
  if (!category) notFound()
  const tournament = await getActiveTournament()
  redirect(
    tournament
      ? `/liga-invierno/${tournament.slug}/equipos/${category.slug}/${team.slug}`
      : "/liga-invierno",
  )
}
