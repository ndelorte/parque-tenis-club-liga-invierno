// Estampa los logos de la Liga de Invierno y de Verano, chicos, arriba a la
// derecha de cada página del reglamento (salvo la portada).
//
// Chrome no dibuja imágenes en los márgenes de página (@page @top-right), así
// que los logos se agregan después de generar el PDF. Lo llama
// scripts/build-reglamento-pdf.sh; uso suelto:
//   node scripts/stamp-reglamento-logos.mjs public/reglamento-liga.pdf

import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument } from "pdf-lib"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const pdfPath = process.argv[2] ?? join(ROOT, "public/reglamento-liga.pdf")

const MM = 72 / 25.4 // puntos PDF por milímetro
const SIZE = 11 * MM // lado de cada logo
const GAP = 2.5 * MM // separación entre logos
const RIGHT = 20 * MM // igual al margen derecho del HTML
const TOP = 7 * MM // distancia desde el borde superior de la hoja

const pdf = await PDFDocument.load(await readFile(pdfPath))
const [invierno, verano] = await Promise.all([
  readFile(join(ROOT, "public/images/logoligadeinvierno.png")).then((b) => pdf.embedPng(b)),
  readFile(join(ROOT, "public/images/logoligaverano.png")).then((b) => pdf.embedPng(b)),
])

const pages = pdf.getPages()
pages.slice(1).forEach((page) => {
  const { width, height } = page.getSize()
  const y = height - TOP - SIZE
  const xVerano = width - RIGHT - SIZE
  page.drawImage(invierno, { x: xVerano - GAP - SIZE, y, width: SIZE, height: SIZE })
  page.drawImage(verano, { x: xVerano, y, width: SIZE, height: SIZE })
})

await writeFile(pdfPath, await pdf.save())
console.log(`Logos estampados en ${pages.length - 1} páginas: ${pdfPath}`)
