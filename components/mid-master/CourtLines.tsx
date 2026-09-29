import { cn } from "@/lib/utils"

type CourtLinesProps = {
  className?: string
}

// Delay de cada trazo (ms), igual a la maqueta:
// product/refactor-visual/maquetas/fase-4/Opcion1-EspecialesEdicion.dc.html
const LINE_DELAYS_MS = [0, 60, 120, 180, 240, 300, 360]

/**
 * Líneas de cancha decorativas en dorado, compartidas por Mid Master y Final
 * Master (identidad "Especiales"). Puramente decorativo: aria-hidden, nunca
 * role="img". Se dibujan una sola vez al montar (ver .mm-court-line y
 * @keyframes mm-court-draw en app/globals.css) y respetan
 * prefers-reduced-motion vía motion-reduce:animate-none.
 */
export function CourtLines({ className }: CourtLinesProps) {
  return (
    <svg
      className={cn("h-auto w-full max-h-[340px]", className)}
      viewBox="0 0 640 300"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[0]}ms` }}
        x="20"
        y="20"
        width="600"
        height="260"
        pathLength={1}
      />
      <line
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[1]}ms` }}
        x1="20"
        y1="52"
        x2="620"
        y2="52"
        pathLength={1}
      />
      <line
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[2]}ms` }}
        x1="20"
        y1="248"
        x2="620"
        y2="248"
        pathLength={1}
      />
      <line
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[3]}ms` }}
        x1="155"
        y1="52"
        x2="155"
        y2="248"
        pathLength={1}
      />
      <line
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[4]}ms` }}
        x1="485"
        y1="52"
        x2="485"
        y2="248"
        pathLength={1}
      />
      <line
        className="mm-court-line animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[5]}ms` }}
        x1="155"
        y1="150"
        x2="485"
        y2="150"
        pathLength={1}
      />
      <line
        className="mm-court-line mm-court-line-net animate-mm-court-draw motion-reduce:animate-none"
        style={{ animationDelay: `${LINE_DELAYS_MS[6]}ms` }}
        x1="320"
        y1="8"
        x2="320"
        y2="292"
        pathLength={1}
      />
    </svg>
  )
}
