import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno. Asegurate de tener .env.local con:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL\n" +
        "  SUPABASE_SERVICE_ROLE_KEY",
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type AdminClient = ReturnType<typeof createAdminClient>
