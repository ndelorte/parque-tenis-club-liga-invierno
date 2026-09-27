import type { User } from "@supabase/supabase-js"

type RoleMetadata = {
  role?: unknown
  roles?: unknown
}

function hasAdminRole(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return false

  const roles = metadata as RoleMetadata
  if (roles.role === "admin") return true
  if (Array.isArray(roles.roles)) return roles.roles.includes("admin")

  return false
}

// Solo app_metadata: ese campo lo escriben únicamente el service role y el
// dashboard de Supabase. user_metadata NO se usa a propósito — cualquier
// usuario logueado puede editar el suyo con supabase.auth.updateUser() y
// darse el rol admin a sí mismo.
export function isAdminUser(user: Pick<User, "app_metadata"> | null | undefined) {
  if (!user) return false

  return hasAdminRole(user.app_metadata)
}