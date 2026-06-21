import { createClient } from "@supabase/supabase-js"

// Cliente con service_role — bypasea RLS. Solo usar en server (nunca en browser).
// SUPABASE_SERVICE_ROLE_KEY nunca debe llegar al cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
