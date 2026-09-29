import Image from "next/image"
import { PodiumBanner } from "@/components/liga/PodiumBanner"
import { getSeasonTheme } from "@/components/liga/season-theme"
import type { Category, Tournament } from "@/lib/tournament/types"
import type { TournamentPhoto } from "@/lib/data/tournament-photos"

type ClosedCategoryBundle = {
  category: Category
  championName: string | null
  runnerUpName: string | null
  thirdPlaceName: string | null
  photos: TournamentPhoto[]
}

// Galería simple: el carrusel dedicado (PhotoGallery) se pospuso a una fase
// posterior del refactor visual (product/plan-refactor-visual.md §4.4), pero
// las fotos que un admin ya subió desde /panel-liga no pueden quedar sin
// mostrarse en ningún lado público.
function PhotoGrid({ photos, emptyMessage }: { photos: TournamentPhoto[]; emptyMessage?: string }) {
  if (photos.length === 0) return emptyMessage ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : null
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <figure key={photo.id} className="overflow-hidden rounded-md border border-border bg-muted">
          <div className="relative aspect-square">
            <Image
              src={photo.url}
              alt={photo.caption ?? "Foto de premiación"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
          {photo.caption && (
            <figcaption className="px-2 py-1.5 text-xs text-muted-foreground">{photo.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}

export function ClosedSeasonView({
  tournament,
  bundles,
  generalPhotos = [],
}: {
  tournament: Pick<Tournament, "slug" | "name">
  bundles: ClosedCategoryBundle[]
  generalPhotos?: TournamentPhoto[]
}) {
  const theme = getSeasonTheme(tournament)

  return (
    <section className="liga-closed liga-container" data-identity={theme.identity} aria-labelledby="liga-closed-title">
      <div className="liga-section-heading">
        <p className="liga-eyebrow">Una edición para recordar</p>
        <h2 id="liga-closed-title">El podio de cada categoría</h2>
        <p>Los equipos que llegaron más lejos en esta temporada.</p>
      </div>
      {bundles.length === 0 ? <p className="liga-empty">Todavía no hay categorías cargadas para esta edición.</p> : (
        <div className="liga-podium-grid">
          {bundles.map(({ category, championName, runnerUpName, thirdPlaceName, photos }) => (
            <article className="liga-podium-card" key={category.id} aria-label={category.name}>
              <PodiumBanner
                categoryName={category.name}
                championName={championName}
                runnerUpName={runnerUpName}
                thirdPlaceName={thirdPlaceName}
              />
              {photos.length > 0 && (
                <div className="border-t border-border p-3">
                  <PhotoGrid photos={photos} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {generalPhotos.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-heading text-xl font-bold text-foreground">Fotos de la edición</h3>
          <PhotoGrid photos={generalPhotos} />
        </div>
      )}
    </section>
  )
}
