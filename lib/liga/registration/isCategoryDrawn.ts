import type { SupabaseClient } from "@supabase/supabase-js"
import { roundsHaveSeries } from "@/lib/liga/editionStage"

// "Cuadro sorteado" = la categoría tiene series cargadas (mismo criterio que
// editionStage). Solo server.
export async function isCategoryDrawn(supabase: SupabaseClient, categoryId: string): Promise<boolean> {
  const { data } = await supabase.from("rounds").select("id, series(id)").eq("category_id", categoryId)
  const rounds = ((data ?? []) as Array<{ series: unknown[] | null }>).map((r) => ({ series: r.series ?? [] }))
  return roundsHaveSeries(rounds)
}

export const DRAWN_WARNING = "El cuadro ya está sorteado: revisá que el reglamento lo permita"
export const DRAWN_CATEGORY_BLOCK = "El cuadro ya está sorteado: no se puede cambiar de categoría."
