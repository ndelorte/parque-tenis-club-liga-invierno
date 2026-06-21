import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  mockCategories,
  mockTournament,
  getCategoryBySlug,
  getStandingsByCategory,
  getSeriesByCategory,
  getTeamsByCategory,
} from "@/mock/data";
import { TournamentHeader } from "@/components/liga/TournamentHeader";
import { StandingsTable } from "@/components/liga/StandingsTable";
import { FixtureList } from "@/components/liga/FixtureList";
import { TeamCard } from "@/components/liga/TeamCard";
import { CategoryTabs } from "@/components/liga/CategoryTabs";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return mockCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | Liga de Invierno | Parque Tenis Club`,
    description: `Tabla de posiciones, fixture y equipos de la categoría ${category.name}.`,
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const standings = getStandingsByCategory(slug);
  const series = getSeriesByCategory(slug);
  const teams = getTeamsByCategory(slug);

  return (
    <div>
      <TournamentHeader tournament={mockTournament} />
      <CategoryTabs categories={mockCategories} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>

        {/* Tabla de posiciones */}
        <section>
          <h3 className="font-semibold text-gray-800 mb-3">Tabla de posiciones</h3>
          <StandingsTable standings={standings} />
        </section>

        {/* Fixture y resultados */}
        <section>
          <FixtureList series={series} />
        </section>

        {/* Equipos */}
        {teams.length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-800 mb-3">Equipos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
