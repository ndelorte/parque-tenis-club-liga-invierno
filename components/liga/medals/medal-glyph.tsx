import type { MedalPlace } from "@/lib/liga/medals/types"

// Medalla: cintas en el verde del club y disco con el número del puesto.
// Los colores salen de las variables --medal-* de medals.css (con variante
// oscura); los atributos stroke de las cintas son solo el valor de respaldo.
export function MedalGlyph({
  place,
  width = 15,
  height = 18,
  className,
}: {
  place: MedalPlace
  width?: number
  height?: number
  className?: string
}) {
  return (
    <svg
      className={`liga-medal-glyph liga-medal-glyph--${place}${className ? ` ${className}` : ""}`}
      viewBox="0 0 20 24"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <path className="liga-medal-ribbon" d="M5 1 L8.5 9 M15 1 L11.5 9" stroke="#2c5a41" strokeWidth="3" strokeLinecap="round" />
      <circle className="liga-medal-disc" cx="10" cy="15.5" r="7" strokeWidth="1.5" />
      <text className="liga-medal-number" x="10" y="19" textAnchor="middle" fontSize="9.5" fontWeight="700">
        {place}
      </text>
    </svg>
  )
}
