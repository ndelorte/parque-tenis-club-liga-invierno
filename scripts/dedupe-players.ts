/**
 * Detecta jugadores repetidos en la base ("Juan Pérez" / "Pérez Juan" / un
 * error de tipeo) y los unifica para que el ranking sume los puntos de cada
 * persona en una sola ficha.
 *
 * Uso:
 *   npm run dedupe:players                       → solo informe (no cambia nada)
 *   npm run dedupe:players -- --apply            → unifica los grupos "mismo nombre"
 *   npm run dedupe:players -- --merge KEEP_ID,DROP_ID[,DROP_ID...] [--name "Nombre Apellido"]
 *                                                → unifica a mano (los "parecidos" se revisan uno por uno)
 *
 * "Mismo nombre" = mismas palabras en cualquier orden / acentos / mayúsculas.
 * "Parecido" = casi iguales: NUNCA se unifican solos, puede ser otra persona.
 * La ficha sobrante queda desactivada (active = false), no se borra.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { clusterDuplicates } from "../lib/players/similarNames"
import { mergePlayers } from "../lib/players/mergePlayers"

async function usage(db: ReturnType<typeof createAdminClient>, id: string) {
  const [participants, ranking, teams] = await Promise.all([
    db.from("circuito_participants").select("id", { count: "exact", head: true }).or(`player_id.eq.${id},player_2_id.eq.${id}`),
    db.from("circuito_ranking_points").select("points").eq("player_id", id),
    db.from("team_players").select("id", { count: "exact", head: true }).eq("player_id", id),
  ])
  const points = (ranking.data ?? []).reduce((sum, r) => sum + (r.points as number), 0)
  return { participants: participants.count ?? 0, points, teams: teams.count ?? 0 }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const db = createAdminClient()

  if (typeof args["merge"] === "string") {
    const [keepId, ...dropIds] = (args["merge"] as string).split(",").map((s) => s.trim()).filter(Boolean)
    if (!keepId || dropIds.length === 0) throw new Error("Uso: --merge KEEP_ID,DROP_ID[,DROP_ID...]")
    const finalName = typeof args["name"] === "string" ? (args["name"] as string) : undefined
    for (const dropId of dropIds) {
      const summary = await mergePlayers(db, keepId, dropId, finalName)
      ok(`Unificado ${dropId} → ${keepId}: ${JSON.stringify(summary)}`)
    }
    return
  }

  const { data, error } = await db.from("players").select("id, display_name, created_at").eq("active", true)
  if (error || !data) throw new Error(`Error leyendo jugadores: ${error?.message}`)
  const players = data.map((p) => ({ id: p.id as string, displayName: p.display_name as string, createdAt: p.created_at as string }))

  const clusters = clusterDuplicates(players)
  if (clusters.length === 0) {
    ok("No hay jugadores repetidos.")
    return
  }

  const apply = args["apply"] === true
  let merged = 0
  log(`\n${clusters.length} grupo(s) de jugadores repetidos o parecidos (${players.length} jugadores en total)\n`)

  for (const cluster of clusters) {
    const withUsage = await Promise.all(cluster.players.map(async (p) => ({ ...p, ...(await usage(db, p.id)) })))
    // Se conserva la ficha con más historial (inscripciones, puntos, equipos); a igual, la más vieja.
    withUsage.sort(
      (a, b) =>
        b.participants + b.teams + (b.points > 0 ? 1 : 0) - (a.participants + a.teams + (a.points > 0 ? 1 : 0)) ||
        a.createdAt.localeCompare(b.createdAt),
    )
    const [keep, ...drops] = withUsage

    // Nombre con el que queda la ficha unificada. La convención del sitio es
    // "Apellido Nombre" (como están cargados los equipos de la Liga y como se
    // ven los cuadros); las fichas de la planilla/Challonge suelen venir como
    // "Nombre Apellido". Se usa el nombre de la ficha con más equipos de Liga;
    // si ninguna tiene equipos, el de la ficha creada más recientemente (es la
    // que se cargó a mano desde el panel, con la convención actual).
    const byTeams = [...withUsage].sort((a, b) => b.teams - a.teams)
    const newest = [...withUsage].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    const finalName = byTeams[0].teams > 0 ? byTeams[0].displayName : newest.displayName

    log(cluster.kind === "same" ? `• MISMO NOMBRE  → quedará como "${finalName}"` : "• PARECIDOS (revisar a mano)")
    for (const p of withUsage) {
      const mark = p === keep ? "conservar" : "sobra    "
      log(`    ${mark}  ${p.displayName.padEnd(32)} ${p.id}  inscripciones: ${p.participants}  puntos: ${p.points}  equipos: ${p.teams}`)
    }

    if (cluster.kind === "same") {
      if (apply) {
        for (const drop of drops) {
          await mergePlayers(db, keep.id, drop.id, finalName)
          merged++
        }
        ok("    unificado")
      }
    } else {
      warn(`    para unificar: npm run dedupe:players -- --merge ${keep.id},${drops.map((d) => d.id).join(",")}`)
    }
    log("")
  }

  if (!apply) log("Esto fue solo un informe. Para unificar los grupos de MISMO NOMBRE: npm run dedupe:players -- --apply\n")
  else ok(`Listo: ${merged} ficha(s) unificada(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
