import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

// Regla: la app escribe solo con el service role (createAdminClient()), que
// bypasea RLS. Ninguna tabla debe quedar con una policy de escritura
// (insert/update/delete/all) para anon, authenticated o public: con la anon
// key + un JWT cualquiera se podría escribir directo por PostgREST.
//
// El test recorre las migraciones en orden, registra cada `create policy` de
// escritura hacia esos roles y la saca cuando una migración posterior la
// dropea. Al final no tiene que quedar ninguna vigente.

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations")
const OPEN_ROLES = new Set(["anon", "authenticated", "public"])
const WRITE_CMDS = new Set(["insert", "update", "delete", "all"])

type Policy = { table: string; name: string; cmd: string; roles: string[]; file: string }

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "")
}

const IDENT = String.raw`(?:"([^"]+)"|([A-Za-z_][\w$]*))`
const TABLE = String.raw`(?:public\.)?${IDENT}`

const CREATE_RE = new RegExp(
  String.raw`create\s+policy\s+${IDENT}\s+on\s+${TABLE}` +
    String.raw`(?:\s+as\s+(?:permissive|restrictive))?` +
    String.raw`(?:\s+for\s+(all|select|insert|update|delete))?` +
    String.raw`(?:\s+to\s+([\w\s,"]+?))?(?=\s+using\b|\s+with\s+check\b|\s*;)`,
  "gi",
)
const DROP_RE = new RegExp(
  String.raw`drop\s+policy\s+(?:if\s+exists\s+)?${IDENT}\s+on\s+${TABLE}`,
  "gi",
)

function key(table: string, name: string) {
  return `${table.toLowerCase()}::${name}`
}

export function openWritePolicies(files: { name: string; sql: string }[]): Policy[] {
  const live = new Map<string, Policy>()

  for (const file of files) {
    const sql = stripComments(file.sql)
    const events: { at: number; apply: () => void }[] = []

    for (const m of sql.matchAll(CREATE_RE)) {
      const name = m[1] ?? m[2]
      const table = m[3] ?? m[4]
      const cmd = (m[5] ?? "all").toLowerCase()
      const roles = (m[6] ?? "public")
        .split(",")
        .map((r) => r.trim().replace(/"/g, "").toLowerCase())
        .filter(Boolean)
      if (!WRITE_CMDS.has(cmd) || !roles.some((r) => OPEN_ROLES.has(r))) continue
      events.push({
        at: m.index ?? 0,
        apply: () => live.set(key(table, name), { table, name, cmd, roles, file: file.name }),
      })
    }

    for (const m of sql.matchAll(DROP_RE)) {
      const name = m[1] ?? m[2]
      const table = m[3] ?? m[4]
      events.push({ at: m.index ?? 0, apply: () => live.delete(key(table, name)) })
    }

    events.sort((a, b) => a.at - b.at).forEach((e) => e.apply())
  }

  return [...live.values()]
}

function loadMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: readFileSync(path.join(MIGRATIONS_DIR, name), "utf8") }))
}

describe("RLS: sin policies de escritura para anon/authenticated", () => {
  const migrations = loadMigrations()

  it("ninguna policy de escritura abierta queda vigente al final de las migraciones", () => {
    const open = openWritePolicies(migrations).map((p) => `${p.file}: ${p.table}.${p.name} (${p.cmd} to ${p.roles.join(",")})`)
    expect(open).toEqual([])
  })

  it("el parser detecta las policies abiertas de 002/004/005/007/008 si no se dropean", () => {
    const sinCierres = migrations.filter(
      (m) => !m.name.startsWith("010_") && !m.name.startsWith("017_"),
    )
    const open = openWritePolicies(sinCierres)
    // 27 (002) + 8 (004) + 6 (005) + 3 (007) + 5 (008)
    expect(open).toHaveLength(49)
  })

  it("detecta una policy sin `to` (rol public por defecto) y respeta un drop posterior", () => {
    const files = [
      { name: "a.sql", sql: `create policy "x" on public.t for insert with check (true);` },
      { name: "b.sql", sql: `create policy "s" on public.t for select using (true);` },
    ]
    expect(openWritePolicies(files).map((p) => p.name)).toEqual(["x"])
    files.push({ name: "c.sql", sql: `drop policy if exists "x" on public.t;` })
    expect(openWritePolicies(files)).toEqual([])
  })

  it("ignora policies dentro de comentarios", () => {
    const files = [{ name: "a.sql", sql: `-- create policy "x" on public.t for all to authenticated using (true);` }]
    expect(openWritePolicies(files)).toEqual([])
  })
})
