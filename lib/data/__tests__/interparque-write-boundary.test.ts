import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname, relative } from "path"

// ADR-006: los puntos de interparque_matches se calculan una única vez al
// cargar/corregir el score y nunca se editan a mano. Este test convierte
// esa regla en un check mecánico: solo app/actions/interparque.ts puede
// escribir interparque_matches (insert/update/delete).

const ROOT = process.cwd()
const ALLOWED_WRITER = "app/actions/interparque.ts"
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
  /from\(\s*["']interparque_matches["']\s*\)[\s\S]{0,300}?\.(insert|upsert|update|delete)\(/g

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

describe("interparque_matches write boundary", () => {
  it("solo app/actions/interparque.ts escribe interparque_matches", () => {
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
      `interparque_matches solo debe escribirse (insert/upsert/update/delete) desde ${ALLOWED_WRITER}, ` +
        `nunca calculado a mano en otro archivo. Ofensores: ${offenders.join(", ") || "ninguno"}`,
    ).toEqual([])
  })
})
