import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/auth/admin"

// Detecta si una columna existe intentando SELECT en tabla vacía
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hasCol(sb: any, table: string, col: string): Promise<boolean> {
  const { error } = await sb.from(table).select(col).limit(0)
  return !error
}

export async function POST() {
  // ── Auth: solo admins ──
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminClient() as any
  const report: string[] = []

  // ── Detectar esquema real de participantes ──
  const [pHasDisplayName, pHasName, pHasGroupId, pHasZoneId] = await Promise.all([
    hasCol(sb, "mid_master_participants", "display_name"),
    hasCol(sb, "mid_master_participants", "name"),
    hasCol(sb, "mid_master_participants", "group_id"),
    hasCol(sb, "mid_master_participants", "zone_id"),
  ])
  const pNameCol  = pHasDisplayName ? "display_name" : pHasName ? "name" : "display_name"
  const pGroupCol = pHasGroupId ? "group_id" : pHasZoneId ? "zone_id" : "group_id"
  report.push(`Participantes: nombre="${pNameCol}", grupo="${pGroupCol}"`)

  // ── Detectar esquema real de partidos ──
  const [
    mHasGroupId, mHasZoneId,
    mHasPhase, mHasStage,
    mHasParticipantAId, mHasPlayerAId,
    mHasParticipantALabel,
    mHasStatus, mHasSetsA, mHasScore,
  ] = await Promise.all([
    hasCol(sb, "mid_master_matches", "group_id"),
    hasCol(sb, "mid_master_matches", "zone_id"),
    hasCol(sb, "mid_master_matches", "phase"),
    hasCol(sb, "mid_master_matches", "stage"),
    hasCol(sb, "mid_master_matches", "participant_a_id"),
    hasCol(sb, "mid_master_matches", "player_a_id"),
    hasCol(sb, "mid_master_matches", "participant_a_label"),
    hasCol(sb, "mid_master_matches", "status"),
    hasCol(sb, "mid_master_matches", "sets_a"),
    hasCol(sb, "mid_master_matches", "score"),
  ])

  const mGroupCol  = mHasGroupId ? "group_id" : mHasZoneId ? "zone_id" : "group_id"
  const mPhaseCol  = mHasPhase ? "phase" : mHasStage ? "stage" : "phase"
  const mPACol     = mHasParticipantAId ? "participant_a_id" : mHasPlayerAId ? "player_a_id" : "participant_a_id"
  const mPBCol     = mHasParticipantAId ? "participant_b_id" : mHasPlayerAId ? "player_b_id" : "participant_b_id"
  report.push(`Partidos: grupo="${mGroupCol}", fase="${mPhaseCol}", partic="${mPACol}"`)
  report.push(`Partidos opcionales: label=${mHasParticipantALabel}, status=${mHasStatus}, sets=${mHasSetsA}, score=${mHasScore}`)

  // ── Limpiar datos anteriores ──
  await sb.from("mid_master_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await sb.from("mid_master_participants").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  report.push("Datos anteriores eliminados")

  // ── Cargar categorías y grupos ──
  const { data: categories, error: catErr } = await sb
    .from("mid_master_categories")
    .select("id, name, slug, group_size")
  if (catErr || !categories?.length) {
    return NextResponse.json({ ok: false, error: catErr?.message ?? "Sin categorías", report })
  }

  let totalParticipants = 0
  let totalMatches = 0
  let errors = 0

  for (const cat of categories) {
    const groupSize: number = cat.group_size ?? 4

    const { data: groups } = await sb
      .from("mid_master_groups")
      .select("id, name, display_order")
      .eq("category_id", cat.id)

    if (!groups?.length) { report.push(`${cat.name}: sin grupos, skipped`); continue }

    const sorted = [...groups].sort((a: { display_order?: number; name: string }, b: { display_order?: number; name: string }) =>
      (a.display_order ?? 999) - (b.display_order ?? 999) || a.name.localeCompare(b.name)
    )
    const groupA = sorted[0]
    const groupB = sorted[1]
    if (!groupB) { report.push(`${cat.name}: solo un grupo, skipped`); continue }

    // ── Insertar participantes ──
    const participantIds: Record<string, string[]> = { [groupA.id]: [], [groupB.id]: [] }

    for (const [grp, letter] of [[groupA, "A"], [groupB, "B"]] as const) {
      for (let i = 1; i <= groupSize; i++) {
        const row: Record<string, unknown> = {}
        row[pGroupCol] = grp.id
        row[pNameCol]  = `Participante ${letter}${i}`

        const { data, error } = await sb
          .from("mid_master_participants")
          .insert(row)
          .select("id")
          .single()

        if (error) {
          report.push(`  ERROR participante ${letter}${i} (${cat.name}): ${error.message}`)
          errors++
        } else {
          participantIds[grp.id].push(data.id)
          totalParticipants++
        }
      }
    }

    // ── Crear partidos round-robin por zona ──
    for (const grp of [groupA, groupB]) {
      const ids = participantIds[grp.id]

      const pairs: [string, string][] = []
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          pairs.push([ids[i], ids[j]])
        }
      }

      for (const [aId, bId] of pairs) {
        const row: Record<string, unknown> = {
          category_id: cat.id,
          [mGroupCol]: grp.id,
          [mPhaseCol]: "group",
          [mPACol]: aId,
          [mPBCol]: bId,
        }
        if (mHasStatus) row.status = "pending"
        if (mHasSetsA)  { row.sets_a = 0; row.sets_b = 0; row.games_a = 0; row.games_b = 0 }
        if (mHasScore)  row.score = null
        if (mHasParticipantALabel) { row.participant_a_label = ""; row.participant_b_label = "" }

        const { error } = await sb.from("mid_master_matches").insert(row)
        if (error) { report.push(`  ERROR partido zona (${cat.name}): ${error.message}`); errors++ }
        else totalMatches++
      }
    }

    // ── Crear partidos de cuadro final ──
    const knockoutDefs = [
      { phase: "semifinal", labelA: "1° Zona A", labelB: "2° Zona B" },
      { phase: "semifinal", labelA: "1° Zona B", labelB: "2° Zona A" },
      { phase: "final",     labelA: "Ganador SF 1", labelB: "Ganador SF 2" },
    ]

    for (const ko of knockoutDefs) {
      const row: Record<string, unknown> = {
        category_id: cat.id,
        [mGroupCol]: null,
        [mPhaseCol]: ko.phase,
      }
      if (mHasStatus)           row.status = "pending"
      if (mHasSetsA)            { row.sets_a = 0; row.sets_b = 0; row.games_a = 0; row.games_b = 0 }
      if (mHasScore)            row.score = null
      if (mHasParticipantALabel) { row.participant_a_label = ko.labelA; row.participant_b_label = ko.labelB }

      const { error } = await sb.from("mid_master_matches").insert(row)
      if (error) { report.push(`  ERROR knockout ${ko.phase} (${cat.name}): ${error.message}`); errors++ }
      else totalMatches++
    }

    report.push(`${cat.name}: ${participantIds[groupA.id].length + participantIds[groupB.id].length} participantes, ${(participantIds[groupA.id].length + participantIds[groupB.id].length > 0) ? "fixture cargado" : "sin fixture"}`)
  }

  return NextResponse.json({
    ok: errors === 0,
    summary: { totalParticipants, totalMatches, errors },
    report,
  })
}
