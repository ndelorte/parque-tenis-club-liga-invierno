"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminTournamentOption } from "@/app/actions/admin"
import type { TournamentSponsor } from "@/lib/data/tournament-sponsors"
import { createSponsor, editSponsor, getSponsorsForAdmin, moveSponsors, removeSponsor } from "@/app/actions/sponsors"

export function SponsorManager({ tournaments }: { tournaments: AdminTournamentOption[] }) {
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "")
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tournamentId) return
    let current = true
    getSponsorsForAdmin(tournamentId).then((data) => {
      if (current) setSponsors(data)
    })
    return () => { current = false }
  }, [tournamentId])

  async function reload() {
    setSponsors(await getSponsorsForAdmin(tournamentId))
  }

  function handleCreate() {
    const file = fileRef.current?.files?.[0]
    if (!name.trim() || !file) {
      setError("Ingresá el nombre y elegí una imagen")
      return
    }
    const data = new FormData()
    data.set("tournamentId", tournamentId)
    data.set("name", name)
    data.set("file", file)
    setError(null)
    startTransition(async () => {
      const result = await createSponsor(data)
      if (!result.success) return setError(result.error ?? "No se pudo agregar el sponsor")
      setName("")
      if (fileRef.current) fileRef.current.value = ""
      await reload()
    })
  }

  function handleRemove(id: string) {
    if (!window.confirm("¿Eliminar este sponsor de la edición?")) return
    setError(null)
    startTransition(async () => {
      const result = await removeSponsor(id, tournamentId)
      if (!result.success) return setError(result.error ?? "No se pudo eliminar el sponsor")
      await reload()
    })
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= sponsors.length) return
    const next = [...sponsors]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSponsors(next)
    setError(null)
    startTransition(async () => {
      const result = await moveSponsors(tournamentId, next.map((sponsor) => sponsor.id))
      if (!result.success) {
        setError(result.error ?? "No se pudo cambiar el orden")
        await reload()
      }
    })
  }

  if (tournaments.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay ediciones cargadas.</p>
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-base">Sponsors por edición</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sponsor-edition" className="mb-1.5 block text-xs">Edición</Label>
            <select
              id="sponsor-edition"
              value={tournamentId}
              onChange={(event) => { setTournamentId(event.target.value); setSponsors([]); setError(null) }}
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name} {tournament.season} ({tournament.status === "active" ? "activa" : tournament.status === "finished" ? "finalizada" : "próxima"})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="sponsor-name" className="mb-1.5 block text-xs">Nombre de la marca</Label>
              <Input id="sponsor-name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="sponsor-image" className="mb-1.5 block text-xs">Logo</Label>
              <Input id="sponsor-image" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" />
            </div>
            <Button type="button" className="min-h-11" onClick={handleCreate} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Agregar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG o WebP de hasta 5 MB. Los sponsors cargados se muestran en el carrusel de la edición activa.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {sponsors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Esta edición todavía no tiene sponsors cargados.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sponsors.map((sponsor, index) => (
            <SponsorRow
              key={sponsor.id}
              sponsor={sponsor}
              isPending={isPending}
              first={index === 0}
              last={index === sponsors.length - 1}
              onMove={(direction) => handleMove(index, direction)}
              onRemove={() => handleRemove(sponsor.id)}
              onSaved={reload}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SponsorRow({ sponsor, isPending, first, last, onMove, onRemove, onSaved, onError }: {
  sponsor: TournamentSponsor
  isPending: boolean
  first: boolean
  last: boolean
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  onSaved: () => Promise<void>
  onError: (error: string | null) => void
}) {
  const [name, setName] = useState(sponsor.name)
  const [saving, startSaving] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    const data = new FormData()
    data.set("id", sponsor.id)
    data.set("tournamentId", sponsor.tournamentId)
    data.set("name", name)
    const file = fileRef.current?.files?.[0]
    if (file) data.set("file", file)
    onError(null)
    startSaving(async () => {
      const result = await editSponsor(data)
      if (!result.success) return onError(result.error ?? "No se pudo guardar el sponsor")
      if (fileRef.current) fileRef.current.value = ""
      await onSaved()
    })
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex h-32 items-center justify-center rounded-md bg-card p-3">
          <Image src={sponsor.image} alt={`Logo de ${sponsor.name}`} width={176} height={112} className="max-h-full w-auto object-contain" />
        </div>
        <Label htmlFor={`sponsor-name-${sponsor.id}`} className="sr-only">Nombre de la marca</Label>
        <Input id={`sponsor-name-${sponsor.id}`} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
        <Label htmlFor={`sponsor-file-${sponsor.id}`} className="text-xs">Reemplazar logo (opcional)</Label>
        <Input id={`sponsor-file-${sponsor.id}`} ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" className="min-h-11" onClick={handleSave} disabled={isPending || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
          </Button>
          <Button type="button" variant="outline" size="icon" className="size-11" aria-label={`Subir ${sponsor.name}`} disabled={first || isPending || saving} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></Button>
          <Button type="button" variant="outline" size="icon" className="size-11" aria-label={`Bajar ${sponsor.name}`} disabled={last || isPending || saving} onClick={() => onMove(1)}><ArrowDown className="size-4" /></Button>
          <Button type="button" variant="outline" size="icon" className="ml-auto size-11 text-destructive" aria-label={`Eliminar ${sponsor.name}`} disabled={isPending || saving} onClick={onRemove}><Trash2 className="size-4" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
