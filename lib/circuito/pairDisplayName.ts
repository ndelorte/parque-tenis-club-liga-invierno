// Nombre corto de una pareja de dobles del Circuito mensual: solo los dos
// apellidos, "Michel / Toro". Es solo de presentación: el display_name guardado
// del participante no se toca.

// Partículas que pertenecen al apellido y se unen a la palabra siguiente
// ("De La Iglesia Santiago" -> "De La Iglesia").
const SURNAME_PARTICLES = new Set(["de", "la", "del", "di", "da", "van", "von", "los", "las", "san"])

// Jugadores cargados como "Nombre Apellido" (el resto está "Apellido Nombre").
// Se matchea por display_name del jugador, exacto y sin distinguir mayúsculas.
// El arreglo real es corregir los datos de esos jugadores; hasta entonces, las
// nuevas excepciones se agregan en este mapa.
const SURNAME_EXCEPTIONS: Record<string, string> = {
  "silvio devicenzi": "Devicenzi",
  "victoria moreno": "Moreno",
  "andrea constanzo": "Constanzo",
  "diego cuenya": "Cuenya",
  "leandro castañares": "Castañares",
  "luciano castañares": "Castañares",
  "leonardo bodnar": "Bodnar",
  "carla novello": "Novello",
  "andrea monzon": "Monzon",
  "marcela manuel": "Manuel",
}

function clean(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}

// Apellido de un display_name "Apellido Nombre".
export function surnameOf(displayName: string): string {
  const name = clean(displayName)
  if (!name) return ""
  const exception = SURNAME_EXCEPTIONS[name.toLowerCase()]
  if (exception) return exception
  const words = name.split(" ")
  let end = 0
  // Une las partículas con la palabra siguiente, siempre que quede una palabra.
  while (end < words.length - 1 && SURNAME_PARTICLES.has(words[end].toLowerCase())) end++
  return words.slice(0, end + 1).join(" ")
}

export interface PairNameSource {
  displayName: string // display_name guardado del participante
  player1Name?: string | null // display_name del jugador 1 (si hay player_id)
  player2Name?: string | null
}

// "Apellido1 / Apellido2". Con los dos jugadores vinculados usa el display_name
// de cada uno; si no, parte el display_name del participante por "/" y muestra
// lo que haya, sin inventar nada.
export function pairDisplayName(source: PairNameSource): string {
  const p1 = source.player1Name ? clean(source.player1Name) : ""
  const p2 = source.player2Name ? clean(source.player2Name) : ""
  if (p1 && p2) return `${surnameOf(p1)} / ${surnameOf(p2)}`
  return source.displayName
    .split("/")
    .map(surnameOf)
    .filter(Boolean)
    .join(" / ")
}
