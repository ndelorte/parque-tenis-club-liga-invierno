import { cn } from "@/lib/utils"

export function SeasonAtmosphere({
  decoration,
  animated = true,
}: {
  decoration: "snow" | "sun" | null
  /** Ediciones cerradas dejan el clima quieto (maqueta F3), no es el control manual de pausa. */
  animated?: boolean
}) {
  return (
    <div className="liga-hero-band">
      {decoration && (
        <div
          className={cn(
            "liga-atmosphere",
            `liga-atmosphere-${decoration}`,
            !animated && "liga-atmosphere-still",
          )}
          aria-hidden="true"
        />
      )}
      <div className="liga-half-court" aria-hidden="true" />
      <div className="liga-band-baseline" aria-hidden="true" />
    </div>
  )
}
