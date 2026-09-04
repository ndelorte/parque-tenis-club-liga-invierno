import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname, relative } from "path"

// CLAUDE.md: "La tabla se calcula desde resultados — nunca editar puntos
// manualmente en standings_snapshot. Siempre recalcular desde series y
// court_matches." Este test convierte esa regla en un check mecánico:
// solo lib/data/standings.ts puede escribir standings_snapshot.

const ROOT = process.cwd()
const ALLOWED_WRITER = "lib/data/standings.ts"
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".vercel",
  "public",
  "product",
])
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])

// Une ".from('standings_snapshot')" con el próximo método de escritura del
// mismo chain, permitiendo que estén separados por saltos de línea.
const WRITE_PATTERN =
  /from\(\s*["']standings_snapshot["']\s*\)[\s\S]{0,300}?\.(insert|upsert|update|delete)\(/g

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, files)
    } else if (SOURCE_EXTENSIONS.has(extname(full))) {
      files.push(full)
    }
  }
  return files
}

describe("standings_snapshot write boundary", () => {
  it("solo lib/data/standings.ts escribe standings_snapshot", () => {
    const offenders: string[] = []

    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file).split("\\").join("/")
      if (rel === ALLOWED_WRITER) continue
      if (rel.includes("__tests__")) continue

      const content = readFileSync(file, "utf-8")
      WRITE_PATTERN.lastIndex = 0
      if (WRITE_PATTERN.test(content)) {
        offenders.push(rel)
      }
    }

    expect(
      offenders,
      `standings_snapshot solo debe escribirse (insert/upsert/update/delete) desde ${ALLOWED_WRITER}, ` +
        `nunca calculada a mano en otro archivo. Ofensores: ${offenders.join(", ") || "ninguno"}`,
    ).toEqual([])
  })
})
