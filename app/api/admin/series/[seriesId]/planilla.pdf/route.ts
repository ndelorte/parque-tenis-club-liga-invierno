import { NextResponse } from "next/server"
import { generateMatchSheetPdf } from "@/lib/pdf/generateMatchSheetPdf"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params
  const supabase = await createClient()

  const { data: series } = await supabase
    .from("series")
    .select(
      `id, scheduled_date, scheduled_time,
      home_team:teams!series_home_team_id_fkey(id, name, captain_name,
        team_players(active, players(display_name))
      ),
      away_team:teams!series_away_team_id_fkey(id, name, captain_name,
        team_players(active, players(display_name))
      ),
      round:rounds(name),
      category:categories(name)`,
    )
    .eq("id", seriesId)
    .single()

  if (!series) {
    return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 })
  }

  const s = series as any

  const homePlayers = (s.home_team?.team_players ?? [])
    .filter((tp: any) => tp.active)
    .map((tp: any) => tp.players?.display_name ?? "")
    .filter(Boolean)

  const awayPlayers = (s.away_team?.team_players ?? [])
    .filter((tp: any) => tp.active)
    .map((tp: any) => tp.players?.display_name ?? "")
    .filter(Boolean)

  const pdfBuffer = await generateMatchSheetPdf({
    category: s.category?.name ?? "",
    round: s.round?.name ?? "",
    date: s.scheduled_date ?? "",
    time: s.scheduled_time ?? "",
    homeTeam: s.home_team?.name ?? "",
    awayTeam: s.away_team?.name ?? "",
    homePlayers,
    awayPlayers,
    homeCaptain: s.home_team?.captain_name,
    awayCaptain: s.away_team?.captain_name,
  })

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="planilla-${seriesId}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
