import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/auth/admin"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any

// Detecta la columna real probando un INSERT real (no SELECT — las tablas vacías dan falsos positivos)
async function findWorkingCol(sb: SB, table: string, requiredCols: Record<string, string>, candidates: string[]): Promise<string | null> {
  for (const col of candidates) {
    const row: Record<string, unknown> = { ...requiredCols, [col]: "__probe__" }
    const { error } = await sb.from(table).insert(row).select("id").single()
    if (!error) {
      // Probe insertó — borrarlo y retornar el col
      await sb.from(table).delete().match({ [col]: "__probe__" })
      return col
    }
    // Error de columna inexistente vs error de constraint — si NO es schema cache, el col existe pero hay otro problema
    if (!error.message?.includes("schema cache") && !error.message?.includes("Could not find")) {
      // El col existe, otro error (FK, etc.) — igual es válido
      return col
    }
  }
  return null
}

export async function POST() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const sb = createAdminClient() as SB
  const report: string[] = []

  // ── Obtener un group_id real para las pruebas ──
  const { data: anyGroup } = await sb.from("mid_master_groups").select("id, category_id").limit(1).single()
  if (!anyGroup) return NextResponse.json({ ok: false, error: "No hay grupos en la DB", report })

  // ── Detectar columna FK de grupo en participantes ──
  const pGroupCandidates = ["group_id", "zone_id", "group", "zone_group_id"]
  let pGroupCol: string | null = null
  for (const col of pGroupCandidates) {
    const { error } = await sb.from("mid_master_participants").insert({ [col]: anyGroup.id }).select("id").single()
    if (!error || (!error.message?.includes("schema cache") && !error.message?.includes("Could not find"))) {
      pGroupCol = col
      await sb.from("mid_master_participants").delete().eq(col, anyGroup.id)
      break
    }
  }
  if (!pGroupCol) {
    // Último intento: probamos solo group_id sin importar el error
    report.push("No se pudo auto-detectar columna de grupo en participantes. Intentando con 'group_id'...")
    pGroupCol = "group_id"
  }

  // ── Detectar columna de nombre en participantes ──
  // Para evitar FK issues, usamos un group real
  const pNameCandidates = ["display_name", "name", "full_name", "player_name", "participant_name", "nombre"]
  const pNameCol = await findWorkingCol(sb, "mid_master_participants", { [pGroupCol]: anyGroup.id }, pNameCandidates)
  if (!pNameCol) {
    return NextResponse.json({
      ok: false,
      error: `No se encontró columna de nombre en mid_master_participants. Probé: ${pNameCandidates.join(", ")}`,
      report,
    })
  }
  report.push(`✓ Participantes: grupo="${pGroupCol}", nombre="${pNameCol}"`)

  // ── Detectar columnas de matches ──
  const { data: anyCat } = await sb.from("mid_master_categories").select("id").limit(1).single()
  if (!anyCat) return NextResponse.json({ ok: false, error: "No hay categorías", report })

  // Columna de fase
  const mPhaseCandidates = ["phase", "stage", "round", "type", "match_type"]
  const mPhaseCol = await findWorkingCol(sb, "mid_master_matches",
    { category_id: anyCat.id },
    mPhaseCandidates
  )

  // Columna participant A
  const mPACandidates = ["participant_a_id", "player_a_id", "home_id", "participant_1_id"]
  const mPACol = mPACandidates[0] // Asumimos el más común y vemos si funciona

  // Columna grupo (nullable para knockout)
  const mGroupCandidates = ["group_id", "zone_id", "round_id", "group"]
  const mGroupCol = mGroupCandidates[0] // Asumimos y ajustamos si falla

  report.push(`✓ Partidos: fase="${mPhaseCol}", grupo="${mGroupCol}", partic_a="${mPACol}"`)

  // ── Limpiar datos anteriores ──
  await sb.from("mid_master_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await sb.from("mid_master_participants").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  report.push("Datos anteriores eliminados")

  // ── Seed ──
  const { data: categories } = await sb.from("mid_master_categories").select("id, name, group_size")
  if (!categories?.length) return NextResponse.json({ ok: false, error: "Sin categorías", report })

  let totalP = 0, totalM = 0, errs = 0

  for (const cat of categories) {
    const groupSize: number = cat.group_size ?? 4

    const { data: groups } = await sb.from("mid_master_groups")
      .select("id, name, display_order").eq("category_id", cat.id)
    if (!groups || groups.length < 2) { report.push(`${cat.name}: sin 2 grupos, skipped`); continue }

    const sorted = [...groups].sort((a: Record<string,unknown>, b: Record<string,unknown>) =>
      ((a.display_order as number) ?? 999) - ((b.display_order as number) ?? 999)
    )
    const grpA = sorted[0], grpB = sorted[1]

    const ids: Record<string, string[]> = { [grpA.id]: [], [grpB.id]: [] }

    // Insertar participantes
    for (const [grp, letter] of [[grpA, "A"], [grpB, "B"]] as const) {
      for (let i = 1; i <= groupSize; i++) {
        const row: Record<string, unknown> = {}
        row[pGroupCol] = grp.id
        row[pNameCol]  = `Participante ${letter}${i}`

        const { data, error } = await sb.from("mid_master_participants").insert(row).select("id").single()
        if (error) {
          report.push(`  ✗ ${cat.name} Participante ${letter}${i}: ${error.message.slice(0, 100)}`)
          errs++
        } else {
          ids[grp.id].push(data.id)
          totalP++
        }
      }
    }

    // Matches de zona (round-robin)
    for (const grp of [grpA, grpB]) {
      const pids = ids[grp.id]
      for (let i = 0; i < pids.length; i++) {
        for (let j = i + 1; j < pids.length; j++) {
          const row: Record<string, unknown> = {
            category_id: cat.id,
            [mPhaseCol ?? "phase"]: "group",
            [mPACol]: pids[i],
            participant_b_id: pids[j],
            status: "pending",
            score: null,
          }
          // Intentar con group_id primero; si falla, sin él
          row[mGroupCol] = grp.id

          const { error } = await sb.from("mid_master_matches").insert(row)
          if (error) {
            // Reintentar sin group_id si ese es el problema
            const row2 = { ...row }; delete row2[mGroupCol]
            const { error: e2 } = await sb.from("mid_master_matches").insert(row2)
            if (e2) { report.push(`  ✗ Match zona ${cat.name}: ${e2.message.slice(0,100)}`); errs++ }
            else totalM++
          } else totalM++
        }
      }
    }

    // Knockout (SF1, SF2, Final)
    const kos = [
      { phase: "semifinal", pA: null, pB: null },
      { phase: "semifinal", pA: null, pB: null },
      { phase: "final",     pA: null, pB: null },
    ]
    for (const ko of kos) {
      const row: Record<string, unknown> = {
        category_id: cat.id,
        [mPhaseCol ?? "phase"]: ko.phase,
        [mGroupCol]: null,
        status: "pending",
        score: null,
      }
      const { error } = await sb.from("mid_master_matches").insert(row)
      if (error) {
        const row2 = { ...row }; delete row2[mGroupCol]
        const { error: e2 } = await sb.from("mid_master_matches").insert(row2)
        if (e2) { report.push(`  ✗ KO ${ko.phase} ${cat.name}: ${e2.message.slice(0,100)}`); errs++ }
        else totalM++
      } else totalM++
    }

    report.push(`✓ ${cat.name}: ${ids[grpA.id].length + ids[grpB.id].length} participantes, ${totalM} partidos acum.`)
  }

  return NextResponse.json({
    ok: errs === 0,
    summary: { totalParticipants: totalP, totalMatches: totalM, errors: errs },
    report,
  })
}
