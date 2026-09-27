import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname, relative } from "path"

// CLAUDE.md: "La tabla se calcula desde resultados" — mismo principio que
// standings_snapshot, aplicado a circuito_ranking_points (Sprint C5). Solo
// lib/data/circuito/ranking.ts puede escribirla; el resto del código la lee.

const ROOT = process.cwd()
const ALLOWED_WRITER = "lib/data/circuito/ranking.ts"
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

const WRITE_PATTERN =
  /from\(\s*["']circuito_ranking_points["']\s*\)[\s\S]{0,300}?\.(insert|upsert|update|delete)\(/g

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

describe("circuito_ranking_points write boundary", () => {
  it("solo lib/data/circuito/ranking.ts escribe circuito_ranking_points", () => {
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
      `circuito_ranking_points solo debe escribirse (insert/upsert/update/delete) desde ${ALLOWED_WRITER}, ` +
        `nunca calculada a mano en otro archivo. Ofensores: ${offenders.join(", ") || "ninguno"}`,
    ).toEqual([])
  })
})
