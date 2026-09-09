/**
 * Test de esquema Mid Master contra Supabase real.
 * Ejecutar: npx tsx scripts/test-mm-schema.ts
 *
 * Testea cada columna y operación que usa el código sin modificar datos reales.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

// ── Cargar .env.local manualmente ────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8")
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const idx = trimmed.indexOf("=")
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
      process.env[key] = val
    }
  } catch {
    console.error("No se pudo leer .env.local")
    process.exit(1)
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAKE_UUID = "00000000-0000-0000-0000-000000000000"
let passed = 0
let failed = 0

function ok(label: string) {
  console.log(`  ✓  ${label}`)
  passed++
}

function fail(label: string, msg: string) {
  console.log(`  ✗  ${label}`)
  console.log(`       → ${msg}`)
  failed++
}

async function testRead(
  label: string,
  table: string,
  columns: string,
  filters?: Array<[string, unknown]>,
) {
  // Los filtros se aplican antes de `.limit()`: una vez que la query pasa
  // por un transform (limit/order) deja de exponer `.eq()` en el tipado.
  let query = sb.from(table).select(columns)
  for (const [col, val] of filters ?? []) {
    query = query.eq(col, val)
  }
  const { error } = await query.limit(1)
  if (error) fail(label, error.message)
  else ok(label)
}

async function testReadOrder(
  label: string,
  table: string,
  columns: string,
  orderCol: string,
  filters?: Array<[string, unknown]>,
) {
  let query = sb.from(table).select(columns)
  for (const [col, val] of filters ?? []) {
    query = query.eq(col, val)
  }
  const { error } = await query.order(orderCol, { ascending: true }).limit(1)
  if (error) fail(label, error.message)
  else ok(label)
}

// Escribe contra el fake UUID — nunca matchea filas reales pero
// valida que las columnas existan en el esquema de Supabase.
async function testWrite(
  label: string,
  table: string,
  payload: Record<string, unknown>,
) {
  const { error } = await sb
    .from(table)
    .update(payload)
    .eq("id", FAKE_UUID)
  if (error) fail(label, error.message)
  else ok(label)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n══════════════════════════════════════════")
  console.log("  Test de esquema Mid Master → Supabase")
  console.log("══════════════════════════════════════════\n")

  // ── mid_master_categories ──────────────────────────────────────────────────
  console.log("📋  mid_master_categories")

  await testRead(
    "SELECT id, name, slug, type, display_order, group_size, is_active",
    "mid_master_categories",
    "id, name, slug, type, display_order, group_size, is_active",
  )

  // ── mid_master_groups ──────────────────────────────────────────────────────
  console.log("\n📋  mid_master_groups")

  await testRead(
    "SELECT id, name, category_id, display_order",
    "mid_master_groups",
    "id, name, category_id, display_order",
  )

  await testRead(
    "SELECT id, name WHERE category_id = ? (para resolveKnockout)",
    "mid_master_groups",
    "id, name",
  )

  await testReadOrder(
    "ORDER BY name (usado en resolveKnockoutParticipants)",
    "mid_master_groups",
    "id, name",
    "name",
  )

  // ── mid_master_participants ────────────────────────────────────────────────
  console.log("\n📋  mid_master_participants")

  await testRead(
    "SELECT * (todos los campos)",
    "mid_master_participants",
    "*",
  )

  await testReadOrder(
    "SELECT * ORDER BY display_order (getMmParticipantsByCategory)",
    "mid_master_participants",
    "*",
    "display_order",
  )

  await testRead(
    "SELECT * WHERE category_id AND group_name (resolveKnockout)",
    "mid_master_participants",
    "*",
    [["group_name", "A"]],
  )

  await testWrite(
    "UPDATE { name } (updateMmParticipant)",
    "mid_master_participants",
    { name: "Test" },
  )

  // ── mid_master_matches ─────────────────────────────────────────────────────
  console.log("\n📋  mid_master_matches")

  await testRead(
    "SELECT * WHERE category_id (getMmMatchesByCategory)",
    "mid_master_matches",
    "*",
  )

  await testRead(
    "SELECT id, phase WHERE group_id IS NULL (resolveKnockout — koMatches)",
    "mid_master_matches",
    "id, phase",
    [["category_id", FAKE_UUID]],
  )

  await testReadOrder(
    "ORDER BY created_at (resolveKnockout — koMatches order)",
    "mid_master_matches",
    "id, phase",
    "created_at",
  )

  await testWrite(
    "UPDATE { scheduled_date, scheduled_time, status: 'scheduled' } (updateMmMatchSchedule)",
    "mid_master_matches",
    { scheduled_date: "2026-08-01", scheduled_time: "19:00", status: "scheduled" },
  )

  await testWrite(
    "UPDATE { scheduled_date: null, status: 'pending' } (schedule clear)",
    "mid_master_matches",
    { scheduled_date: null, scheduled_time: null, status: "pending" },
  )

  await testWrite(
    "UPDATE { score, winner_participant_id, status: 'played' } (updateMmMatchResult)",
    "mid_master_matches",
    { score: "6-4 6-2", winner_participant_id: FAKE_UUID, status: "played" },
  )

  await testWrite(
    "UPDATE { score: null, winner_participant_id: null, status: 'pending' } (clearMmMatchResult)",
    "mid_master_matches",
    { score: null, winner_participant_id: null, status: "pending" },
  )

  await testWrite(
    "UPDATE { participant_1_id, participant_2_id } (resolveKnockoutParticipants)",
    "mid_master_matches",
    { participant_1_id: FAKE_UUID, participant_2_id: FAKE_UUID },
  )

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════")
  console.log(`  Resultado: ${passed} ok, ${failed} errores`)
  console.log("══════════════════════════════════════════\n")

  if (failed > 0) process.exit(1)
}

run().catch((e) => {
  console.error("Error inesperado:", e)
  process.exit(1)
})
