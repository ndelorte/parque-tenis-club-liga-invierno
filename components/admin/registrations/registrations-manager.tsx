"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState, InlineError } from "@/components/admin/states"
import { RegistrationDetailView } from "@/components/admin/registrations/registration-detail"
import { updateRegistrationSettings } from "@/app/actions/liga-registrations"
import type {
  RegistrationListItem,
  RegistrationSettings,
  RegistrationStatus,
} from "@/app/actions/liga-registrations"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
}

const STATUS_CLASS: Record<RegistrationStatus, string> = {
  pending: "bg-brand-light text-brand",
  approved: "bg-win-soft text-foreground",
  rejected: "bg-loss-soft text-foreground",
}

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso))
}

function SettingsForm({ settings }: { settings: RegistrationSettings }) {
  const router = useRouter()
  const [open, setOpen] = useState(settings.open)
  const [deadline, setDeadline] = useState(settings.deadline ?? "")
  const [min, setMin] = useState(settings.min?.toString() ?? "")
  const [max, setMax] = useState(settings.max?.toString() ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSaved(false)
    const result = await updateRegistrationSettings({
      tournamentId: settings.tournamentId,
      open,
      deadline: deadline || null,
      min: min ? Number(min) : null,
      max: max ? Number(max) : null,
    })
    setPending(false)
    if (!result.success) return setError(result.error ?? "No se pudo guardar")
    setSaved(true)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de la inscripción</CardTitle>
        <p className="text-sm text-muted-foreground">{settings.tournamentName}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={open}
              onChange={(e) => setOpen(e.target.checked)}
              className="size-5 accent-[var(--color-brand,currentColor)]"
            />
            <span className="font-bold">Inscripción abierta</span>
          </label>
          <div className="grid gap-1.5">
            <Label htmlFor="reg-deadline">Fecha de cierre (opcional)</Label>
            <Input id="reg-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="min-h-11" />
            <p className="text-xs text-muted-foreground">Se puede inscribir hasta ese día inclusive.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="reg-min">Mínimo de jugadores</Label>
              <Input id="reg-min" type="number" min={1} max={50} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="min-h-11" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reg-max">Máximo de jugadores</Label>
              <Input id="reg-max" type="number" min={1} max={50} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} className="min-h-11" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending} className="min-h-11 px-5 font-bold">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Guardar configuración
            </Button>
            {saved && <p role="status" className="text-sm font-semibold">Guardado</p>}
          </div>
          {error && <InlineError className="sm:col-span-2">{error}</InlineError>}
        </form>
      </CardContent>
    </Card>
  )
}

export function RegistrationsManager({
  settings,
  registrations,
}: {
  settings: RegistrationSettings | null
  registrations: RegistrationListItem[]
}) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)

  if (!settings) {
    return (
      <EmptyState title="Sin edición activa">
        Para recibir inscripciones tiene que haber una edición en juego. Aplicá el seed de la edición y recargá.
      </EmptyState>
    )
  }

  const pendingCount = registrations.filter((r) => r.status === "pending").length

  return (
    <div className="grid gap-6">
      <SettingsForm settings={settings} />

      <section aria-labelledby="reg-list-title" className="grid gap-3">
        <h2 id="reg-list-title" className="font-heading text-2xl font-extrabold uppercase">
          Solicitudes{pendingCount > 0 && ` (${pendingCount} pendientes)`}
        </h2>
        {registrations.length === 0 ? (
          <EmptyState title="Todavía no hay solicitudes">Cuando alguien se inscriba desde la web, aparece acá.</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {registrations.map((r) => {
              const expanded = openId === r.id
              const panelId = `reg-detail-${r.id}`
              return (
                <li key={r.id} className="rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpenId(expanded ? null : r.id)}
                    className="flex min-h-11 w-full items-center gap-3 p-3.5 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{r.teamName}</span>
                      <span className="block text-sm text-muted-foreground">
                        {r.categoryName} · {r.playersCount} jugadores · Capitán: {r.captainName} · {r.captainPhone}
                      </span>
                      <span className="block text-xs text-muted-foreground">{formatCreatedAt(r.createdAt)}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", STATUS_CLASS[r.status])}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {expanded ? <ChevronUp className="size-5 shrink-0" aria-hidden /> : <ChevronDown className="size-5 shrink-0" aria-hidden />}
                  </button>
                  {expanded && (
                    <div id={panelId} className="border-t border-border p-3.5">
                      <RegistrationDetailView
                        registrationId={r.id}
                        onChanged={() => {
                          router.refresh()
                        }}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
