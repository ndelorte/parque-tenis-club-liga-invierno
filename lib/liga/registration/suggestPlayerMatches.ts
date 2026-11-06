import { findSimilarPlayers, type NameMatch } from "@/lib/players/similarNames"
import { normalizeDni } from "./normalizeDni"

// Para validar una inscripción: dado un jugador anotado, propone con qué
// jugador ya cargado podría coincidir. Primero DNI (match exacto), después
// nombre (con el mismo matcher difuso que el resto del panel).

export interface RegistrationPlayerLike {
  firstName: string
  lastName: string
  dni: string
}

export interface KnownPlayer {
  id: string
  displayName: string
  // DNI guardado en player_private; null si todavía no se cargó.
  dni: string | null
}

export interface NameCandidate {
  player: KnownPlayer
  match: NameMatch
  // El candidato ya tiene un DNI guardado y es distinto del anotado:
  // probablemente sea otra persona (o el DNI está mal cargado).
  dniMismatch: boolean
}

export interface PlayerMatches {
  // "Apellido Nombre", el formato del sitio.
  displayName: string
  exact: KnownPlayer | null
  candidates: NameCandidate[]
}

export function toDisplayName(player: Pick<RegistrationPlayerLike, "firstName" | "lastName">): string {
  return `${player.lastName.trim()} ${player.firstName.trim()}`.replace(/\s+/g, " ")
}

export function suggestPlayerMatches(player: RegistrationPlayerLike, known: KnownPlayer[]): PlayerMatches {
  const dni = normalizeDni(player.dni)
  const displayName = toDisplayName(player)

  const exact = dni ? (known.find((k) => k.dni !== null && normalizeDni(k.dni) === dni) ?? null) : null
  if (exact) return { displayName, exact, candidates: [] }

  const candidates = findSimilarPlayers(known, displayName)
    .slice(0, 5)
    .map(({ player: p, match }) => ({
      player: p,
      match,
      dniMismatch: p.dni !== null && normalizeDni(p.dni) !== dni,
    }))

  return { displayName, exact: null, candidates }
}
