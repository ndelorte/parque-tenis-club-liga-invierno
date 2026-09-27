import { PodiumBanner } from "@/components/liga/PodiumBanner";
import { PhotoGallery } from "@/components/liga/PhotoGallery";
import type { Category } from "@/lib/tournament/types";
import type { TournamentPhoto } from "@/lib/data/tournament-photos";

type ClosedCategoryBundle = {
  category: Category;
  championName: string | null;
  runnerUpName: string | null;
  thirdPlaceName: string | null;
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Todavía no hay categorías cargadas para esta edición.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
      {generalPhotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold text-foreground">Fotos de la premiación</h2>
          <PhotoGallery photos={generalPhotos} />
        </section>
      )}

      {bundles.map(({ category, championName, runnerUpName, thirdPlaceName, photos }) => (
        <section key={category.id} className="space-y-6">
          <h2 className="font-heading text-xl font-bold text-foreground">{category.name}</h2>

          <PodiumBanner
            championName={championName}
            runnerUpName={runnerUpName}
            thirdPlaceName={thirdPlaceName}
          />

          {photos.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Fotos</h3>
              <PhotoGallery photos={photos} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
