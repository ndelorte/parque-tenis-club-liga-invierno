import type { SupabaseClient } from "@supabase/supabase-js"
import type { KnownPlayer } from "./suggestPlayerMatches"

// Jugadores activos con su DNI privado (si lo tienen), para validar altas.
// Solo server: usa el cliente con service role.
export async function fetchKnownPlayers(supabase: SupabaseClient): Promise<KnownPlayer[]> {
  // Supabase corta en 1000 filas por consulta: se pagina.
  const PAGE = 1000
  const players: Array<{ id: string; display_name: string }> = []
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("players")
      .select("id, display_name")
      .eq("active", true)
      .order("id")
      .range(from, from + PAGE - 1)
    const rows = (data ?? []) as Array<{ id: string; display_name: string }>
    players.push(...rows)
    if (rows.length < PAGE) break
  }
  const dniById = new Map<string, string>()
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase.from("player_private").select("player_id, dni").order("player_id").range(from, from + PAGE - 1)
    const rows = (data ?? []) as Array<{ player_id: string; dni: string }>
    rows.forEach((r) => dniById.set(r.player_id, r.dni))
    if (rows.length < PAGE) break
  }
  return players.map((p) => ({ id: p.id, displayName: p.display_name, dni: dniById.get(p.id) ?? null }))
}
