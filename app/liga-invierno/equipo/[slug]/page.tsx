import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { TeamDetailView } from "@/components/liga/team-detail"
import { getTeamDetail, getAllTeamSlugs } from "@/lib/equipos"

export function generateStaticParams() {
  return getAllTeamSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const team = getTeamDetail(slug)
  if (!team) return { title: "Equipo no encontrado | Parque Tenis Club" }
  return {
    title: `${team.name} · ${team.categoryLabel} | Liga de Invierno`,
    description: `Detalle del equipo ${team.name} en la Liga de Invierno de Parque Tenis Club: plantel, estadísticas, fechas jugadas y fixture pendiente.`,
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const team = getTeamDetail(slug)
  if (!team) notFound()

  return (
    <main className="min-h-dvh bg-background">
      <TeamDetailView team={team} />
      <WhatsappFab />
    </main>
  )
}
