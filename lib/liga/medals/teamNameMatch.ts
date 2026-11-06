import { compareNames, nameKey, type NameMatch } from "@/lib/players/similarNames"

// Compara el nombre de un equipo inscripto con el nombre histórico de un
// podio. `compareNames` está pensado para personas y rechaza como "parecido"
// los nombres de una sola palabra (coincidirían con medio mundo). Los
// equipos sí pueden tener una sola palabra ("Pinamar"), así que:
//   - "same": mismas palabras (sin importar mayúsculas, acentos, signos ni
//     orden), con cualquier cantidad de palabras.
//   - "similar": parecido por palabras, solo si ambos nombres tienen 2+
//     palabras ("Parque Tenis 2" ~ "Parque Tenis", "Gin Tonic Verano" ~
//     "Gin Tonic"). Un nombre de una palabra solo coincide si es idéntico.
export function matchTeamName(registered: string, historic: string): NameMatch | null {
  const a = nameKey(registered)
  const b = nameKey(historic)
  if (!a || !b) return null
  if (a === b) return "same"
  return compareNames(registered, historic)
}
