// Dibuja el cuadro de una categoría del Final Master (zonas A/B, semifinales
// y final) en un <canvas> con medidas de Instagram y lo devuelve como JPEG.
// Mismas reglas que la exportación del mensual (exportBracketImage.ts): se
// dibuja a mano, no depende del DOM ni del tema, paleta fija (aquí la de
// "Especiales", tokens --color-mm-* de app/globals.css) y todo entra completo
// en el formato elegido. Solo corre en el navegador (panel).
//
// La lógica (filas, textos, layout, nombres con "A confirmar") es pura y está
// en lib/final-master/exportImage.ts.

import {
  IG_FORMATS,
  fontFamily,
  loadImage,
  roundRect,
  toJpeg,
  type IgFormat,
} from "@/components/admin/circuito/exportBracketImage"
import {
  FM,
  KO_CARD_H,
  fitPairName,
  planLayout,
  type FinalMasterExport,
  type KnockoutMatchExport,
  type KnockoutSideExport,
  type Measure,
  type ZoneExport,
} from "@/lib/final-master/exportImage"

// Paleta fija = tokens --color-mm-* de app/globals.css.
const C = {
  bg: "#0d0f0d",
  surface: "#161a15",
  surface2: "#1e2520",
  border: "#2a2f29",
  borderStrong: "#5b6258",
  gold: "#c9a84c",
  goldLight: "#e5c97a",
  goldMuted: "#6b5520",
  goldWash: "#1c1a10",
  text: "#f0ebe0",
  muted: "#a39e90",
  plaque: "#f0ebe0",
  win: "#7fcf8f",
}

interface Fonts {
  sans: string
  heading: string
  display: string
}

function measureWith(ctx: CanvasRenderingContext2D, family: string, weight: string | number): Measure {
  return (text, size, italic) => {
    ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${family}`
    return ctx.measureText(text).width
  }
}

// Escribe un nombre (single o pareja) dentro de maxWidth; "A confirmar" va en
// dorado e itálica y nunca se recorta. Deja textAlign "left".
function drawName(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: string | number,
  size: number,
  min: number,
  color: string,
  family: string,
) {
  const fitted = fitPairName(measureWith(ctx, family, weight), name, maxWidth, size, min)
  ctx.textAlign = "left"
  let cx = x
  for (const seg of fitted.segments) {
    ctx.font = `${seg.tbd ? "italic " : ""}${weight} ${fitted.size}px ${family}`
    ctx.fillStyle = seg.tbd ? C.gold : color
    ctx.fillText(seg.text, cx, y)
    cx += ctx.measureText(seg.text).width
  }
}

function fitLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

function sectionTitle(ctx: CanvasRenderingContext2D, label: string, x: number, w: number, baseY: number, f: Fonts) {
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = C.goldLight
  ctx.font = `700 24px ${f.heading}`
  ctx.fillText(label.toUpperCase(), x, baseY)
  ctx.fillStyle = C.goldMuted
  ctx.fillRect(x, baseY + 9, w, 2)
  ctx.fillStyle = C.gold
  ctx.fillRect(x, baseY + 9, 64, 2)
}

// Líneas de cancha decoradas (mismo trazo que components/mid-master/CourtLines.tsx).
function drawCourtLines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = (w * 260) / 600
  ctx.save()
  ctx.translate(x, y)
  const sx = w / 600
  ctx.scale(sx, sx)
  ctx.strokeStyle = C.goldMuted
  ctx.lineWidth = 2 / sx
  ctx.globalAlpha = 0.75
  ctx.strokeRect(0, 0, 600, 260)
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  line(0, 32, 600, 32)
  line(0, 228, 600, 228)
  line(300, 0, 300, 260)
  line(130, 32, 130, 228)
  line(470, 32, 470, 228)
  line(130, 130, 470, 130)
  ctx.restore()
  return h
}

async function setupCanvas(format: IgFormat, year: number, categoryName: string) {
  const { width: W, height: H } = IG_FORMATS[format]
  const sans = fontFamily("--font-barlow", "system-ui, sans-serif")
  const heading = fontFamily("--font-barlow-condensed", sans)
  const display = fontFamily("--font-playfair", "Georgia, serif")

  await Promise.all([
    document.fonts.load(`700 40px ${display}`),
    document.fonts.load(`700 24px ${heading}`),
    document.fonts.load(`800 40px ${heading}`),
    document.fonts.load(`400 20px ${sans}`),
    document.fonts.load(`500 20px ${sans}`),
    document.fonts.load(`700 20px ${sans}`),
  ]).catch(() => undefined)
  await document.fonts.ready.catch(() => undefined)
  const logo = await loadImage("/images/LOGO.png")

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("El navegador no permite generar la imagen.")
  const fonts: Fonts = { sans, heading, display }

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createLinearGradient(0, 0, 0, H * 0.35)
  glow.addColorStop(0, C.goldWash)
  glow.addColorStop(1, "rgba(13, 15, 13, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H * 0.35)
  // Marco dorado fino
  ctx.strokeStyle = C.goldMuted
  ctx.lineWidth = 2
  ctx.strokeRect(14, 14, W - 28, H - 28)

  // ---- Encabezado: logo + "Final Master {año}" + categoría
  const pad = 40
  const plaque = format === "square" ? 72 : 84
  const headTop = 40
  ctx.beginPath()
  ctx.arc(pad + plaque / 2, headTop + plaque / 2, plaque / 2, 0, Math.PI * 2)
  ctx.fillStyle = C.plaque
  ctx.fill()
  if (logo) {
    const li = plaque - 14
    ctx.drawImage(logo, pad + 7, headTop + 7, li, li)
  }
  const textX = pad + plaque + 22
  drawCourtLines(ctx, W - pad - 190, headTop - 6, 190)
  const textW = W - textX - pad - 200
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = C.muted
  ctx.font = `700 19px ${heading}`
  ctx.fillText("PARQUE TENIS CLUB · CIRCUITO DEL PARQUE", textX, headTop + 18)
  // Título en Playfair, achicado si no entra
  let ts = format === "square" ? 46 : 54
  const title = `Final Master ${year}`
  ctx.font = `700 ${ts}px ${display}`
  while (ts > 28 && ctx.measureText(title).width > textW + 160) {
    ts -= 2
    ctx.font = `700 ${ts}px ${display}`
  }
  ctx.fillStyle = C.text
  ctx.fillText(title, textX, headTop + 22 + ts)
  // Categoría en dorado
  let cs = 30
  ctx.font = `800 ${cs}px ${heading}`
  const cat = categoryName.toUpperCase()
  while (cs > 18 && ctx.measureText(cat).width > W - textX - pad) {
    cs -= 1
    ctx.font = `800 ${cs}px ${heading}`
  }
  ctx.fillStyle = C.gold
  const catBase = headTop + 22 + ts + 8 + cs
  ctx.fillText(cat, textX, catBase)

  const headerBottom = Math.max(headTop + plaque, catBase) + 22
  const area = { x: pad, y: headerBottom, w: W - pad * 2, h: H - headerBottom - pad }
  return { canvas, ctx, area, fonts }
}

// ---------------------------------------------------------------------------
// Zonas: tabla de posiciones (mismo orden y criterios que calculateZoneStandings).

const ZC = { pos: 46, pj: 58, pg: 58, pp: 58, sets: 84, dif: 72 }

function drawZone(ctx: CanvasRenderingContext2D, z: ZoneExport, y: number, rowH: number, f: Fonts): number {
  const x = 0
  const w = FM.natW
  sectionTitle(ctx, z.name, x, w, y + FM.zoneTitleH - 14, f)
  const top = y + FM.zoneTitleH
  const n = z.rows.length
  const tableH = FM.zoneHdrH + n * rowH
  const statsW = ZC.pj + ZC.pg + ZC.pp + ZC.sets + ZC.dif
  const colRight = (i: number) => {
    const widths = [ZC.pj, ZC.pg, ZC.pp, ZC.sets, ZC.dif]
    return w - statsW + widths.slice(0, i + 1).reduce((a, b) => a + b, 0) - 10
  }

  ctx.save()
  roundRect(ctx, x, top, w, tableH, 8)
  ctx.fillStyle = C.surface
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = C.surface2
  ctx.fillRect(x, top, w, FM.zoneHdrH)
  ctx.textBaseline = "middle"
  ctx.fillStyle = C.muted
  ctx.font = `700 15px ${f.sans}`
  const hMid = top + FM.zoneHdrH / 2
  ctx.textAlign = "left"
  ctx.fillText("JUGADOR", x + ZC.pos, hMid)
  ctx.textAlign = "right"
  ;["PJ", "PG", "PP", "SETS", "DIF G"].forEach((h, i) => ctx.fillText(h, colRight(i), hMid))

  z.rows.forEach((r, i) => {
    const ry = top + FM.zoneHdrH + i * rowH
    const mid = ry + rowH / 2
    ctx.fillStyle = C.borderStrong
    ctx.fillRect(x, ry, w, 1)
    if (r.advances) {
      ctx.fillStyle = C.goldWash
      ctx.fillRect(x, ry + 1, w, rowH - 1)
      ctx.fillStyle = C.gold
      ctx.fillRect(x, ry + 1, 5, rowH - 1)
    }
    ctx.textBaseline = "middle"
    ctx.textAlign = "left"
    ctx.fillStyle = r.advances ? C.goldLight : C.muted
    ctx.font = `700 26px ${f.heading}`
    ctx.fillText(`${r.position}`, x + 18, mid)
    const nameRoom = w - statsW - ZC.pos - 14
    drawName(ctx, r.name, x + ZC.pos, mid, nameRoom, r.advances ? 700 : 500, 21, 12, C.text, f.sans)
    ctx.textAlign = "right"
    ctx.fillStyle = C.text
    ctx.font = `700 23px ${f.heading}`
    const dif = r.gamesDiff > 0 ? `+${r.gamesDiff}` : r.gamesDiff < 0 ? `−${Math.abs(r.gamesDiff)}` : "0"
    ;[`${r.played}`, `${r.won}`, `${r.lost}`, `${r.setsWon}-${r.setsLost}`, dif].forEach((t, c) => ctx.fillText(t, colRight(c), mid))
  })
  ctx.restore()

  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = C.muted
  ctx.font = `500 15px ${f.sans}`
  const parts = [
    `${z.playedCount} de ${z.totalCount} partidos jugados`,
    "Los 2 primeros pasan a semifinales",
    "PJ jugados · PG ganados · PP perdidos · DIF G diferencia de games",
  ]
  let shown = parts
  while (shown.length > 1 && ctx.measureText(shown.join("  ·  ")).width > w) shown = shown.slice(0, -1)
  ctx.fillText(fitLine(ctx, shown.join("  ·  "), w), x, top + tableH + 21)
  return top + tableH + FM.zoneLegendH
}

// ---------------------------------------------------------------------------
// Semifinales y final

function drawSide(ctx: CanvasRenderingContext2D, s: KnockoutSideExport, x: number, y: number, w: number, f: Fonts) {
  const mid = y + FM.koSideH / 2
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  if (s.isWinner) {
    ctx.fillStyle = C.gold
    ctx.fillRect(x, y, 5, FM.koSideH)
  }
  // Resultado a la derecha (un número por set, en columnas)
  const setW = 30
  const isWo = s.sets.length === 1 && s.sets[0] === "W.O."
  const isRaw = s.sets.length === 1 && s.sets[0].length > 2 && !isWo
  let right = x + w - 14
  ctx.textAlign = "right"
  ctx.fillStyle = s.isWinner ? C.goldLight : C.muted
  ctx.font = `700 22px ${f.heading}`
  if (isWo || isRaw) {
    ctx.font = `700 ${isWo ? 20 : 16}px ${f.sans}`
    ctx.fillText(s.sets[0], right, mid)
    right -= ctx.measureText(s.sets[0]).width + 12
  } else {
    for (let i = s.sets.length - 1; i >= 0; i--) {
      ctx.fillText(s.sets[i], right - 4, mid)
      right -= setW
    }
    if (s.sets.length > 0) right -= 6
  }
  const room = right - (x + 16)
  if (s.name) {
    drawName(ctx, s.name, x + 16, mid, room, s.isWinner ? 700 : 500, 21, 12, s.isWinner ? C.text : C.muted, f.sans)
  } else {
    ctx.textAlign = "left"
    ctx.fillStyle = C.muted
    ctx.font = `italic 500 18px ${f.sans}`
    ctx.fillText(fitLine(ctx, s.placeholder, room), x + 16, mid)
  }
}

function drawKoCard(ctx: CanvasRenderingContext2D, m: KnockoutMatchExport, x: number, y: number, w: number, isFinal: boolean, f: Fonts) {
  ctx.save()
  roundRect(ctx, x, y, w, KO_CARD_H, 8)
  ctx.fillStyle = C.surface
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = C.surface2
  ctx.fillRect(x, y, w, FM.koHeadH)
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  ctx.fillStyle = C.gold
  ctx.font = `700 21px ${f.heading}`
  ctx.fillText(m.label.toUpperCase(), x + 16, y + FM.koHeadH / 2)
  if (m.when) {
    ctx.textAlign = "right"
    ctx.fillStyle = C.muted
    ctx.font = `500 16px ${f.sans}`
    ctx.fillText(m.when, x + w - 14, y + FM.koHeadH / 2)
  }
  ctx.fillStyle = C.borderStrong
  ctx.fillRect(x, y + FM.koHeadH, w, 1)
  drawSide(ctx, m.a, x, y + FM.koHeadH, w, f)
  ctx.fillStyle = C.border
  ctx.fillRect(x, y + FM.koHeadH + FM.koSideH, w, 1)
  drawSide(ctx, m.b, x, y + FM.koHeadH + FM.koSideH, w, f)
  ctx.restore()
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, KO_CARD_H - 1, 8)
  ctx.lineWidth = isFinal ? 2 : 1
  ctx.strokeStyle = isFinal ? C.gold : C.borderStrong
  ctx.stroke()
}

function drawChampion(ctx: CanvasRenderingContext2D, champ: { label: string; name: string }, x: number, y: number, w: number, f: Fonts) {
  roundRect(ctx, x, y, w, FM.champH, 10)
  ctx.fillStyle = C.goldWash
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = C.gold
  ctx.stroke()
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = C.gold
  ctx.font = `700 20px ${f.heading}`
  ctx.fillText(`🏆 ${champ.label.toUpperCase()}`, x + 22, y + 34)
  drawName(ctx, champ.name, x + 22, y + 74, w - 44, 700, 36, 16, C.text, f.display)
}

interface Options {
  data: FinalMasterExport
  year: number
  categoryName: string
  format: IgFormat
}

export async function renderFinalMasterJpeg({ data, year, categoryName, format }: Options): Promise<Blob> {
  const { canvas, ctx, area, fonts } = await setupCanvas(format, year, categoryName)
  const plan = planLayout(area.w, area.h, data.zones.map((z) => z.rows.length), !!data.champion)

  ctx.save()
  ctx.translate(area.x + (area.w - FM.natW * plan.scale) / 2, area.y + plan.offsetY)
  ctx.scale(plan.scale, plan.scale)

  let y = 0
  data.zones.forEach((z, i) => {
    y = drawZone(ctx, z, y, plan.rowH, fonts)
    if (i < data.zones.length - 1) y += plan.zoneGap
  })
  y += plan.sectionGap

  sectionTitle(ctx, "Semifinales y final", 0, FM.natW, y + FM.koTitleH - 14, fonts)
  y += FM.koTitleH
  const colW = (FM.natW - 24) / 2
  drawKoCard(ctx, data.semis[0], 0, y, colW, false, fonts)
  drawKoCard(ctx, data.semis[1], colW + 24, y, colW, false, fonts)
  y += KO_CARD_H + plan.koGap
  const finalW = 580
  drawKoCard(ctx, data.final, (FM.natW - finalW) / 2, y, finalW, true, fonts)
  y += KO_CARD_H
  if (data.champion) {
    drawChampion(ctx, data.champion, (FM.natW - finalW) / 2, y + FM.champGap, finalW, fonts)
  }
  ctx.restore()
  return toJpeg(canvas)
}
