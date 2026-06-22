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

export function isAdminUser(user: Pick<User, "app_metadata" | "user_metadata"> | null | undefined) {
  if (!user) return false

  return hasAdminRole(user.user_metadata) || hasAdminRole(user.app_metadata)
}