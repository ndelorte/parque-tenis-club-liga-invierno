/**
 * Diagnóstico de SOLO LECTURA de los cuadros del Circuito del Parque.
 *
 * Recorre TODAS las ediciones (circuito_editions) y, por cada categoría con
 * draw_size cargado, arma el árbol de su cuadro principal (y repechaje, si
 * existe) igual que lo hace la página pública
 * (app/circuito-del-parque/torneos/[edition]/[categoria]/page.tsx) para ver
 * si buildBracketTree lo resuelve por posiciones, por reconstrucción desde
 * los resultados (ver lib/circuito/bracketTree.ts), o si sigue cayendo a la
 * vista por lista.
 *
 * No escribe nada en la base — solo hace SELECTs.
 *
 * Uso:
 *   npm run diagnose:brackets
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { log, ok, warn } from "./lib/utils"
import { selectDrawRule } from "../lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../lib/circuito/formatSpec"
import { formatLabel } from "../lib/circuito/categoryStatus"
import { buildBracketTree, type BracketTreeMatchInput } from "../lib/circuito/bracketTree"

// ── Duplicado de diagnóstico de la lógica de lib/circuito/bracketTree.ts ──
//
// buildBracketTree() no expone POR QUÉ devuelve null, ni por cuál de los 2
// caminos (posiciones/reconstrucción) arma el árbol — a propósito: es una
// función pura de presentación, no tiene que devolver diagnósticos. Acá
// abajo se duplica, con el mismo orden de chequeos, una versión de cada
// camino que devuelve el motivo en vez de `null`. El SÍ/NO real (¿hay árbol
// o no?) lo sigue decidiendo buildBracketTree — classify() lo llama primero
// y solo usa este duplicado para explicar el resultado; si el algoritmo de
// bracketTree.ts cambia, en el peor caso este duplicado da una explicación
// desactualizada, pero nunca clasifica mal un caso.

interface CheckResult {
  ok: boolean
  reason?: string
}

function advancerOf(m: BracketTreeMatchInput): string | null {
  if (m.winner_id) return m.winner_id
  if (m.round_number === 1 && m.participant_a_id && !m.participant_b_id) return m.participant_a_id
  return null
}

function isPowerOfTwo(n: number): boolean {
  return n >= 1 && (n & (n - 1)) === 0
}

function groupByRound(matches: BracketTreeMatchInput[]): Map<number, BracketTreeMatchInput[]> {
  const byRound = new Map<number, BracketTreeMatchInput[]>()
  for (const m of matches) {
    if (!byRound.has(m.round_number)) byRound.set(m.round_number, [])
    byRound.get(m.round_number)!.push(m)
  }
  return byRound
}

function checkConsecutiveRounds(roundNumbers: number[]): string | null {
  for (let i = 0; i < roundNumbers.length; i++) {
    if (roundNumbers[i] !== i + 1) return `faltan rondas intermedias (rondas presentes: ${roundNumbers.join(", ")})`
  }
  return null
}

function explainPositional(matches: BracketTreeMatchInput[]): CheckResult {
  if (matches.length === 0) return { ok: false, reason: "sin partidos" }
  const byRound = groupByRound(matches)
  const roundNumbers = [...byRound.keys()].sort((a, b) => a - b)
  const totalRounds = roundNumbers.length

  const gapReason = checkConsecutiveRounds(roundNumbers)
  if (gapReason) return { ok: false, reason: gapReason }

  const firstRoundSize = byRound.get(1)!.length
  if (!isPowerOfTwo(firstRoundSize)) {
    return { ok: false, reason: `ronda 1 tiene ${firstRoundSize} partido(s), no es una potencia de 2` }
  }

  for (let r = 1; r <= totalRounds; r++) {
    const expected = firstRoundSize / 2 ** (r - 1)
    const roundMatches = byRound.get(r)!
    if (roundMatches.length !== expected) {
      return { ok: false, reason: `ronda ${r} tiene ${roundMatches.length} partido(s), se esperaban ${expected}` }
    }
    for (let p = 0; p < expected; p++) {
      if (!roundMatches.some((m) => m.position === p)) {
        return { ok: false, reason: `ronda ${r} no tiene ningún partido en la posición ${p}` }
      }
    }
  }
  const lastRoundExpectedSize = firstRoundSize / 2 ** (totalRounds - 1)
  if (lastRoundExpectedSize !== 1) return { ok: false, reason: "la última ronda no queda en 1 solo partido (no es la final)" }

  for (let i = 1; i < roundNumbers.length; i++) {
    const r = roundNumbers[i]
    const prevByPosition = new Map(byRound.get(roundNumbers[i - 1])!.map((m) => [m.position, m]))
    for (const m of byRound.get(r)!) {
      const feederA = prevByPosition.get(m.position * 2)
      const feederB = prevByPosition.get(m.position * 2 + 1)
      if (m.participant_a_id && (!feederA || advancerOf(feederA) !== m.participant_a_id)) {
        return {
          ok: false,
          reason: `ronda ${r} posición ${m.position}: el lado A no coincide con quien avanza de la ronda ${r - 1} posición ${m.position * 2} (posiciones no enlazadas — típico de un import de Challonge)`,
        }
      }
      if (m.participant_b_id && (!feederB || advancerOf(feederB) !== m.participant_b_id)) {
        return {
          ok: false,
          reason: `ronda ${r} posición ${m.position}: el lado B no coincide con quien avanza de la ronda ${r - 1} posición ${m.position * 2 + 1} (posiciones no enlazadas)`,
        }
      }
    }
  }
  return { ok: true }
}

function explainReconstruction(matches: BracketTreeMatchInput[]): CheckResult {
  if (matches.length === 0) return { ok: false, reason: "sin partidos" }
  const byRound = groupByRound(matches)
  const roundNumbers = [...byRound.keys()].sort((a, b) => a - b)
  const totalRounds = roundNumbers.length

  const gapReason = checkConsecutiveRounds(roundNumbers)
  if (gapReason) return { ok: false, reason: gapReason }

  const finalRoundMatches = byRound.get(totalRounds)!
  if (finalRoundMatches.length !== 1) {
    return { ok: false, reason: `la ronda final (${totalRounds}) tiene ${finalRoundMatches.length} partido(s) en vez de 1` }
  }
  const finalMatch = finalRoundMatches[0]

  const used = new Set<string>([finalMatch.id])
  let failReason: string | null = null

  function resolveSide(round: number, participantId: string): boolean {
    const feederRound = round - 1
    const feeder = (byRound.get(feederRound) ?? []).find((c) => advancerOf(c) === participantId)
    if (feeder) {
      if (used.has(feeder.id)) {
        failReason = `el partido ${feeder.id} (ronda ${feederRound}) alimentaría a más de un partido de la ronda ${round}`
        return false
      }
      used.add(feeder.id)
      return expand(feederRound, feeder)
    }
    if (feederRound === 1) return true // bye
    failReason = `no se encontró en la ronda ${feederRound} un partido ganado por el participante ${participantId}`
    return false
  }

  function expand(round: number, m: BracketTreeMatchInput): boolean {
    if (round === 1) return true
    if (!m.participant_a_id || !m.participant_b_id) {
      failReason = `el partido ${m.id} (ronda ${round}) tiene un lado sin participante`
      return false
    }
    return resolveSide(round, m.participant_a_id) && resolveSide(round, m.participant_b_id)
  }

  if (!expand(totalRounds, finalMatch)) return { ok: false, reason: failReason ?? "no se pudo reconstruir" }
  if (used.size !== matches.length) {
    return {
      ok: false,
      reason: `${matches.length - used.size} partido(s) real(es) no se usan en la cadena reconstruida hasta la final`,
    }
  }
  return { ok: true }
}

// El sí/no lo decide la función real (buildBracketTree); el duplicado de
// arriba solo se usa para explicar CÓMO o POR QUÉ.
function classify(matches: BracketTreeMatchInput[]): string {
  if (matches.length === 0) return "—"
  const tree = buildBracketTree(matches, {})
  if (tree) return explainPositional(matches).ok ? "árbol por posiciones" : "árbol reconstruido"
  const byPosition = explainPositional(matches)
  const reconstructed = explainReconstruction(matches)
  return `LISTAS (posiciones: ${byPosition.reason}; reconstrucción: ${reconstructed.reason})`
}

// Repite knockoutTail() de la página de categoría: re-numera desde `fromRound`
// para poder pasarle a buildBracketTree/classify solo el tramo de eliminación
// directa (semis+final de groups_then_knockout, o la final de
// round_robin_with_final).
function knockoutTail(matches: BracketTreeMatchInput[], fromRound: number): BracketTreeMatchInput[] {
  return matches
    .filter((m) => m.round_number >= fromRound)
    .map((m) => ({ ...m, round_number: m.round_number - fromRound + 1 }))
}

// ── Script ────────────────────────────────────────────────────────────────

interface ReportRow {
  edicion: string
  categoria: string
  drawSize: number | string
  formato: string
  principal: string
  repechaje: string
}

// Fila de circuito_matches tal como se selecciona más abajo — superset de
// BracketTreeMatchInput (agrega `bracket`), así que se le puede pasar
// directo a classify()/buildBracketTree() sin castear.
interface CircuitoMatchDiagRow extends BracketTreeMatchInput {
  bracket: "main" | "repechaje"
}

async function main() {
  const db = createAdminClient()

  log("\nDiagnóstico de cuadros del Circuito del Parque (todas las ediciones) — solo lectura\n")

  const { data: editions, error: editionsError } = await db
    .from("circuito_editions")
    .select("id, slug, name, month, year")
    .order("year", { ascending: true })
    .order("month", { ascending: true })
  if (editionsError || !editions) throw new Error(`Error cargando ediciones: ${editionsError?.message}`)

  const rows: ReportRow[] = []
  const listasDetail: string[] = []

  for (const edition of editions) {
    const { data: categories, error: categoriesError } = await db
      .from("circuito_categories")
      .select("id, name, slug, draw_size")
      .eq("edition_id", edition.id)
      .order("sort_order")
    if (categoriesError) {
      warn(`Error cargando categorías de "${edition.name}": ${categoriesError.message}`)
      continue
    }

    for (const category of categories ?? []) {
      if (!category.draw_size) continue // sin cerrar inscripciones todavía — nada que diagnosticar

      const [{ data: participants, error: participantsError }, { data: matches, error: matchesError }] = await Promise.all([
        db.from("circuito_participants").select("id, display_name, seed").eq("category_id", category.id),
        db
          .from("circuito_matches")
          .select("id, bracket, round_number, position, participant_a_id, participant_b_id, score, winner_id, status, is_walkover")
          .eq("category_id", category.id)
          .order("round_number")
          .order("position"),
      ])
      if (participantsError || matchesError) {
        warn(`Error cargando "${edition.name}" / "${category.name}": ${participantsError?.message ?? matchesError?.message}`)
        continue
      }

      // Sanity check aparte de la tabla: si difieren, algo quedó mal cargado
      // (draw_size lo fija el import/alta de la categoría, no se corrige solo).
      if ((participants ?? []).length !== category.draw_size) {
        warn(
          `"${edition.name}" / "${category.name}": draw_size=${category.draw_size} pero hay ${(participants ?? []).length} participante(s) cargado(s)`,
        )
      }

      const allMatches = (matches ?? []) as CircuitoMatchDiagRow[]
      const mainMatches = allMatches.filter((m) => m.bracket === "main")
      const repechajeMatches = allMatches.filter((m) => m.bracket === "repechaje")

      const rule = selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
      const formato = formatLabel(category.draw_size)

      let principal: string
      let repechaje: string

      if (!rule) {
        principal = "sin regla de formato para este draw_size"
        repechaje = "—"
      } else if (rule.format === "single_elimination") {
        principal = classify(mainMatches)
        repechaje = repechajeMatches.length > 0 ? classify(repechajeMatches) : "—"
      } else if (rule.format === "round_robin_pure") {
        // N=5: todos contra todos puro, sin cuadro de eliminación.
        principal = `zonas (${mainMatches.length} partido(s), sin cuadro de eliminación)`
        repechaje = "—"
      } else {
        // round_robin_with_final (N=4) y groups_then_knockout (N=6-7):
        // zona(s) + tramo de eliminación desde la ronda 2 en adelante.
        const knockoutPart = knockoutTail(mainMatches, 2)
        principal =
          knockoutPart.length > 0
            ? `zonas (${mainMatches.length - knockoutPart.length} partido(s)) + ${classify(knockoutPart)}`
            : `zonas (${mainMatches.length} partido(s), todavía sin semis/final)`
        repechaje = "—" // el repechaje no existe en estos formatos (solo N=8+)
      }

      if (principal.startsWith("LISTAS")) listasDetail.push(`${edition.name} / ${category.name} (principal): ${principal}`)
      if (repechaje.startsWith("LISTAS")) listasDetail.push(`${edition.name} / ${category.name} (repechaje): ${repechaje}`)

      rows.push({
        edicion: edition.name,
        categoria: category.name,
        drawSize: category.draw_size,
        formato,
        principal,
        repechaje,
      })
    }
  }

  console.table(rows)

  log("\n── Resumen ──────────────────────────────────")
  if (listasDetail.length === 0) {
    ok("Ningún cuadro quedó en LISTAS: todos arman árbol (por posiciones o reconstruido).")
  } else {
    warn(`${listasDetail.length} caso(s) quedan en LISTAS:`)
    for (const detail of listasDetail) warn(`  - ${detail}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
