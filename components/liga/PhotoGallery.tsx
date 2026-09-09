import Image from "next/image"
import type { TournamentPhoto } from "@/lib/data/tournament-photos"

export function PhotoGallery({ photos }: { photos: TournamentPhoto[] }) {
  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <figure key={photo.id} className="overflow-hidden rounded-xl border border-border bg-muted">
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
            <figcaption className="px-2 py-1.5 text-xs text-gray-600">{photo.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
