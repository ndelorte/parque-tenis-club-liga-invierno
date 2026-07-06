import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any
  const results: Record<string, unknown> = {}

  // Datos de cada tabla
  for (const table of [
    "mid_master_categories",
    "mid_master_groups",
    "mid_master_participants",
    "mid_master_matches",
  ]) {
    const { data, error } = await sb.from(table).select("*").limit(2)
    results[table] = error
      ? { error: { code: error.code, message: error.message } }
      : { rows: data?.length ?? 0, sample: data?.[0] ?? null }
  }

  // Columnas de cada tabla via information_schema
  const tables = ["mid_master_participants", "mid_master_matches"]
  const columns: Record<string, string[]> = {}
  for (const t of tables) {
    const { data } = await sb
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", t)
      .order("ordinal_position")
    columns[t] = (data ?? []).map((r: { column_name: string }) => r.column_name)
  }

  return NextResponse.json({ tables: results, columns })
}
