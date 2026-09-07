import { StandingsTable } from "@/components/liga/StandingsTable";
import { PlayoffBracket } from "@/components/liga/PlayoffBracket";
import { ChampionBanner } from "@/components/liga/ChampionBanner";
import type { Category, StandingsRow, Team } from "@/lib/tournament/types";
import type { PlayoffSeriesSimple } from "@/lib/data/playoffs";
import type { ProvisionalBracket } from "@/lib/playoffs/types";

type ClosedCategoryBundle = {
  category: Category;
  standings: StandingsRow[];
  bracket: ProvisionalBracket | null;
  playoffSeries: PlayoffSeriesSimple[];
  champion: Team | null;
};

export function ClosedSeasonView({ bundles }: { bundles: ClosedCategoryBundle[] }) {
  if (bundles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        Todavía no hay categorías cargadas para esta edición.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
      {bundles.map(({ category, standings, bracket, champion }) => (
        <section key={category.id} className="space-y-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">{category.name}</h2>

          <ChampionBanner champion={champion} />

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Tabla final</h3>
            <StandingsTable standings={standings} />
          </div>

          {bracket && (
            <div>
              <PlayoffBracket bracket={bracket} provisional={false} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
