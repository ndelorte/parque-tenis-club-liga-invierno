import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"

const BUCKET = "liga-sponsors"
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

type SponsorRow = Database["public"]["Tables"]["tournament_sponsors"]["Row"]

export type TournamentSponsor = {
  id: string
  tournamentId: string
  name: string
  image: string
  sortOrder: number
}

function sponsorFromRow(row: SponsorRow): TournamentSponsor {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    image: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${row.storage_path}`,
    sortOrder: row.sort_order,
  }
}

export async function getTournamentSponsors(tournamentId: string): Promise<TournamentSponsor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tournament_sponsors")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("sort_order")
    .order("created_at")

  if (error || !data) return []
  return data.map(sponsorFromRow)
}

export async function validateSponsorImage(file: File): Promise<string | null> {
  if (!IMAGE_EXTENSIONS[file.type]) return "Usá una imagen PNG, JPG o WebP"
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return "La imagen debe pesar menos de 5 MB"
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isPng = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
  const isJpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const isWebp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (!(file.type === "image/png" && isPng ||
        file.type === "image/jpeg" && isJpeg ||
        file.type === "image/webp" && isWebp)) {
    return "El archivo no coincide con un PNG, JPG o WebP válido"
  }
  return null
}

export async function addTournamentSponsor(params: {
  tournamentId: string
  name: string
  file: File
}): Promise<{ success: boolean; error?: string }> {
  const name = params.name.trim()
  if (!name || name.length > 100) return { success: false, error: "El nombre debe tener entre 1 y 100 caracteres" }
  const imageError = await validateSponsorImage(params.file)
  if (imageError) return { success: false, error: imageError }

  const supabase = createAdminClient()
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", params.tournamentId)
    .single()
  if (tournamentError || !tournament) return { success: false, error: "Edición inexistente" }

  const { data: existing, error: listError } = await supabase
    .from("tournament_sponsors")
    .select("sort_order")
    .eq("tournament_id", params.tournamentId)
    .order("sort_order", { ascending: false })
    .limit(1)
  if (listError) return { success: false, error: listError.message }

  const storagePath = `${params.tournamentId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[params.file.type]}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, params.file, { contentType: params.file.type })
  if (uploadError) return { success: false, error: uploadError.message }

  const { error: insertError } = await supabase.from("tournament_sponsors").insert({
    tournament_id: params.tournamentId,
    name,
    storage_path: storagePath,
    sort_order: ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1,
  })
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { success: false, error: insertError.message }
  }
  return { success: true }
}

export async function updateTournamentSponsor(params: {
  id: string
  tournamentId: string
  name: string
  file?: File
}): Promise<{ success: boolean; error?: string }> {
  const name = params.name.trim()
  if (!name || name.length > 100) return { success: false, error: "El nombre debe tener entre 1 y 100 caracteres" }
  if (params.file) {
    const imageError = await validateSponsorImage(params.file)
    if (imageError) return { success: false, error: imageError }
  }

  const supabase = createAdminClient()
  const { data: existing, error: lookupError } = await supabase
    .from("tournament_sponsors")
    .select("storage_path")
    .eq("id", params.id)
    .eq("tournament_id", params.tournamentId)
    .single()
  if (lookupError || !existing) return { success: false, error: "Sponsor inexistente" }

  let storagePath: string | undefined
  if (params.file) {
    storagePath = `${params.tournamentId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[params.file.type]}`
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, params.file, {
      contentType: params.file.type,
    })
    if (error) return { success: false, error: error.message }
  }

  const { error } = await supabase
    .from("tournament_sponsors")
    .update({ name, ...(storagePath ? { storage_path: storagePath } : {}) })
    .eq("id", params.id)
    .eq("tournament_id", params.tournamentId)
  if (error) {
    if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath])
    return { success: false, error: error.message }
  }
  if (storagePath) await supabase.storage.from(BUCKET).remove([existing.storage_path])
  return { success: true }
}

export async function deleteTournamentSponsor(
  id: string,
  tournamentId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tournament_sponsors")
    .delete()
    .eq("id", id)
    .eq("tournament_id", tournamentId)
    .select("storage_path")
    .single()
  if (error || !data) return { success: false, error: error?.message ?? "Sponsor inexistente" }
  await supabase.storage.from(BUCKET).remove([data.storage_path])
  return { success: true }
}

export async function reorderTournamentSponsors(
  tournamentId: string,
  orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tournament_sponsors")
    .select("id")
    .eq("tournament_id", tournamentId)
  if (error) return { success: false, error: error.message }
  const actualIds = (data ?? []).map((row) => row.id)
  if (actualIds.length !== orderedIds.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !actualIds.includes(id))) {
    return { success: false, error: "La lista de sponsors cambió; actualizá la página" }
  }
  for (const [sortOrder, id] of orderedIds.entries()) {
    const { error: updateError } = await supabase
      .from("tournament_sponsors")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("tournament_id", tournamentId)
    if (updateError) return { success: false, error: updateError.message }
  }
  return { success: true }
}
