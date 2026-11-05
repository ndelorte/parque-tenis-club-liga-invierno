// Dibuja un cuadro (BracketTree) en un <canvas> con medidas de publicación de
// Instagram y lo devuelve como JPEG. Solo corre en el navegador (panel).
//
// Se dibuja a mano en canvas en vez de "sacarle foto" al DOM: así el resultado
// no depende del ancho de pantalla, del tema claro/oscuro ni del scroll
// horizontal del cuadro, y siempre entra completo en el formato elegido.

import type { BracketTree, BracketTreeMatch, BracketTreeSide } from "@/lib/circuito/bracketTree"

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

interface ExportOptions {
  tree: BracketTree
  title: string // p. ej. nombre de la edición
  subtitle: string // p. ej. categoría
  championLabel: string
  format: IgFormat
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

export async function renderBracketJpeg({ tree, title, subtitle, championLabel, format }: ExportOptions): Promise<Blob> {
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
  ctx.fillRect(0, 0, W, 14)

  // ---- Encabezado
  const pad = 56
  const logoSize = format === "square" ? 96 : 120
  const headTop = 52
  if (logo) ctx.drawImage(logo, pad, headTop, logoSize, logoSize)
  const textX = pad + (logo ? logoSize + 28 : 0)
  const textW = W - textX - pad
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = C.clayLight
  ctx.font = `700 26px ${heading}`
  ctx.fillText("CIRCUITO DEL PARQUE", textX, headTop + 30)
  ctx.fillStyle = C.boardFg
  const titleSize = fitFont(ctx, title.toUpperCase(), textW, "800", format === "square" ? 52 : 60, heading, 30)
  ctx.fillText(title.toUpperCase(), textX, headTop + 30 + titleSize)
  ctx.fillStyle = C.ball
  const subSize = fitFont(ctx, subtitle.toUpperCase(), textW, "700", format === "square" ? 34 : 40, heading, 22)
  ctx.fillText(subtitle.toUpperCase(), textX, headTop + 30 + titleSize + subSize + 6)

  const headerBottom = Math.max(headTop + logoSize, headTop + 30 + titleSize + subSize + 6) + 36

  // ---- Pie
  const footerH = 64
  ctx.fillStyle = "rgba(244, 246, 242, 0.7)"
  ctx.font = `600 22px ${sans}`
  ctx.textAlign = "center"
  ctx.fillText("Parque Tenis Club", W / 2, H - 34)
  ctx.textAlign = "left"

  // ---- Cuadro: se diseña en unidades "naturales" y se escala para que entre.
  const rounds = tree.rounds
  const R = rounds.length
  const n1 = Math.max(rounds[0]?.matches.length ?? 1, 1)
  const dense = n1 >= 8
  const sideH = dense ? 28 : 34
  const cardH = sideH * 2
  const slot = dense ? 72 : 92
  const gap = 34
  const champW = 230
  const headH = 44
  const naturalH = headH + n1 * slot

  const areaX = pad
  const areaY = headerBottom
  const areaW = W - pad * 2
  const areaH = H - headerBottom - footerH

  let s = Math.min(areaH / naturalH, 2)
  let colW = (areaW / s - champW - R * gap) / R
  if (colW < 170) {
    colW = 170
    s = Math.min(s, areaW / (R * (colW + gap) + champW))
  }
  colW = Math.min(colW, 330)
  const contentW = R * (colW + gap) + champW

  ctx.save()
  ctx.translate(areaX + (areaW - contentW * s) / 2, areaY + (areaH - naturalH * s) / 2)
  ctx.scale(s, s)

  const bodyTop = headH
  const bodyH = n1 * slot
  const colX = (ri: number) => ri * (colW + gap)
  const centerY = (ri: number, i: number) => {
    const n = rounds[ri].matches.length
    return bodyTop + (i + 0.5) * (bodyH / n)
  }

  // Encabezados de ronda
  const roundTitle = (label: string, x: number, w: number) => {
    ctx.fillStyle = C.boardFg
    ctx.font = `700 ${dense ? 20 : 22}px ${heading}`
    ctx.fillText(fit(ctx, label.toUpperCase(), w), x, headH - 16)
    ctx.fillStyle = C.clay
    ctx.fillRect(x, headH - 8, w, 3)
  }
  rounds.forEach((round, ri) => roundTitle(round.label, colX(ri), colW))
  roundTitle(championLabel, colX(R), champW)

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
  if (R > 0) {
    const y = centerY(R - 1, 0)
    ctx.beginPath()
    ctx.moveTo(colX(R - 1) + colW, y)
    ctx.lineTo(colX(R), y)
    ctx.stroke()
  }

  // Partidos
  const nameSize = dense ? 15 : 17
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
      ctx.fillStyle = C.muted
      ctx.font = `italic 400 ${nameSize - 1}px ${sans}`
      ctx.fillText("Por definir", x + 12, mid)
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
      ctx.font = `700 ${nameSize - 1}px ${sans}`
      ctx.fillStyle = C.text
      const sw = ctx.measureText(score).width
      ctx.fillText(score, right - sw, mid)
      right -= sw + 10
    }
    ctx.fillStyle = isWinner || !m.winnerId ? C.text : C.muted
    ctx.font = `${isWinner ? 700 : 500} ${nameSize}px ${sans}`
    ctx.fillText(fit(ctx, side.name, right - nx), nx, mid)
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

  // Campeón
  {
    const x = colX(R)
    const h = dense ? 120 : 140
    const y = (R > 0 ? centerY(R - 1, 0) : bodyTop + bodyH / 2) - h / 2
    roundRect(ctx, x, y, champW, h, 8)
    if (tree.champion) {
      ctx.fillStyle = C.boardDeep
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = C.ball
      ctx.stroke()
      ctx.textBaseline = "alphabetic"
      ctx.fillStyle = C.ball
      ctx.font = `700 18px ${heading}`
      ctx.fillText("🏆", x + 18, y + 34)
      ctx.fillStyle = C.boardFg
      const size = fitFont(ctx, tree.champion.name, champW - 36, "800", 34, heading, 18)
      ctx.fillText(tree.champion.name, x + 18, y + 40 + size)
      if (tree.finalScore) {
        ctx.fillStyle = "rgba(244, 246, 242, 0.8)"
        ctx.font = `500 16px ${sans}`
        ctx.fillText(`Final: ${tree.finalScore}`, x + 18, y + h - 18)
      }
    } else {
      ctx.setLineDash([8, 6])
      ctx.lineWidth = 2
      ctx.strokeStyle = C.line
      ctx.stroke()
      ctx.setLineDash([])
      ctx.textBaseline = "middle"
      ctx.fillStyle = C.boardFg
      ctx.font = `800 30px ${heading}`
      ctx.fillText("POR DEFINIR", x + 18, y + h / 2)
    }
  }
  ctx.restore()

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen."))), "image/jpeg", 0.92),
  )
}
