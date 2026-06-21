import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTeamBySlug,
  getSeriesForTeam,
  mockTeamPlayersCaballerosA,
} from "@/mock/data";
import { TeamSchedule } from "@/components/liga/TeamSchedule";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) return {};
  return {
    title: `${team.name} | Liga de Invierno | Parque Tenis Club`,
    description: `Historial, jugadores y fixture de ${team.name}.`,
  };
}

export default async function EquipoPage({ params }: Props) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) notFound();

  const series = getSeriesForTeam(slug);
  const roster = mockTeamPlayersCaballerosA.filter((tp) => tp.team_id === team.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Encabezado del equipo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        {team.captain_name && (
          <p className="text-gray-600 text-sm mt-1">
            Capitán: <span className="font-medium">{team.captain_name}</span>
          </p>
        )}
      </div>

      {/* Lista de buena fe */}
      {roster.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-800 mb-3">Lista de buena fe</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roster.map((tp) => (
              <li
                key={tp.id}
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <span className="text-gray-900">{tp.player?.display_name}</span>
                {tp.is_captain && (
                  <span className="ml-auto text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-medium">
                    Cap
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Historial y fixture */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-4">Historial</h2>
        <TeamSchedule team={team} series={series} />
      </section>
    </div>
  );
}
