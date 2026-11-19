// Lógica pura (sin canvas ni DOM) de la imagen del cuadro del Final Master para
// Instagram: arma las filas de las zonas y los cruces con textos ya listos,
// calcula el layout y decide cómo se escribe el nombre de una pareja. El
// dibujo vive en components/admin/final-master/exportFinalMasterImage.ts.
//
// Regla clave: "A confirmar" (PARTNER_TBD_LABEL) NUNCA se recorta. Si la
// pareja no entra, se achica la fuente y después se acorta solo el nombre del
// jugador cargado.

import { calculateZoneStandings } from "@/lib/mid-master/calculateZoneStandings"
import { parseSetScores } from "@/components/mid-master/parseSetScores"
import type { DbMmMatch, DbMmParticipant } from "@/lib/data/mid-master/types"
import { PARTNER_TBD_LABEL } from "./partner"

// ---------------------------------------------------------------------------
// Nombres

export type Measure = (text: string, size: number, italic: boolean) => number

export interface NameSegment {
  text: string
  // true = "A confirmar": se dibuja en dorado e itálica y no se recorta.
  tbd: boolean
}

export interface FittedName {
  size: number
  segments: NameSegment[]
}

const SEP = " / "
const ELLIPSIS = "…"

function truncate(measure: Measure, text: string, max: number, size: number, italic = false): string {
  if (measure(text, size, italic) <= max) return text
  let t = text
  while (t.length > 1 && measure(`${t}${ELLIPSIS}`, size, italic) > max) t = t.slice(0, -1)
  return `${t.trimEnd()}${ELLIPSIS}`
}

function joinedWidth(measure: Measure, segs: NameSegment[], size: number): number {
  return segs.reduce((sum, s) => sum + measure(s.text, size, s.tbd), 0)
}

// Pareja de dobles ("Juan Fernández / A confirmar"): true si el compañero está pendiente.
export function isPendingPairName(name: string): boolean {
  return name.endsWith(`${SEP}${PARTNER_TBD_LABEL}`)
}

/**
 * Cómo escribir un nombre dentro de `maxWidth`. Primero se achica la fuente
 * (de `size` a `min`). Si la pareja sigue sin entrar se acortan los
 * apellidos; con compañero pendiente se acorta solo el jugador cargado y
 * "A confirmar" queda siempre completo (si hace falta, la fuente baja de
 * `min` hasta que entren al menos "A confirmar" y el separador).
 */
export function fitPairName(measure: Measure, name: string, maxWidth: number, size: number, min: number): FittedName {
  if (!name.includes(SEP)) {
    let s = size
    while (s > min && measure(name, s, false) > maxWidth) s -= 1
    return { size: s, segments: [{ text: truncate(measure, name, maxWidth, s), tbd: false }] }
  }

  const pending = isPendingPairName(name)
  const idx = pending ? name.length - PARTNER_TBD_LABEL.length - SEP.length : name.indexOf(SEP)
  const left = name.slice(0, idx)
  const right = pending ? PARTNER_TBD_LABEL : name.slice(idx + SEP.length)
  const build = (l: string, r: string): NameSegment[] => [
    { text: l, tbd: false },
    { text: SEP, tbd: false },
    { text: r, tbd: pending },
  ]

  let s = size
  while (s > min && joinedWidth(measure, build(left, right), s) > maxWidth) s -= 1
  if (joinedWidth(measure, build(left, right), s) <= maxWidth) return { size: s, segments: build(left, right) }

  if (pending) {
    // "A confirmar" y el separador son intocables: si ni con el jugador
    // reducido a "…" entran, sigue bajando la fuente (hasta 8px).
    const fixed = (sz: number) => measure(SEP, sz, false) + measure(PARTNER_TBD_LABEL, sz, true) + measure(ELLIPSIS, sz, false)
    while (s > 8 && fixed(s) > maxWidth) s -= 1
    const room = Math.max(maxWidth - measure(SEP, s, false) - measure(PARTNER_TBD_LABEL, s, true), 0)
    return { size: s, segments: build(truncate(measure, left, room, s), right) }
  }

  // Pareja completa: se reparte el ancho y cada apellido se acorta por separado.
  const budget = Math.max(maxWidth - measure(SEP, s, false), 0)
  const leftW = measure(left, s, false)
  const rightW = measure(right, s, false)
  let lb = budget / 2
  let rb = budget / 2
  if (leftW < lb) rb = budget - leftW
  else if (rightW < rb) lb = budget - rightW
  return { size: s, segments: build(truncate(measure, left, lb, s), truncate(measure, right, rb, s)) }
}

// ---------------------------------------------------------------------------
// Datos de la imagen

export interface ZoneRowExport {
  participantId: string
  position: number
  name: string
  played: number
  won: number
  lost: number
  setsWon: number
  setsLost: number
  gamesDiff: number
  advances: boolean
}

export interface ZoneExport {
  name: string // "Zona A"
  rows: ZoneRowExport[]
  started: boolean // ya hay algún partido jugado (si no, no se resalta quién avanza)
  playedCount: number
  totalCount: number
}

export interface KnockoutSideExport {
  // Nombre real o null si todavía no está definido.
  name: string | null
  // Texto del lugar si no está definido ("1° Zona A").
  placeholder: string
  isWinner: boolean
  // Games por set de ESTE lado ("6", "3", "7"); "W.O." en el ganador por walkover.
  sets: string[]
}

export interface KnockoutMatchExport {
  label: string // "Semifinal 1", "Final"
  when: string | null // "vie 12 dic · 18:30 h"
  a: KnockoutSideExport
  b: KnockoutSideExport
}

export interface FinalMasterExport {
  zones: ZoneExport[]
  semis: KnockoutMatchExport[]
  final: KnockoutMatchExport
  champion: { label: string; name: string } | null
  isDoubles: boolean
}

export interface FinalMasterExportInput {
  categoryName: string
  isDoubles: boolean
  zones: Array<{ name: string; participants: DbMmParticipant[]; matches: DbMmMatch[] }>
  knockoutMatches: DbMmMatch[]
  allParticipants: DbMmParticipant[]
}

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export function formatWhen(date: string | null, time: string | null): string | null {
  if (!date) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const day = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  return time ? `${day} · ${time.slice(0, 5)} h` : day
}

export function championLabel(isDoubles: boolean, categoryName: string): string {
  if (isDoubles) return "Campeones"
  return /damas/i.test(categoryName) ? "Campeona" : "Campeón"
}

const SEMI_SEEDS: Array<[string, string]> = [
  ["1° Zona A", "2° Zona B"],
  ["1° Zona B", "2° Zona A"],
]
const FINAL_SEEDS: [string, string] = ["Ganador semifinal 1", "Ganador semifinal 2"]

function buildKnockoutMatch(
  match: DbMmMatch | undefined,
  label: string,
  seeds: [string, string],
  nameOf: (id: string | null) => string | null,
): KnockoutMatchExport {
  const idA = match?.participant_1_id ?? null
  const idB = match?.participant_2_id ?? null
  const winnerId = match?.winner_participant_id ?? null
  const walkover = match?.status === "walkover"
  const completed = match?.status === "played" || match?.status === "walkover"
  const parsed = parseSetScores(match?.score ?? undefined)
  const side = (id: string | null, seed: string, isA: boolean): KnockoutSideExport => {
    const isWinner = completed && !!winnerId && !!id && winnerId === id
    let sets: string[] = []
    if (walkover) sets = isWinner ? ["W.O."] : []
    else if (parsed.length > 0) sets = parsed.map((s) => String(isA ? s.a : s.b))
    else if (isWinner && match?.score) sets = [match.score] // formato inesperado: se muestra crudo
    return { name: nameOf(id), placeholder: seed, isWinner, sets }
  }
  return {
    label,
    when: formatWhen(match?.scheduled_date ?? null, match?.scheduled_time ?? null),
    a: side(idA, seeds[0], true),
    b: side(idB, seeds[1], false),
  }
}

export function buildFinalMasterExport(input: FinalMasterExportInput): FinalMasterExport {
  const nameById = new Map(input.allParticipants.map((p) => [p.id, p.name]))
  const nameOf = (id: string | null) => (id ? (nameById.get(id) ?? null) : null)

  const zones: ZoneExport[] = input.zones.map((z) => {
    const standings = calculateZoneStandings(z.participants, z.matches)
    const started = standings.some((r) => r.played > 0)
    const played = z.matches.filter((m) => m.status === "played" || m.status === "walkover").length
    return {
      name: z.name,
      started,
      playedCount: played,
      totalCount: z.matches.length,
      rows: standings.map((r) => ({
        participantId: r.participantId,
        position: r.position,
        name: nameOf(r.participantId) ?? "—",
        played: r.played,
        won: r.won,
        lost: r.lost,
        setsWon: r.setsWon,
        setsLost: r.setsLost,
        gamesDiff: r.gamesDiff,
        advances: started && r.advances,
      })),
    }
  })

  const semisRaw = input.knockoutMatches
    .filter((m) => m.phase === "semifinal")
    .sort(
      (a, b) =>
        (a.match_order ?? 999) - (b.match_order ?? 999) ||
        String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
    )
  const finalRaw = input.knockoutMatches.find((m) => m.phase === "final")
  const semis = [0, 1].map((i) => buildKnockoutMatch(semisRaw[i], `Semifinal ${i + 1}`, SEMI_SEEDS[i], nameOf))
  const final = buildKnockoutMatch(finalRaw, "Final", FINAL_SEEDS, nameOf)

  const finalDone = finalRaw?.status === "played" || finalRaw?.status === "walkover"
  const championName = finalDone && finalRaw?.winner_participant_id ? nameOf(finalRaw.winner_participant_id) : null
  return {
    zones,
    semis,
    final,
    isDoubles: input.isDoubles,
    champion: championName ? { label: championLabel(input.isDoubles, input.categoryName), name: championName } : null,
  }
}

// ---------------------------------------------------------------------------
// Layout (unidades "naturales"; el dibujo escala todo por `scale`)

export const FM = {
  natW: 1000,
  zoneTitleH: 42,
  zoneHdrH: 34,
  rowH: 50,
  zoneLegendH: 28,
  zoneGap: 20,
  sectionGap: 26,
  koTitleH: 42,
  koHeadH: 32,
  koSideH: 44,
  koGap: 18,
  champGap: 16,
  champH: 92,
  maxScale: 1.25,
} as const

export const KO_CARD_H = FM.koHeadH + FM.koSideH * 2

export interface LayoutPlan {
  scale: number
  natW: number // ancho natural usado (se adapta al aspecto del formato)
  rowH: number
  zoneGap: number
  sectionGap: number
  koGap: number
  contentH: number // en unidades naturales, ya con el reparto del alto sobrante
  offsetY: number // px que se baja el contenido (tope 32: el sobrante no se centra)
}

const MIN_NAT_W = 840
const MAX_OFFSET_Y = 32

export function planLayout(areaW: number, areaH: number, zoneRowCounts: number[], hasChampion: boolean): LayoutPlan {
  const totalRows = zoneRowCounts.reduce((a, b) => a + b, 0)
  const zonesFixed = zoneRowCounts.length * (FM.zoneTitleH + FM.zoneHdrH + FM.zoneLegendH)
  const koFixed = FM.koTitleH + KO_CARD_H * 2 + (hasChampion ? FM.champGap + FM.champH : 0)
  const gapsCount = Math.max(zoneRowCounts.length - 1, 0)
  const natH = zonesFixed + totalRows * FM.rowH + gapsCount * FM.zoneGap + FM.sectionGap + koFixed + FM.koGap

  // En formatos altos (story) un ancho natural menor sube la escala y llena el alto.
  const natW = Math.min(Math.max(areaW / (areaH / natH), MIN_NAT_W), FM.natW)
  const scale = Math.min(areaW / natW, areaH / natH, FM.maxScale)
  let spare = Math.max(areaH / scale - natH, 0)
  const rowExtra = totalRows > 0 ? Math.min(spare / totalRows, FM.rowH * 0.6) : 0
  spare -= rowExtra * totalRows
  const offsetY = Math.min((spare * scale) / 2, MAX_OFFSET_Y)
  spare = Math.max(spare - offsetY / scale, 0)
  const gapExtra = spare / 2 // por igual entre sectionGap y koGap
  return {
    scale,
    natW,
    rowH: FM.rowH + rowExtra,
    zoneGap: FM.zoneGap,
    sectionGap: FM.sectionGap + gapExtra,
    koGap: FM.koGap + gapExtra,
    contentH: natH + rowExtra * totalRows + gapExtra * 2,
    offsetY,
  }
}
