import type { MedalPlace } from "@/lib/liga/medals/types"
import { MedalGlyph } from "./medal-glyph"

// Ficha: la medalla más su descripción ("Subcampeonas Verano 2025/26") en
// una píldora. Es lo que se ve en la página del equipo y lo que se despliega
// al apoyarse en una medalla suelta.
export function MedalFicha({ place, text, className }: { place: MedalPlace; text: string; className?: string }) {
  return (
    <span className={`liga-medal-ficha liga-medal-ficha--${place}${className ? ` ${className}` : ""}`}>
      <MedalGlyph place={place} width={16} height={19} />
      <span>{text}</span>
    </span>
  )
}
