import { NextResponse } from "next/server"
import { generateMatchSheetPdf } from "@/lib/pdf/generateMatchSheetPdf"
import {
  mockSeriesCaballerosA,
  mockTeamPlayersCaballerosA,
  mockCategories,
} from "@/mock/data"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params

  // Look up series in mock data (all categories would be searched once Supabase is connected)
  const series = mockSeriesCaballerosA.find((s) => s.id === seriesId)

  if (!series) {
    return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 })
  }

  const category = mockCategories.find((c) => c.id === series.category_id)

  const homeTeamPlayers = mockTeamPlayersCaballerosA
    .filter((tp) => tp.team_id === series.home_team_id && tp.active && tp.player)
    .map((tp) => tp.player!.display_name)

  const awayTeamPlayers = mockTeamPlayersCaballerosA
    .filter((tp) => tp.team_id === series.away_team_id && tp.active && tp.player)
    .map((tp) => tp.player!.display_name)

  const pdfBuffer = await generateMatchSheetPdf({
    category: category?.name ?? "",
    round: series.round?.name ?? "",
    date: series.scheduled_date ?? "",
    time: series.scheduled_time ?? "",
    homeTeam: series.home_team?.name ?? "",
    awayTeam: series.away_team?.name ?? "",
    homePlayers: homeTeamPlayers,
    awayPlayers: awayTeamPlayers,
    homeCaptain: series.home_team?.captain_name,
    awayCaptain: series.away_team?.captain_name,
  })

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="planilla-${seriesId}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
