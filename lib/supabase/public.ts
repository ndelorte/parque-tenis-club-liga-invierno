import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Cliente anónimo SIN cookies, para lecturas de datos públicos (RLS
// `public_select_*`). Al no tocar `cookies()`, las páginas que lo usan pueden
// prerenderizarse y cachearse (ISR). Para escrituras o datos del panel usar
// `createClient` (server.ts) o `createAdminClient`.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
