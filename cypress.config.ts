import { defineConfig } from "cypress"
import { existsSync, readFileSync } from "node:fs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Año de las pruebas e2e: el server tiene que correr con FINAL_MASTER_YEAR=2099.
// GUARDA DURA: nunca se borra nada de un año real.
const MIN_E2E_YEAR = 2090
// Jugadores de prueba: prefijo inconfundible (el combobox solo lista active = true).
const E2E_PLAYER_PREFIX = "Zz E2E"

// Cypress 16 puede no exponer cypress.env.json en config.env: se lee también directo del archivo.
function fileEnv(): Record<string, unknown> {
  return existsSync("cypress.env.json") ? JSON.parse(readFileSync("cypress.env.json", "utf8")) : {}
}

function adminClient(cfgEnv: Record<string, unknown>): SupabaseClient {
  const env = { ...fileEnv(), ...cfgEnv }
  const url = (env.SUPABASE_URL as string) || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = (env.SUPABASE_SERVICE_ROLE_KEY as string) || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en cypress.env.json")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

function playerName(i: number): string {
  return `${E2E_PLAYER_PREFIX} ${String(i).padStart(2, "0")}`
}

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      on("task", {
        // Borra la edición final-master-<year> y todo lo que cuelga de ella.
        async cleanupFinalMaster(year: number) {
          if (!Number.isInteger(year) || year < MIN_E2E_YEAR) {
            throw new Error(`cleanupFinalMaster: año ${year} < ${MIN_E2E_YEAR}; se niega a borrar datos reales`)
          }
          const sb = adminClient(config.env)
          const slug = `final-master-${year}`
          const editions = check(await sb.from("mid_master_editions").select("id").eq("slug", slug), "editions") as { id: string }[]
          for (const ed of editions) {
            const cats = check(await sb.from("mid_master_categories").select("id").eq("edition_id", ed.id), "categories") as { id: string }[]
            const catIds = cats.map((c) => c.id)
            if (catIds.length > 0) {
              check(await sb.from("mid_master_matches").delete().in("category_id", catIds), "delete matches")
              check(await sb.from("mid_master_participants").delete().in("category_id", catIds), "delete participants")
              check(await sb.from("mid_master_groups").delete().in("category_id", catIds), "delete groups")
              check(await sb.from("mid_master_categories").delete().in("id", catIds), "delete categories")
            }
            check(await sb.from("mid_master_editions").delete().eq("id", ed.id), "delete edition")
          }
          return null
        },

        // Crea (si no existen) n jugadores activos "Zz E2E 01".. para el combobox.
        async ensureE2ePlayers(n: number) {
          const sb = adminClient(config.env)
          const names = Array.from({ length: n }, (_, i) => playerName(i + 1))
          const existing = check(await sb.from("players").select("display_name").in("display_name", names), "players") as { display_name: string }[]
          const have = new Set(existing.map((p) => p.display_name))
          const rows = names
            .filter((d) => !have.has(d))
            .map((d) => ({ first_name: "Zz", last_name: d.slice("Zz ".length), display_name: d, active: true }))
          if (rows.length > 0) check(await sb.from("players").insert(rows), "insert players")
          return null
        },

        // Borra los jugadores de prueba (solo prefijo "Zz E2E"). Si alguno está
        // referenciado en otra tabla (FK), no se puede borrar: se desactiva.
        async cleanupE2ePlayers() {
          const sb = adminClient(config.env)
          const rows = check(await sb.from("players").select("id").like("display_name", `${E2E_PLAYER_PREFIX} %`), "players") as { id: string }[]
          for (const { id } of rows) {
            const { error } = await sb.from("players").delete().eq("id", id)
            if (error) check(await sb.from("players").update({ active: false }).eq("id", id), "deactivate player")
          }
          return null
        },
      })
      return config
    },
  },
})
