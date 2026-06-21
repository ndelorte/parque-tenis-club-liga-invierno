import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { mockTournament, mockCategories, mockStandingsCaballerosA, mockSeriesCaballerosA } from "@/mock/data";
import { TournamentHeader } from "@/components/liga/TournamentHeader";
import { StandingsTable } from "@/components/liga/StandingsTable";
import { FixtureList } from "@/components/liga/FixtureList";

export const metadata: Metadata = {
  title: site.seo.liga.title,
  description: site.seo.liga.description,
};

export default function LigaInviernoPage() {
  const recentSeries = mockSeriesCaballerosA.filter(
    (s) => s.status === "completed" || s.status === "walkover"
  );

  return (
    <div>
      <TournamentHeader tournament={mockTournament} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Selector de categorías */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {mockCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/liga-invierno/categorias/${cat.slug}`}
                className="bg-white border border-border hover:border-brand hover:shadow-sm rounded-lg px-3 py-3 text-center text-sm font-medium text-gray-700 hover:text-brand transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Tabla destacada — Caballeros A */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tabla — Caballeros A
            </h2>
            <Link
              href="/liga-invierno/categorias/caballeros-a"
              className="text-sm text-brand hover:underline"
            >
              Ver completo
            </Link>
          </div>
          <StandingsTable standings={mockStandingsCaballerosA} />
        </section>

        {/* Últimos resultados */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Últimos resultados</h2>
          <FixtureList series={recentSeries} />
        </section>

        {/* Link reglamento */}
        <section className="bg-surface border border-border rounded-xl px-6 py-5">
          <p className="font-semibold text-gray-800 mb-1">Reglamento de la Liga</p>
          <p className="text-sm text-gray-500 mb-3">
            Consultá el sistema de puntos, desempates y formato del torneo.
          </p>
          <Link
            href="/liga-invierno/reglamento"
            className="inline-block text-brand hover:underline text-sm font-medium"
          >
            Ver reglamento →
          </Link>
        </section>
      </div>
    </div>
  );
}
