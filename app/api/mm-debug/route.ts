import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Ruta de diagnóstico temporal — eliminar antes de pasar a producción
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any
  const results: Record<string, unknown> = {}

  for (const table of [
    "mid_master_categories",
    "mid_master_groups",
    "mid_master_participants",
    "mid_master_matches",
  ]) {
    const { data, error } = await sb.from(table).select("*").limit(3)
    results[table] = error
      ? { error: { code: error.code, message: error.message, hint: error.hint } }
      : { rows: data?.length ?? 0, sample: data?.[0] ?? null }
  }

  return NextResponse.json(results)
}
