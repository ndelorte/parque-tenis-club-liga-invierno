import { createPublicClient } from "@/lib/supabase/public"
import { groupMedalsByTeam, type TeamMedalRow } from "@/lib/liga/medals/fromRows"
import type { MedalView } from "@/lib/liga/medals/types"

// Medallas de un conjunto de equipos en UNA consulta (por tandas, para no
// pasarse del largo de la URL): sirve para pintar un fixture entero sin
// pedir equipo por equipo. Devuelve un mapa teamId → medallas, de la más
// reciente a la más vieja. Los equipos sin medallas no aparecen.
const CHUNK = 100

export async function getMedalsForTeams(teamIds: readonly string[]): Promise<Record<string, MedalView[]>> {
  const ids = [...new Set(teamIds.filter(Boolean))]
  if (ids.length === 0) return {}

  const supabase = createPublicClient()
  const rows: TeamMedalRow[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await supabase
      .from("team_medals")
      .select("team_id, place, categories(name, slug, tournaments(slug, season))")
      .in("team_id", ids.slice(i, i + CHUNK))
    // Las medallas son decoración: si falla la lectura, la página sigue sin ellas.
    if (error || !data) continue
    rows.push(...(data as unknown as TeamMedalRow[]))
  }
  return groupMedalsByTeam(rows)
}
