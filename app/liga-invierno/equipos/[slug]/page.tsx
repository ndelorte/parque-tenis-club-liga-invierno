import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeamDetail, getAllTeamSlugs } from "@/lib/equipos";
import { TeamDetailView } from "@/components/liga/team-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllTeamSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamDetail(slug);
  if (!team) return {};
  return {
    title: `${team.name} | Liga de Invierno | Parque Tenis Club`,
    description: `Historial, jugadores y fixture de ${team.name} en la Liga de Invierno.`,
  };
}

export default async function EquipoPage({ params }: Props) {
  const { slug } = await params;
  const team = getTeamDetail(slug);
  if (!team) notFound();

  return <TeamDetailView team={team} />;
}
