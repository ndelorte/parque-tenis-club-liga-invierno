/**
 * Correcciones puntuales del ranking 2026 del Circuito antes del Final Master
 * (auditoría del ranking: fichas repetidas, puntos duplicados, placeholders).
 *
 * Los puntos históricos de enero-mayo vienen de la planilla y se CONSERVAN aunque
 * difieran del cuadro: por eso estas correcciones son escrituras puntuales y NO
 * se recalculan categorías de las ediciones 01-08 (salvo el caso 5, que es una
 * categoría de panel).
 *
 * Casos (en este orden):
 *   1. Borrar los puntos de Argentina Open / damas-primera-dobles (16 filas de la
 *      planilla; el mismo torneo ya está en damas-segunda-dobles).
 *   2. Unificar fichas: Hernandez → Hernandez Sebastian, Sabrina → Mendl Sabrina,
 *      Martica → Gimenez Maria Martha, Silvana → Castellano Silvana.
 *   3. Compa Silvana y Silvana2: borrar sus puntos y desactivar las fichas.
 *   4. Australia Open / damas-primera-dobles: Rebollo Prats Guadalupe pasa a ser
 *      la compañera de Sacchi Carolina (puntos ya guardados, se conservan).
 *   5. US Open / damas-segunda-dobles: Belozo Marcela queda con 1300 (recalcula la
 *      categoría si el único cambio es ese; si no, upsert puntual).
 *   6. Roland Garros / caballeros-mas50-single: Marzari Dino de 1000 a 1300.
 *
 * Idempotente: lo ya aplicado se informa y se saltea. Un caso que no coincide
 * con lo esperado (nombre distinto, datos inesperados) ABORTA ese caso, no toca
 * nada de él y lo informa.
 *
 * Uso:
 *   npm run fix:ranking-master             → simulación (no escribe nada)
 *   npm run fix:ranking-master -- --apply  → aplica
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient, type AdminClient } from "./lib/db"
import { parseArgs, log, ok, warn, err } from "./lib/utils"
import { mergePlayers } from "../lib/players/mergePlayers"
import {
  computeCircuitRankingForCategory,
  deleteCircuitoRankingPointsRows,
  recalculateAndPersistCircuitRanking,
  upsertCircuitoRankingPoints,
} from "../lib/data/circuito/ranking"

type Status = "aplicado" | "ya-estaba" | "abortado"

interface Ctx {
  db: AdminClient
  apply: boolean
  // En simulación: filas de puntos que el caso 1 borraría (para que el caso 2
  // las vea ya borradas, como pasa al aplicar).
  simDeleted: Set<string>
  names: Map<string, string>
}

interface PointsRow {
  id: string
  player_id: string
  category_id: string
  edition_id: string
  points: number
}

const PLAYERS = {
  hernandez: { id: "8877fb1b-f24e-4d6d-a1c8-2565d26efc2a", name: "Hernandez" },
  hernandezSebastian: { id: "6c5a737f-be8e-4dd3-ba17-8bfa2f8bb729", name: "Hernandez Sebastian" },
  sabrina: { id: "d2ce2535-b8d9-4c07-a7c8-47db5b93a164", name: "Sabrina" },
  mendlSabrina: { id: "036ebb1f-863d-4b4b-8410-836e94a8b035", name: "Mendl Sabrina" },
  martica: { id: "d45af200-2092-477c-af49-c5d31e04b105", name: "Martica" },
  gimenezMaria: { id: "08a32dc7-0440-46cd-856c-b17442ec5652", name: "Gimenez Maria Martha" },
  silvana: { id: "92eb93ea-9792-4fbf-bf59-0bc99310ea00", name: "Silvana" },
  castellanoSilvana: { id: "564b4a4f-615f-4748-90ec-dfc1b9d3aba2", name: "Castellano Silvana" },
  compaSilvana: { id: "3f9a64c3-3e60-4e03-b76a-4486730400d0", name: "Compa Silvana" },
  silvana2: { id: "bc730846-2fa6-4878-aab5-29cc2cb044ac", name: "Silvana2" },
  rebollo: { id: "24e009d8-849a-467f-8222-87b1f77e886f", name: "Rebollo Prats Guadalupe" },
  sacchi: { id: "37379bb0-5046-44e0-bc5d-cbb1f4b1d08c", name: "Sacchi Carolina" },
} as const
type Expected = { id: string; name: string }

// ---------------------------------------------------------------- lecturas

async function readPlayer(ctx: Ctx, expected: Expected): Promise<{ id: string; display_name: string; active: boolean } | string> {
  const { data, error } = await ctx.db.from("players").select("id, display_name, active").eq("id", expected.id)
  if (error) return `error leyendo ${expected.name}: ${error.message}`
  if (!data || data.length === 0) return `no existe la ficha ${expected.name} (${expected.id})`
  if (data.length > 1) return `id ambiguo para ${expected.name}`
  if (data[0].display_name !== expected.name)
    return `la ficha ${expected.id} se llama "${data[0].display_name}", se esperaba "${expected.name}"`
  ctx.names.set(expected.id, expected.name)
  return data[0] as { id: string; display_name: string; active: boolean }
}

async function readPointsRows(ctx: Ctx, filter: { playerId?: string; categoryId?: string }): Promise<PointsRow[]> {
  let query = ctx.db.from("circuito_ranking_points").select("id, player_id, category_id, edition_id, points")
  if (filter.playerId) query = query.eq("player_id", filter.playerId)
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId)
  const { data, error } = await query
  if (error) throw new Error(`Leyendo puntos: ${error.message}`)
  return ((data ?? []) as PointsRow[]).filter((r) => !ctx.simDeleted.has(r.id))
}

async function findCategory(ctx: Ctx, editionSlug: string, slug: string): Promise<{ id: string; edition_id: string; label: string } | string> {
  const { data: edition } = await ctx.db.from("circuito_editions").select("id, name").eq("slug", editionSlug)
  if (!edition || edition.length !== 1) return `edición ${editionSlug}: ${edition?.length ?? 0} resultado(s)`
  const { data: cats } = await ctx.db.from("circuito_categories").select("id, edition_id").eq("edition_id", edition[0].id).eq("slug", slug)
  if (!cats || cats.length !== 1) return `categoría ${editionSlug}/${slug}: ${cats?.length ?? 0} resultado(s)`
  return { id: cats[0].id, edition_id: cats[0].edition_id, label: `${edition[0].name} (${editionSlug}) / ${slug}` }
}

async function countRefs(ctx: Ctx, categoryId: string) {
  const [participants, matches] = await Promise.all([
    ctx.db.from("circuito_participants").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
    ctx.db.from("circuito_matches").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
  ])
  return { participants: participants.count ?? 0, matches: matches.count ?? 0 }
}

async function playerUsage(ctx: Ctx, playerId: string) {
  const [participants, teams, courts] = await Promise.all([
    ctx.db.from("circuito_participants").select("id, category_id, display_name, player_id, player_2_id").or(`player_id.eq.${playerId},player_2_id.eq.${playerId}`),
    ctx.db.from("team_players").select("id", { count: "exact", head: true }).eq("player_id", playerId),
    ctx.db
      .from("court_matches")
      .select("id", { count: "exact", head: true })
      .or(`home_player_1_id.eq.${playerId},home_player_2_id.eq.${playerId},away_player_1_id.eq.${playerId},away_player_2_id.eq.${playerId}`),
  ])
  return { participants: participants.data ?? [], teamPlayers: teams.count ?? 0, courtMatches: courts.count ?? 0 }
}

async function categoryLabels(ctx: Ctx): Promise<Map<string, string>> {
  const { data } = await ctx.db.from("circuito_categories").select("id, slug, circuito_editions(slug)")
  return new Map(
    (data ?? []).map((c) => {
      const ed = c.circuito_editions as unknown as { slug: string } | null
      return [c.id as string, `${ed?.slug ?? "?"}/${c.slug}`]
    }),
  )
}

const pad = (s: string, n = 30) => s.padEnd(n)

// ------------------------------------------------------------------ casos

async function caso1(ctx: Ctx): Promise<Status> {
  log("\n[1] Argentina Open / damas-primera-dobles: borrar puntos duplicados de la planilla")
  const cat = await findCategory(ctx, "circuito-2026-02", "damas-primera-dobles")
  if (typeof cat === "string") return abort(cat)
  const refs = await countRefs(ctx, cat.id)
  if (refs.participants > 0 || refs.matches > 0)
    return abort(`la categoría tiene ${refs.participants} participante(s) y ${refs.matches} partido(s): no es solo planilla, no se toca`)

  const rows = await readPointsRows(ctx, { categoryId: cat.id })
  const { data: players } = await ctx.db.from("players").select("id, display_name").in("id", rows.map((r) => r.player_id))
  const nameOf = new Map((players ?? []).map((p) => [p.id as string, p.display_name as string]))
  log(`  antes: ${rows.length} fila(s) de puntos en ${cat.label}`)
  rows
    .sort((a, b) => b.points - a.points)
    .forEach((r) => log(`    ${pad(nameOf.get(r.player_id) ?? r.player_id)} ${String(r.points).padStart(5)}`))
  if (rows.length === 0) {
    ok("ya estaba aplicado (la categoría no tiene filas de puntos)")
    return "ya-estaba"
  }
  if (rows.length !== 16) return abort(`se esperaban 16 filas y hay ${rows.length}: no se toca`)

  if (ctx.apply) {
    const deleted = await deleteCircuitoRankingPointsRows(rows.map((r) => r.id))
    const left = await readPointsRows({ ...ctx, simDeleted: new Set() }, { categoryId: cat.id })
    ok(`después: ${deleted} borrada(s), quedan ${left.length} fila(s)`)
  } else {
    rows.forEach((r) => ctx.simDeleted.add(r.id))
    ok("después (simulado): 0 filas de puntos en la categoría")
  }
  return "aplicado"
}

async function mergeCase(ctx: Ctx, title: string, drop: Expected, keep: Expected): Promise<Status> {
  log(`\n${title}`)
  const [dropP, keepP] = [await readPlayer(ctx, drop), await readPlayer(ctx, keep)]
  if (typeof dropP === "string") return abort(dropP)
  if (typeof keepP === "string") return abort(keepP)
  if (!keepP.active) return abort(`la ficha a conservar "${keep.name}" está inactiva`)

  const labels = await categoryLabels(ctx)
  const [dropRows, keepRows] = [await readPointsRows(ctx, { playerId: drop.id }), await readPointsRows(ctx, { playerId: keep.id })]
  const usage = await playerUsage(ctx, drop.id)
  const describePoints = (rows: PointsRow[]) => (rows.length ? rows.map((r) => `${labels.get(r.category_id)}=${r.points}`).join(", ") : "sin puntos")
  log(`  antes: sobra  "${drop.name}" (${dropP.active ? "activa" : "inactiva"}): ${describePoints(dropRows)}; inscripciones: ${usage.participants.length}; equipos Liga: ${usage.teamPlayers}; canchas Liga: ${usage.courtMatches}`)
  log(`         queda  "${keep.name}": ${describePoints(keepRows)}`)

  if (!dropP.active && dropRows.length === 0 && usage.participants.length === 0 && usage.teamPlayers === 0 && usage.courtMatches === 0) {
    ok("ya estaba aplicado (ficha desactivada y sin nada asociado)")
    return "ya-estaba"
  }

  // Resultado esperado de los puntos: se mueve cada fila; si keep ya tiene fila
  // en el mismo (categoría, edición) queda el mayor y la de drop se descarta.
  const resulting = keepRows.map((r) => ({ ...r }))
  for (const row of dropRows) {
    const existing = resulting.find((k) => k.category_id === row.category_id && k.edition_id === row.edition_id)
    if (existing) existing.points = Math.max(existing.points, row.points)
    else resulting.push({ ...row, player_id: keep.id })
  }

  if (ctx.apply) {
    const summary = await mergePlayers(ctx.db, keep.id, drop.id)
    const after = await readPointsRows({ ...ctx, simDeleted: new Set() }, { playerId: keep.id })
    const afterUsage = await playerUsage(ctx, drop.id)
    ok(`unificado: ${JSON.stringify(summary)}`)
    log(`  después: "${keep.name}": ${describePoints(after)}; a "${drop.name}" le quedan ${afterUsage.participants.length} inscripción(es), ${(await readPointsRows({ ...ctx, simDeleted: new Set() }, { playerId: drop.id })).length} fila(s) de puntos; ficha desactivada`)
  } else {
    log(`  después (simulado): "${keep.name}": ${describePoints(resulting)}; "${drop.name}" desactivada, ${usage.participants.length} inscripción(es) pasan a "${keep.name}"`)
    for (const p of usage.participants) log(`      inscripción ${labels.get(p.category_id)}: "${p.display_name}"`)
  }
  return "aplicado"
}

async function caso3(ctx: Ctx, target: Expected): Promise<Status> {
  log(`\n[3] Placeholder "${target.name}": borrar puntos y desactivar la ficha`)
  const player = await readPlayer(ctx, target)
  if (typeof player === "string") return abort(player)
  const usage = await playerUsage(ctx, target.id)
  if (usage.participants.length > 0) {
    const labels = await categoryLabels(ctx)
    return abort(`figura como participante en: ${usage.participants.map((p) => `${labels.get(p.category_id)} "${p.display_name}"`).join("; ")}`)
  }
  const labels = await categoryLabels(ctx)
  const rows = await readPointsRows(ctx, { playerId: target.id })
  log(`  antes: ${player.active ? "activa" : "inactiva"}; puntos: ${rows.length ? rows.map((r) => `${labels.get(r.category_id)}=${r.points}`).join(", ") : "ninguno"}; equipos Liga: ${usage.teamPlayers}`)
  if (rows.length === 0 && !player.active) {
    ok("ya estaba aplicado")
    return "ya-estaba"
  }
  if (ctx.apply) {
    const deleted = await deleteCircuitoRankingPointsRows(rows.map((r) => r.id))
    const { error } = await ctx.db.from("players").update({ active: false }).eq("id", target.id)
    if (error) throw new Error(`Desactivando ${target.name}: ${error.message}`)
    ok(`después: ${deleted} fila(s) de puntos borrada(s); ficha desactivada (active=false)`)
  } else {
    ok("después (simulado): sin puntos; ficha desactivada (active=false)")
  }
  return "aplicado"
}

async function caso4(ctx: Ctx): Promise<Status> {
  log('\n[4] Australia Open / damas-primera-dobles: Rebollo Prats Guadalupe como compañera de Sacchi Carolina')
  const [sacchi, rebollo] = [await readPlayer(ctx, PLAYERS.sacchi), await readPlayer(ctx, PLAYERS.rebollo)]
  if (typeof sacchi === "string") return abort(sacchi)
  if (typeof rebollo === "string") return abort(rebollo)
  const cat = await findCategory(ctx, "circuito-2026-01", "damas-primera-dobles")
  if (typeof cat === "string") return abort(cat)

  const { data: parts, error } = await ctx.db
    .from("circuito_participants")
    .select("id, display_name, player_id, player_2_id")
    .eq("category_id", cat.id)
    .or(`player_id.eq.${sacchi.id},player_2_id.eq.${sacchi.id}`)
  if (error) throw new Error(error.message)
  if (!parts || parts.length !== 1) return abort(`se esperaba 1 participante con Sacchi Carolina y hay ${parts?.length ?? 0}`)
  const part = parts[0]
  const { data: rebolloIn } = await ctx.db
    .from("circuito_participants")
    .select("id")
    .eq("category_id", cat.id)
    .or(`player_id.eq.${rebollo.id},player_2_id.eq.${rebollo.id}`)
  const rows = await readPointsRows(ctx, { categoryId: cat.id })
  const pts = (id: string) => rows.find((r) => r.player_id === id)?.points ?? 0
  const newName = `${sacchi.display_name} / ${rebollo.display_name}`
  log(`  antes: participante "${part.display_name}" player_1=${part.player_id === sacchi.id ? "Sacchi" : "?"} player_2=${part.player_2_id ?? "(vacío)"}; puntos Sacchi=${pts(sacchi.id)} Rebollo=${pts(rebollo.id)}`)

  if (part.player_2_id === rebollo.id) {
    ok("ya estaba aplicado")
    return "ya-estaba"
  }
  if (part.player_id !== sacchi.id || part.player_2_id) return abort("el participante de Sacchi no tiene player_2 vacío (o Sacchi no es player_1)")
  if (rebolloIn && rebolloIn.length > 0) return abort("Rebollo ya figura en otro participante de la categoría")

  if (ctx.apply) {
    const { error: upErr } = await ctx.db.from("circuito_participants").update({ player_2_id: rebollo.id, display_name: newName }).eq("id", part.id)
    if (upErr) throw new Error(upErr.message)
    const { data: after } = await ctx.db.from("circuito_participants").select("display_name, player_id, player_2_id").eq("id", part.id).single()
    ok(`después: participante "${after?.display_name}" (player_2 = Rebollo); puntos conservados Sacchi=${pts(sacchi.id)} Rebollo=${pts(rebollo.id)}`)
  } else {
    ok(`después (simulado): participante "${newName}" (player_2 = Rebollo); puntos conservados Sacchi=${pts(sacchi.id)} Rebollo=${pts(rebollo.id)}; sin recalcular la categoría`)
  }
  return "aplicado"
}

async function caso5(ctx: Ctx): Promise<Status> {
  log("\n[5] US Open / damas-segunda-dobles: Belozo Marcela debe quedar con 1300")
  const cat = await findCategory(ctx, "circuito-2026-09", "damas-segunda-dobles")
  if (typeof cat === "string") return abort(cat)

  const { data: belozoPlayers } = await ctx.db.from("players").select("id, display_name").ilike("display_name", "%belozo%")
  const stored = await readPointsRows(ctx, { categoryId: cat.id })
  const belozo = (belozoPlayers ?? []).filter((p) => stored.some((r) => r.player_id === p.id))
  if (belozo.length !== 1) return abort(`se esperaba 1 jugadora Belozo con puntos en la categoría y hay ${belozo.length}`)
  if (belozo[0].display_name !== "Belozo Marcela") return abort(`la ficha se llama "${belozo[0].display_name}", se esperaba "Belozo Marcela"`)
  const belozoId = belozo[0].id

  const snapshot = await computeCircuitRankingForCategory(cat.id)
  if (!snapshot) return abort("no se pudo calcular la categoría (sin cuadro o sin participantes)")
  const { data: allPlayers } = await ctx.db.from("players").select("id, display_name").in("id", [...new Set([...stored.map((r) => r.player_id), ...snapshot.pointsByPlayer.keys()])])
  const nameOf = new Map((allPlayers ?? []).map((p) => [p.id as string, p.display_name as string]))
  const before = new Map(stored.map((r) => [r.player_id, r.points]))

  const diffs: Array<{ playerId: string; before: number; after: number }> = []
  for (const id of new Set([...before.keys(), ...snapshot.pointsByPlayer.keys()])) {
    const b = before.get(id) ?? 0
    const a = snapshot.pointsByPlayer.get(id) ?? 0
    if (a !== b) diffs.push({ playerId: id, before: b, after: a })
  }
  log(`  antes: Belozo Marcela=${before.get(belozoId) ?? 0}; la categoría tiene ${stored.length} fila(s) de puntos`)
  log(`  recálculo de la categoría (en memoria): ${diffs.length} cambio(s)`)
  diffs.forEach((d) => log(`    ${pad(nameOf.get(d.playerId) ?? d.playerId)} ${String(d.before).padStart(5)} → ${String(d.after).padStart(5)}`))

  if (diffs.length === 0 && (before.get(belozoId) ?? 0) === 1300) {
    ok("ya estaba aplicado")
    return "ya-estaba"
  }
  const onlyBelozo = diffs.length === 1 && diffs[0].playerId === belozoId && diffs[0].before === 100 && diffs[0].after === 1300
  if (onlyBelozo) log("  el único cambio es Belozo 100 → 1300: se recalcula la categoría")
  else warn("el recálculo cambia algo más que Belozo 100 → 1300: NO se recalcula, se hace un upsert puntual de Belozo = 1300")

  if (ctx.apply) {
    if (onlyBelozo) await recalculateAndPersistCircuitRanking(cat.id)
    else await upsertCircuitoRankingPoints([{ playerId: belozoId, categoryId: cat.id, editionId: cat.edition_id, points: 1300 }])
    const after = await readPointsRows({ ...ctx, simDeleted: new Set() }, { categoryId: cat.id })
    ok(`después: Belozo Marcela=${after.find((r) => r.player_id === belozoId)?.points}; ${after.length} fila(s) en la categoría`)
  } else {
    ok(`después (simulado): Belozo Marcela=1300 (${onlyBelozo ? "recálculo de la categoría" : "upsert puntual"})`)
  }
  return "aplicado"
}

async function caso6(ctx: Ctx): Promise<Status> {
  log("\n[6] Roland Garros / caballeros-mas50-single: Marzari Dino 1000 → 1300")
  const cat = await findCategory(ctx, "circuito-2026-05", "caballeros-mas50-single")
  if (typeof cat === "string") return abort(cat)
  const rows = await readPointsRows(ctx, { categoryId: cat.id })
  const { data: players } = await ctx.db.from("players").select("id, display_name").in("id", rows.map((r) => r.player_id))
  const marzari = (players ?? []).filter((p) => p.display_name === "Marzari Dino")
  if (marzari.length !== 1) return abort(`se esperaba 1 "Marzari Dino" con puntos en la categoría y hay ${marzari.length}`)
  const row = rows.find((r) => r.player_id === marzari[0].id)!
  log(`  antes: Marzari Dino=${row.points}`)
  if (row.points === 1300) {
    ok("ya estaba aplicado")
    return "ya-estaba"
  }
  if (row.points !== 1000) return abort(`tiene ${row.points} puntos (se esperaban 1000): no se toca`)
  if (ctx.apply) {
    await upsertCircuitoRankingPoints([{ playerId: marzari[0].id, categoryId: cat.id, editionId: cat.edition_id, points: 1300 }])
    const after = await readPointsRows({ ...ctx, simDeleted: new Set() }, { categoryId: cat.id })
    ok(`después: Marzari Dino=${after.find((r) => r.player_id === marzari[0].id)?.points}`)
  } else {
    ok("después (simulado): Marzari Dino=1300 (upsert puntual, sin recalcular la categoría)")
  }
  return "aplicado"
}

// -------------------------------------------------------------------- main

function abort(reason: string): Status {
  err(`ABORTADO: ${reason}`)
  return "abortado"
}

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const ctx: Ctx = { db: createAdminClient(), apply, simDeleted: new Set(), names: new Map() }
  log(apply ? "== APLICANDO correcciones del ranking 2026 ==" : "== SIMULACIÓN (no escribe nada; usar --apply para aplicar) ==")

  const results: Array<[string, Status]> = []
  const run = async (label: string, fn: () => Promise<Status>) => {
    try {
      results.push([label, await fn()])
    } catch (e) {
      err(`ERROR en ${label}: ${e instanceof Error ? e.message : String(e)}`)
      results.push([label, "abortado"])
    }
  }

  await run("1 borrar duplicado Feb Primera", () => caso1(ctx))
  const case1Ok = results[0][1] !== "abortado"
  const P = PLAYERS
  await run("2a Hernandez", () => mergeCase(ctx, "[2a] Unificar Hernandez → Hernandez Sebastian", P.hernandez, P.hernandezSebastian))
  await run("2b Sabrina", () => mergeCase(ctx, "[2b] Unificar Sabrina → Mendl Sabrina", P.sabrina, P.mendlSabrina))
  if (case1Ok) await run("2c Martica", () => mergeCase(ctx, "[2c] Unificar Martica → Gimenez Maria Martha", P.martica, P.gimenezMaria))
  else {
    log("\n[2c] Unificar Martica → Gimenez Maria Martha")
    warn("se saltea: depende de que el caso 1 esté aplicado (Martica tiene su fila en Feb Primera)")
    results.push(["2c Martica", "abortado"])
  }
  await run("2d Silvana", () => mergeCase(ctx, "[2d] Unificar Silvana → Castellano Silvana", P.silvana, P.castellanoSilvana))
  await run("3a Compa Silvana", () => caso3(ctx, P.compaSilvana))
  await run("3b Silvana2", () => caso3(ctx, P.silvana2))
  await run("4 Rebollo/Sacchi", () => caso4(ctx))
  await run("5 Belozo", () => caso5(ctx))
  await run("6 Marzari", () => caso6(ctx))

  log("\n== Resumen ==")
  for (const [label, status] of results) log(`  ${pad(label, 28)} ${status}`)
  if (results.some(([, s]) => s === "abortado")) {
    err("Hay casos abortados: revisarlos antes de seguir.")
    process.exitCode = 1
  }
  if (!apply) log("\nSimulación terminada. Para aplicar: npm run fix:ranking-master -- --apply")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
