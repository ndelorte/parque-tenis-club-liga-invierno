import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"

const BUCKET = "premiaciones"

type PhotoRow = Database["public"]["Tables"]["tournament_photos"]["Row"]

export type TournamentPhoto = {
  id: string
  tournamentId: string
  categoryId: string | null
  caption: string | null
  sortOrder: number
  url: string
}

function buildPublicUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

function mapPhotoRow(row: PhotoRow): TournamentPhoto {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    categoryId: row.category_id,
    caption: row.caption,
    sortOrder: row.sort_order,
    url: buildPublicUrl(row.storage_path),
  }
}

// Lectura pública: todas las fotos de una edición, o de una categoría puntual
// (categoryId === null trae las fotos generales de la edición).
export async function getPhotos(
  tournamentId: string,
  categoryId?: string | null,
): Promise<TournamentPhoto[]> {
  const supabase = await createClient()

  let query = supabase
    .from("tournament_photos")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("sort_order")

  if (categoryId !== undefined) {
    query = categoryId === null ? query.is("category_id", null) : query.eq("category_id", categoryId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as PhotoRow[]).map(mapPhotoRow)
}

export async function addPhoto(params: {
  tournamentId: string
  categoryId: string | null
  file: File
  caption?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const ext = params.file.name.split(".").pop()?.toLowerCase() || "jpg"
  const storagePath = `${params.tournamentId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, params.file, { contentType: params.file.type })

  if (uploadError) return { success: false, error: uploadError.message }

  const { count } = await supabase
    .from("tournament_photos")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", params.tournamentId)
    .is("category_id", params.categoryId ?? null)

  const { error: insertError } = await supabase.from("tournament_photos").insert({
    tournament_id: params.tournamentId,
    category_id: params.categoryId,
    storage_path: storagePath,
    caption: params.caption || null,
    sort_order: count ?? 0,
  })

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

export async function deletePhoto(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { data: photo } = await supabase
    .from("tournament_photos")
    .select("storage_path")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("tournament_photos").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  if (photo) {
    await supabase.storage.from(BUCKET).remove([(photo as { storage_path: string }).storage_path])
  }

  return { success: true }
}

// Recibe la lista completa de ids del grupo (misma edición + misma
// categoría/general) ya en el orden deseado y persiste el `sort_order`.
export async function reorderPhotos(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("tournament_photos")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])

    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}
