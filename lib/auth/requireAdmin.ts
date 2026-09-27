import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/auth/admin"

// Guardia para server actions que escriben con la service role key (bypasea
// RLS). proxy.ts NO alcanza: una server action es un endpoint POST que se
// puede invocar desde cualquier ruta, y su id viaja en el JS público del
// cliente. Cada action que escribe tiene que llamar a esto primero.
// Separado de lib/auth/admin.ts porque ese archivo lo importa proxy.ts y
// tiene que seguir siendo puro (sin cliente de Supabase server).
export async function isRequestFromAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return isAdminUser(user)
}
