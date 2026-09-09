import { StandingsTable } from "@/components/liga/StandingsTable";
import { PlayoffBracket } from "@/components/liga/PlayoffBracket";
import { ChampionBanner } from "@/components/liga/ChampionBanner";
import { PhotoGallery } from "@/components/liga/PhotoGallery";
import type { Category, StandingsRow, Team } from "@/lib/tournament/types";
import type { PlayoffSeriesSimple } from "@/lib/data/playoffs";
import type { ProvisionalBracket } from "@/lib/playoffs/types";
import type { TournamentPhoto } from "@/lib/data/tournament-photos";

type ClosedCategoryBundle = {
  category: Category;
  standings: StandingsRow[];
  bracket: ProvisionalBracket | null;
  playoffSeries: PlayoffSeriesSimple[];
  champion: Team | null;
  photos: TournamentPhoto[];
};

export function ClosedSeasonView({
  bundles,
  generalPhotos = [],
}: {
  bundles: ClosedCategoryBundle[];
  generalPhotos?: TournamentPhoto[];
}) {
  if (bundles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        Todavía no hay categorías cargadas para esta edición.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
      {generalPhotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold text-gray-900">Fotos de la premiación</h2>
          <PhotoGallery photos={generalPhotos} />
        </section>
      )}

      {bundles.map(({ category, standings, bracket, champion, photos }) => (
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

          {photos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Fotos</h3>
              <PhotoGallery photos={photos} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
