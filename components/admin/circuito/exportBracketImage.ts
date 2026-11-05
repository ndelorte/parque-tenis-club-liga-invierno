// Dibuja un cuadro (BracketTree) en un <canvas> con medidas de publicación de
// Instagram y lo devuelve como JPEG. Solo corre en el navegador (panel).
//
// Se dibuja a mano en canvas en vez de "sacarle foto" al DOM: así el resultado
// no depende del ancho de pantalla, del tema claro/oscuro ni del scroll
// horizontal del cuadro, y siempre entra completo en el formato elegido.

import type { BracketTree, BracketTreeMatch, BracketTreeSide } from "@/lib/circuito/bracketTree"
import type { GroupStageExport, GroupTable } from "./groupStageExport"

export type IgFormat = "feed" | "square" | "story"

export const IG_FORMATS: Record<IgFormat, { label: string; width: number; height: number }> = {
  feed: { label: "Publicación 4:5 (1080×1350)", width: 1080, height: 1350 },
  square: { label: "Cuadrada 1:1 (1080×1080)", width: 1080, height: 1080 },
  story: { label: "Historia 9:16 (1080×1920)", width: 1080, height: 1920 },
}

// Paleta fija (la del tema claro del sitio, ver app/globals.css), para que la
// imagen salga igual sin importar el tema del panel.
const C = {
  board: "#1c3a2a",
  boardDeep: "#13241a",
  boardFg: "#f4f6f2",
  card: "#ffffff",
  text: "#13241a",
  muted: "#5b6b60",
  divider: "#dfe4dc",
  clay: "#d4622a",
  clayLight: "#e8844f",
  ball: "#d4e04a",
  line: "rgba(244, 246, 242, 0.55)",
}

function fontFamily(variable: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return v ? `${v}, ${fallback}` : fallback
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Recorta el texto con "…" para que entre en maxWidth.
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

// Nombre de un participante dentro de una caja de ancho maxWidth. Single: se
// recorta con "…" como siempre. Pareja de dobles ("Michel / Toro"): primero se
// achica la fuente (de `size` hasta `min`); si aun así no entra, se acorta cada
// apellido por separado para que se vean los dos (nunca "Michel / To…" sin el
// compañero). Deja ctx.font puesto y devuelve el texto a dibujar.
export function fitName(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: string | number,
  size: number,
  family: string,
  min: number,
): string {
  ctx.font = `${weight} ${size}px ${family}`
  if (!text.includes(" / ")) return fit(ctx, text, maxWidth)
  let s = size
  while (s > min && ctx.measureText(text).width > maxWidth) {
    s -= 1
    ctx.font = `${weight} ${s}px ${family}`
  }
  if (ctx.measureText(text).width <= maxWidth) return text
  const [left, ...rest] = text.split(" / ")
  const right = rest.join(" / ")
  const slashW = ctx.measureText(" / ").width
  const budget = Math.max(maxWidth - slashW, 0)
  const leftW = ctx.measureText(left).width
  const rightW = ctx.measureText(right).width
  // Reparte el ancho: el apellido corto conserva lo que necesita y el otro
  // se queda con el resto (con un mínimo de la mitad para cada uno).
  let leftBudget = budget / 2
  let rightBudget = budget / 2
  if (leftW < leftBudget) rightBudget = budget - leftW
  else if (rightW < rightBudget) leftBudget = budget - rightW
  return `${fit(ctx, left, leftBudget)} / ${fit(ctx, right, rightBudget)}`
}

// Achica la fuente hasta que el texto entre (para títulos largos).
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, weight: string, size: number, family: string, min: number) {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > min && ctx.measureText(text).width > maxWidth) {
    s -= 2
    ctx.font = `${weight} ${s}px ${family}`
  }
  return s
}


interface Fonts {
  sans: string
  heading: string
}

interface Area {
  x: number
  y: number
  w: number
  h: number
}

// Fondo + encabezado (logo, club, edición · categoría). Devuelve el lienzo y
// el área libre para el contenido.
async function setupCanvas(format: IgFormat, title: string, subtitle: string) {
  const { width: W, height: H } = IG_FORMATS[format]
  const sans = fontFamily("--font-barlow", "system-ui, sans-serif")
  const heading = fontFamily("--font-barlow-condensed", sans)

  await Promise.all([
    document.fonts.load(`800 40px ${heading}`),
    document.fonts.load(`700 40px ${heading}`),
    document.fonts.load(`600 20px ${sans}`),
    document.fonts.load(`400 20px ${sans}`),
  ]).catch(() => undefined)
  const logo = await loadImage("/images/LOGO.png")

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("El navegador no permite generar la imagen.")

  // ---- Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, C.board)
  bg.addColorStop(1, C.boardDeep)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // Franja de polvo de ladrillo arriba
  ctx.fillStyle = C.clay
  ctx.fillRect(0, 0, W, 10)

  // ---- Encabezado compacto (una sola franja con logo + textos)
  const pad = 32
  const logoSize = format === "square" ? 64 : 76
  const headTop = 26
  if (logo) ctx.drawImage(logo, pad, headTop, logoSize, logoSize)
  const textX = pad + (logo ? logoSize + 20 : 0)
  const textW = W - textX - pad
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = C.clayLight
  ctx.font = `700 20px ${heading}`
  ctx.fillText("PARQUE TENIS CLUB · CIRCUITO DEL PARQUE", textX, headTop + 20)
  ctx.fillStyle = C.boardFg
  const headLine = `${title} · ${subtitle}`.toUpperCase()
  const titleSize = fitFont(ctx, headLine, textW, "800", format === "square" ? 42 : 48, heading, 26)
  ctx.fillText(title.toUpperCase(), textX, headTop + 22 + titleSize)
  const titleW = ctx.measureText(`${title.toUpperCase()} · `).width
  ctx.fillStyle = C.ball
  ctx.fillText(subtitle.toUpperCase(), textX + titleW, headTop + 22 + titleSize)

  const headerBottom = Math.max(headTop + logoSize, headTop + 22 + titleSize) + 18
  const area: Area = { x: pad, y: headerBottom, w: W - pad * 2, h: H - headerBottom - pad }
  return { canvas, ctx, area, fonts: { sans, heading } as Fonts }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen."))), "image/jpeg", 0.92),
  )
}

// Título de sección (ronda o grupo) con la raya de polvo de ladrillo abajo.
function sectionTitle(ctx: CanvasRenderingContext2D, label: string, x: number, w: number, baseY: number, size: number, f: Fonts) {
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = C.boardFg
  ctx.font = `700 ${size}px ${f.heading}`
  ctx.fillText(fit(ctx, label.toUpperCase(), w), x, baseY)
  ctx.fillStyle = C.clay
  ctx.fillRect(x, baseY + 8, w, 3)
}

function drawChampionCard(
  ctx: CanvasRenderingContext2D,
  box: Area,
  champion: { name: string } | null,
  finalScore: string | null,
  label: string,
  f: Fonts,
) {
  const { x, y, w, h } = box
  roundRect(ctx, x, y, w, h, 8)
  ctx.textBaseline = "alphabetic"
  if (champion) {
    ctx.fillStyle = C.boardDeep
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = C.ball
    ctx.stroke()
    ctx.fillStyle = C.ball
    ctx.font = `700 18px ${f.heading}`
    ctx.fillText(`🏆 ${label.toUpperCase()}`, x + 16, y + 30)
    ctx.fillStyle = C.boardFg
    const nameText = fitName(ctx, champion.name, w - 32, "800", 32, f.heading, 14)
    ctx.fillText(nameText, x + 16, y + 34 + parseInt(ctx.font.match(/(\d+)px/)?.[1] ?? "32", 10))
    if (finalScore) {
      ctx.fillStyle = "rgba(244, 246, 242, 0.8)"
      ctx.font = `500 15px ${f.sans}`
      ctx.fillText(`Final: ${finalScore}`, x + 16, y + h - 14)
    }
  } else {
    ctx.setLineDash([8, 6])
    ctx.lineWidth = 2
    ctx.strokeStyle = C.line
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = C.ball
    ctx.font = `700 18px ${f.heading}`
    ctx.fillText(label.toUpperCase(), x + 16, y + 34)
    ctx.fillStyle = C.boardFg
    ctx.font = `800 30px ${f.heading}`
    ctx.fillText("POR DEFINIR", x + 16, y + 74)
  }
}

// ---------------------------------------------------------------------------
// Cuadro de eliminación directa

const BR = { gap: 26, headH: 40, champGap: 22, minColW: 165, maxColW: 340 }

function bracketDims(tree: BracketTree, stacked = false) {
  const R = Math.max(tree.rounds.length, 1)
  const n1 = Math.max(tree.rounds[0]?.matches.length ?? 1, 1)
  const dense = n1 >= 8
  // stacked: parejas de dobles en 2 líneas (un apellido arriba del otro).
  const sideH = stacked ? (dense ? 40 : 46) : dense ? 28 : 34
  const cardH = sideH * 2
  const champH = dense ? 104 : 116
  const minSlot = cardH + 8
  // Alto mínimo: los partidos de 1ª ronda + lugar para el campeón bajo la final.
  // Con una sola ronda (final sola) la final va arriba y el campeón justo abajo.
  const minBodyH = R === 1 ? cardH + BR.champGap + champH + 12 : Math.max(n1 * minSlot, cardH + 2 * (BR.champGap + champH))
  const widthFor = (cw: number) => R * cw + (R - 1) * BR.gap
  return { R, n1, dense, sideH, cardH, champH, minBodyH, widthFor, minW: widthFor(BR.minColW), minH: BR.headH + minBodyH }
}

// Dibuja el cuadro dentro de `area`: se diseña en unidades "naturales" y se
// escala (hasta maxScale) para ocupar todo el ancho; después se reparte el
// alto sobrante entre los partidos. El campeón va debajo de la final.
function drawBracket(
  ctx: CanvasRenderingContext2D,
  tree: BracketTree,
  area: Area,
  opts: {
    championLabel: string
    placeholders?: Record<string, [string, string]>
    maxScale: number
    // Cuánto puede estirarse el alto del cuadro respecto del mínimo (sin tope si no se pasa).
    maxStretch?: number
    fonts: Fonts
  },
) {
  const { sans } = opts.fonts
  const rounds = tree.rounds
  const { gap, headH, champGap } = BR
  const layout = (stacked: boolean) => {
    const d = bracketDims(tree, stacked)
    let s = Math.min(area.w / d.widthFor(BR.minColW), area.h / (headH + d.minBodyH), opts.maxScale)
    const colW = Math.min((area.w / s - (d.R - 1) * gap) / d.R, BR.maxColW)
    const bodyH = Math.min(Math.max(area.h / s - headH, d.minBodyH), d.minBodyH * (opts.maxStretch ?? Infinity))
    s = Math.min(s, area.h / (headH + bodyH))
    return { ...d, s, colW, bodyH }
  }
  const nameSizeFor = (dense: boolean) => (dense ? 15 : 17)
  const winnerOf = (m: BracketTreeMatch) => (m.winnerId && m.a?.id === m.winnerId ? m.a : m.b?.id === m.winnerId ? m.b : null)
  // Lugar para el nombre en una fila: caja − margen − seed − (resultado, en el ganador).
  const nameRoom = (side: BracketTreeSide, m: BracketTreeMatch, colW: number, nameSize: number) => {
    let room = colW - 12 - (side.seed ? 22 : 0) - 10
    if (winnerOf(m)?.id === side.id) {
      ctx.font = `700 ${nameSize - 1}px ${sans}`
      room -= ctx.measureText(m.isWalkover ? "W.O." : (m.score ?? "")).width + 10
    }
    return room
  }
  // Si alguna pareja de dobles no entra en una línea con letra de 13px o
  // más, todo el cuadro pasa a cajas más altas con la pareja en 2 líneas.
  const first = layout(false)
  const needsStack = rounds.some((round) =>
    round.matches.some((m) =>
      [m.a, m.b].some((side) => {
        if (!side || !side.name.includes(" / ")) return false
        ctx.font = `${winnerOf(m)?.id === side.id ? 700 : 500} 13px ${sans}`
        return ctx.measureText(side.name).width > nameRoom(side, m, first.colW, nameSizeFor(first.dense))
      }),
    ),
  )
  const L = needsStack ? layout(true) : first
  const { R, dense, sideH, cardH, champH, colW, bodyH } = L
  const s = L.s
  const widthFor = L.widthFor
  const contentW = widthFor(colW)
  const naturalH = headH + bodyH

  ctx.save()
  ctx.translate(area.x + (area.w - contentW * s) / 2, area.y + (area.h - naturalH * s) / 2)
  ctx.scale(s, s)

  const bodyTop = headH
  const colX = (ri: number) => ri * (colW + gap)
  const centerY = (ri: number, i: number) =>
    R === 1 ? bodyTop + 6 + cardH / 2 : bodyTop + (i + 0.5) * (bodyH / rounds[ri].matches.length)

  rounds.forEach((round, ri) => sectionTitle(ctx, round.label, colX(ri), colW, headH - 16, dense ? 20 : 22, opts.fonts))

  // Conectores
  ctx.strokeStyle = C.line
  ctx.lineWidth = 2
  for (let ri = 1; ri < R; ri++) {
    const prev = rounds[ri - 1].matches.length
    const cur = rounds[ri].matches.length
    rounds[ri].matches.forEach((_, j) => {
      const feeders = prev === cur * 2 ? [2 * j, 2 * j + 1] : [j]
      const xFrom = colX(ri - 1) + colW
      const xMid = xFrom + gap / 2
      const yTo = centerY(ri, j)
      ctx.beginPath()
      for (const f of feeders) {
        if (f >= prev) continue
        const y = centerY(ri - 1, f)
        ctx.moveTo(xFrom, y)
        ctx.lineTo(xMid, y)
        ctx.lineTo(xMid, yTo)
      }
      ctx.moveTo(xMid, yTo)
      ctx.lineTo(colX(ri), yTo)
      ctx.stroke()
    })
  }
  // Final → campeón (hacia abajo, en la misma columna)
  const finalY = rounds.length > 0 ? centerY(rounds.length - 1, 0) : bodyTop + bodyH / 2
  const champX = colX(R - 1)
  const champY = finalY + cardH / 2 + champGap
  ctx.beginPath()
  ctx.moveTo(champX + colW / 2, finalY + cardH / 2)
  ctx.lineTo(champX + colW / 2, champY)
  ctx.stroke()

  // Partidos
  const nameSize = nameSizeFor(dense)
  const drawSide = (side: BracketTreeSide | null, m: BracketTreeMatch, x: number, y: number, isB: boolean) => {
    const mid = y + sideH / 2
    const isWinner = !!m.winnerId && !!side && m.winnerId === side.id
    if (isWinner) {
      ctx.fillStyle = C.clay
      ctx.fillRect(x, y, 5, sideH)
    }
    ctx.textBaseline = "middle"
    if (isB && m.isBye) {
      ctx.fillStyle = C.muted
      ctx.font = `italic 400 ${nameSize - 1}px ${sans}`
      ctx.fillText("Pase libre", x + 12, mid)
      return
    }
    if (!side) {
      const placeholder = opts.placeholders?.[m.id]?.[isB ? 1 : 0]
      ctx.fillStyle = C.muted
      ctx.font = placeholder ? `600 ${nameSize - 1}px ${sans}` : `italic 400 ${nameSize - 1}px ${sans}`
      ctx.fillText(fit(ctx, placeholder ?? "Por definir", colW - 24), x + 12, mid)
      return
    }
    let nx = x + 12
    if (side.seed) {
      ctx.fillStyle = C.muted
      ctx.font = `600 ${nameSize - 4}px ${sans}`
      ctx.fillText(`${side.seed}`, nx, mid)
      nx += 22
    }
    let right = x + colW - 10
    if (isWinner) {
      const score = m.isWalkover ? "W.O." : (m.score ?? "")
      ctx.font = `700 ${needsStack ? nameSize - 3 : nameSize - 1}px ${sans}`
      ctx.fillStyle = C.text
      const sw = ctx.measureText(score).width
      ctx.fillText(score, right - sw, mid)
      right -= sw + 10
    }
    ctx.fillStyle = isWinner || !m.winnerId ? C.text : C.muted
    const weight = isWinner ? 700 : 500
    ctx.font = `${weight} ${nameSize}px ${sans}`
    if (needsStack && side.name.includes(" / ") && ctx.measureText(side.name).width > right - nx) {
      // Un apellido por línea: "Apellido /" arriba y "Apellido" abajo.
      const [p1, ...rest] = side.name.split(" / ")
      const lines = [`${p1} /`, rest.join(" / ")]
      const size = Math.min(...lines.map((l) => fitFont(ctx, l, right - nx, String(weight), nameSize - 1, sans, 11)))
      ctx.font = `${weight} ${size}px ${sans}`
      const lh = size + 2
      lines.forEach((l, li) => ctx.fillText(fit(ctx, l, right - nx), nx, mid + (li - 0.5) * lh))
    } else {
      ctx.fillText(fitName(ctx, side.name, right - nx, weight, nameSize, sans, 11), nx, mid)
    }
  }

  rounds.forEach((round, ri) => {
    round.matches.forEach((m, i) => {
      const x = colX(ri)
      const y = centerY(ri, i) - cardH / 2
      ctx.save()
      roundRect(ctx, x, y, colW, cardH, 6)
      ctx.fillStyle = C.card
      ctx.fill()
      ctx.clip()
      drawSide(m.a, m, x, y, false)
      drawSide(m.b, m, x, y + sideH, true)
      ctx.fillStyle = C.divider
      ctx.fillRect(x, y + sideH - 0.5, colW, 1)
      ctx.restore()
    })
  })

  drawChampionCard(ctx, { x: champX, y: champY, w: colW, h: champH }, tree.champion, tree.finalScore, opts.championLabel, opts.fonts)
  ctx.restore()
}

interface ExportOptions {
  tree: BracketTree
  title: string // p. ej. nombre de la edición
  subtitle: string // p. ej. categoría
  championLabel: string
  format: IgFormat
}

export async function renderBracketJpeg({ tree, title, subtitle, championLabel, format }: ExportOptions): Promise<Blob> {
  const { canvas, ctx, area, fonts } = await setupCanvas(format, title, subtitle)
  drawBracket(ctx, tree, area, { championLabel, maxScale: 2.6, fonts })
  return toJpeg(canvas)
}

// ---------------------------------------------------------------------------
// Fase de grupos (todos contra todos): una tabla de doble entrada por grupo.
// Cada fila es un jugador (en orden de posición) y cada columna su rival; la
// celda muestra el resultado desde el lado de la fila.

const GR = { titleH: 40, hdrH: 36, rowH: 50, posW: 32, nameMinW: 160, cellW: 64, pgW: 46, legendH: 30, gap: 26 }

function groupNaturalW(g: GroupTable) {
  return GR.posW + GR.nameMinW + g.rows.length * GR.cellW + GR.pgW
}

function groupNaturalH(g: GroupTable, rowH = GR.rowH) {
  return GR.titleH + GR.hdrH + g.rows.length * rowH + GR.legendH
}

// "6-4 3-6 7-6" visto desde el lado B → "4-6 6-3 6-7".
function flipScore(score: string): string {
  return score.replace(/(\d+)-(\d+)/g, "$2-$1")
}

function drawGroup(
  ctx: CanvasRenderingContext2D,
  g: GroupTable,
  x: number,
  y: number,
  w: number,
  rowH: number,
  legend: string[], // se van sacando partes del final si no entra
  f: Fonts,
) {
  const n = g.rows.length
  const nameW = w - GR.posW - n * GR.cellW - GR.pgW
  sectionTitle(ctx, `${g.name} · Todos contra todos`, x, w, y + GR.titleH - 16, 22, f)

  const top = y + GR.titleH
  const tableH = GR.hdrH + n * rowH
  const cellX = (c: number) => x + GR.posW + nameW + c * GR.cellW
  const pgX = x + w - GR.pgW
  const started = g.played > 0

  const wins = new Map(g.rows.map((r) => [r.id, 0]))
  for (const m of g.matches) if (m.winnerId) wins.set(m.winnerId, (wins.get(m.winnerId) ?? 0) + 1)
  const matchOf = (a: string, b: string) => g.matches.find((m) => (m.aId === a && m.bId === b) || (m.aId === b && m.bId === a))

  ctx.save()
  roundRect(ctx, x, top, w, tableH, 8)
  ctx.fillStyle = C.card
  ctx.fill()
  ctx.clip()

  // Encabezado: Jugador · 1 2 3 … · PG
  ctx.fillStyle = "#eef1eb"
  ctx.fillRect(x, top, w, GR.hdrH)
  ctx.textBaseline = "middle"
  ctx.fillStyle = C.muted
  ctx.font = `700 15px ${f.sans}`
  const hMid = top + GR.hdrH / 2
  ctx.textAlign = "left"
  ctx.fillText("JUGADOR", x + GR.posW, hMid)
  ctx.textAlign = "center"
  for (let c = 0; c < n; c++) ctx.fillText(`${c + 1}`, cellX(c) + GR.cellW / 2, hMid)
  ctx.fillText("PG", pgX + GR.pgW / 2, hMid)

  g.rows.forEach((row, r) => {
    const ry = top + GR.hdrH + r * rowH
    const mid = ry + rowH / 2
    const qualifies = started && r < g.qualifies
    ctx.fillStyle = C.divider
    ctx.fillRect(x, ry, w, 1)
    if (qualifies) {
      ctx.fillStyle = C.clay
      ctx.fillRect(x, ry, 5, rowH)
    }
    // Posición + nombre
    ctx.textAlign = "center"
    ctx.fillStyle = C.muted
    ctx.font = `700 16px ${f.sans}`
    ctx.fillText(`${r + 1}`, x + GR.posW / 2 + 2, mid)
    ctx.textAlign = "left"
    ctx.fillStyle = C.text
    ctx.fillText(fitName(ctx, row.name, nameW - 10, qualifies ? 700 : 500, 19, f.sans, 12), x + GR.posW, mid)

    // Celdas contra cada rival
    g.rows.forEach((col, c) => {
      const cx = cellX(c)
      ctx.fillStyle = C.divider
      ctx.fillRect(cx, ry, 1, rowH)
      if (c === r) {
        ctx.fillStyle = "#e3e8df"
        ctx.fillRect(cx + 1, ry + 1, GR.cellW - 1, rowH - 1)
        return
      }
      const m = matchOf(row.id, col.id)
      const cMid = cx + GR.cellW / 2
      ctx.textAlign = "center"
      if (!m || !m.winnerId) {
        ctx.fillStyle = "#b5bfb7"
        ctx.font = `500 16px ${f.sans}`
        ctx.fillText("–", cMid, mid)
        return
      }
      const won = m.winnerId === row.id
      if (won) {
        ctx.fillStyle = "rgba(212, 98, 42, 0.12)"
        ctx.fillRect(cx + 1, ry + 1, GR.cellW - 1, rowH - 1)
      }
      ctx.fillStyle = won ? C.text : C.muted
      const text = m.isWalkover ? "W.O." : m.score ? (m.aId === row.id ? m.score : flipScore(m.score)) : ""
      const sets = text.split(/\s+/)
      const lines = sets.length > 2 ? [sets.slice(0, 2).join(" "), sets.slice(2).join(" ")] : [text]
      const size = lines.length > 1 ? 14 : 15
      ctx.font = `${won ? 700 : 500} ${size}px ${f.sans}`
      lines.forEach((line, li) => {
        const ly = mid + (li - (lines.length - 1) / 2) * (size + 3)
        ctx.fillText(fit(ctx, line, GR.cellW - 6), cMid, ly)
      })
    })

    // Partidos ganados
    ctx.fillStyle = C.divider
    ctx.fillRect(pgX, ry, 1, rowH)
    ctx.textAlign = "center"
    ctx.fillStyle = C.text
    ctx.font = `700 20px ${f.sans}`
    ctx.fillText(`${wins.get(row.id) ?? 0}`, pgX + GR.pgW / 2, mid)
  })
  ctx.restore()
  ctx.textAlign = "left"

  // Leyenda debajo de la tabla
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "rgba(244, 246, 242, 0.75)"
  ctx.font = `500 14px ${f.sans}`
  let parts = legend
  while (parts.length > 1 && ctx.measureText(parts.join(" · ")).width > w) parts = parts.slice(0, -1)
  ctx.fillText(fit(ctx, parts.join(" · "), w), x, top + tableH + 22)
}

interface GroupStageOptions {
  data: GroupStageExport
  title: string
  subtitle: string
  championLabel: string
  format: IgFormat
}

export async function renderGroupStageJpeg({ data, title, subtitle, championLabel, format }: GroupStageOptions): Promise<Blob> {
  const { canvas, ctx, area, fonts } = await setupCanvas(format, title, subtitle)
  const { groups, knockout } = data

  const natW = groups.reduce((sum, g) => sum + groupNaturalW(g), 0) + GR.gap * (groups.length - 1)
  const maxRows = Math.max(...groups.map((g) => g.rows.length))
  const natH = Math.max(...groups.map((g) => groupNaturalH(g)))
  const blockGap = 30
  const champH = 116
  const legendFor = (g: GroupTable) => [
    `${g.played} de ${g.total} partidos jugados`,
    ...(knockout ? [`Clasifican los ${g.qualifies} primeros`] : []),
    "PG: partidos ganados",
  ]

  // Escala común para grupos y cuadro, así los textos quedan del mismo tamaño.
  const below = knockout ? bracketDims(knockout) : null
  const belowW = below ? below.minW : 300
  const belowH = below ? below.minH : champH
  const s = Math.min(area.w / natW, area.w / belowW, area.h / (natH + blockGap + belowH), 2)

  // El alto que sobra va primero a filas más altas en los grupos (hasta
  // +60%). Con cuadro abajo, el resto es para el cuadro (que puede agrandarse
  // un poco más que los grupos); sin cuadro, se centra todo en vertical.
  let spare = area.h / s - (natH + blockGap + belowH)
  const rowExtra = Math.min(spare / maxRows, GR.rowH * 0.6)
  const rowH = GR.rowH + Math.max(rowExtra, 0)
  spare -= (rowH - GR.rowH) * maxRows
  const groupsH = Math.max(...groups.map((g) => groupNaturalH(g, rowH)))
  const top = knockout ? area.y : area.y + (Math.max(spare, 0) * s) / 2

  // Grupos: el ancho sobrante se reparte en la columna de nombres.
  const innerW = area.w / s
  const extra = (innerW - natW) / groups.length
  ctx.save()
  ctx.translate(area.x, top)
  ctx.scale(s, s)
  let gx = 0
  for (const g of groups) {
    const w = groupNaturalW(g) + extra
    drawGroup(ctx, g, gx, 0, w, rowH, legendFor(g), fonts)
    gx += w + GR.gap
  }
  ctx.restore()

  const groupsBottom = top + (groupsH + blockGap) * s
  if (knockout) {
    drawBracket(ctx, knockout, { x: area.x, y: groupsBottom, w: area.w, h: area.y + area.h - groupsBottom }, {
      championLabel,
      placeholders: data.placeholders,
      maxScale: s * 1.4,
      maxStretch: 1.4,
      fonts,
    })
  } else {
    // Sin final (5 inscriptos): el campeón es el 1º del grupo.
    const w = Math.min(area.w / s, 420)
    ctx.save()
    ctx.translate(area.x + (area.w - w * s) / 2, groupsBottom)
    ctx.scale(s, s)
    drawChampionCard(ctx, { x: 0, y: 0, w, h: champH }, data.champion, null, championLabel, fonts)
    ctx.restore()
  }
  return toJpeg(canvas)
}
