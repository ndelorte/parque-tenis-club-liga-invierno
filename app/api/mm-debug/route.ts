import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    const { data, error } = await sb.from(table).select("*").limit(2)
    results[table] = error
      ? { error: { code: error.code, message: error.message } }
      : { rows: data?.length ?? 0, sample: data?.[0] ?? null, columns: data?.[0] ? Object.keys(data[0]) : [] }
  }

  return NextResponse.json(results)
}
