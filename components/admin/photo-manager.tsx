"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type AdminTournamentOption,
  type AdminCategoryOption,
  getCategoriesForPhotoAdmin,
  getPhotosForAdmin,
  uploadTournamentPhotos,
  deleteTournamentPhoto,
  reorderTournamentPhotos,
} from "@/app/actions/admin"
import type { TournamentPhoto } from "@/lib/data/tournament-photos"

const GENERAL_VALUE = "__general__"

export function PhotoManager({ tournaments }: { tournaments: AdminTournamentOption[] }) {
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "")
  const [categories, setCategories] = useState<AdminCategoryOption[]>([])
  const [categoryValue, setCategoryValue] = useState(GENERAL_VALUE)
  const [photos, setPhotos] = useState<TournamentPhoto[]>([])
  const [caption, setCaption] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categoryId = categoryValue === GENERAL_VALUE ? null : categoryValue

  useEffect(() => {
    if (!tournamentId) return
    startTransition(async () => {
      const cats = await getCategoriesForPhotoAdmin(tournamentId)
      setCategories(cats)
    })
  }, [tournamentId])

  useEffect(() => {
    if (!tournamentId) return
    startTransition(async () => {
      const data = await getPhotosForAdmin(tournamentId, categoryId)
      setPhotos(data)
    })
  }, [tournamentId, categoryId])

  function handleTournamentChange(id: string) {
    setTournamentId(id)
    setCategoryValue(GENERAL_VALUE)
  }

  function handleUpload() {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) {
      setError("Elegí al menos una foto")
      return
    }

    const formData = new FormData()
    formData.set("tournamentId", tournamentId)
    formData.set("categoryId", categoryId ?? "")
    formData.set("caption", caption)
    Array.from(files).forEach((file) => formData.append("files", file))

    setError(null)
    startTransition(async () => {
      const result = await uploadTournamentPhotos(formData)
      if (!result.success) {
        setError(result.error ?? "No se pudo subir la foto")
        return
      }
      setCaption("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      const data = await getPhotosForAdmin(tournamentId, categoryId)
      setPhotos(data)
    })
  }

  function handleDelete(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await deleteTournamentPhoto(id)
      if (!result.success) {
        setError(result.error ?? "No se pudo borrar la foto")
        return
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    })
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return

    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    setPhotos(next)

    setError(null)
    startTransition(async () => {
      const result = await reorderTournamentPhotos(next.map((p) => p.id))
      if (!result.success) setError(result.error ?? "No se pudo reordenar")
    })
  }

  if (tournaments.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay temporadas cargadas.</p>
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="size-4" />
            Fotos de premiación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Temporada</Label>
              <Select value={tournamentId} onValueChange={(v) => { if (v) handleTournamentChange(v) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Categoría</Label>
              <Select value={categoryValue} onValueChange={(v) => { if (v) setCategoryValue(v) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL_VALUE}>General (toda la edición)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label className="mb-1.5 block text-xs">Fotos</Label>
              <Input ref={fileInputRef} type="file" accept="image/*" multiple />
            </div>
            <Button type="button" onClick={handleUpload} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Subir
            </Button>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Epígrafe (opcional, se aplica a todas las que subas ahora)</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej: Final de Caballeros A" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay fotos cargadas para esta selección.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="overflow-hidden rounded-xl border border-border bg-white">
              <div className="relative aspect-square w-full">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={index === 0 || isPending}
                    onClick={() => handleMove(index, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={index === photos.length - 1 || isPending}
                    onClick={() => handleMove(index, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-7 text-red-600 hover:text-red-700"
                  disabled={isPending}
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
