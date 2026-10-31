"use client"

import { useState } from "react"
import { updateInterparqueEdition } from "@/app/actions/interparque"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSunday } from "@/lib/interparque/editions"
import type { InterparqueEdition } from "@/lib/data/interparque"

export function EditionSettingsForm({ edition }: { edition: InterparqueEdition }) {
  const [startDate, setStartDate] = useState(edition.start_date)
  const [sundaysCount, setSundaysCount] = useState(edition.sundays_count)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const notSunday = startDate !== "" && !isSunday(startDate)

  async function handleSubmit() {
    setLoading(true)
    setError("")
    setSuccess("")
    const result = await updateInterparqueEdition(edition.id, startDate, sundaysCount)
    setLoading(false)
    if (result.ok) setSuccess("Edición guardada.")
    else setError(result.error)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="interparque-settings-start">Primer domingo</Label>
          <Input
            id="interparque-settings-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-invalid={notSunday}
          />
          {notSunday && <p className="mt-1 text-sm text-loss">Elegí un domingo.</p>}
        </div>
        <div>
          <Label htmlFor="interparque-settings-count">Cantidad de domingos</Label>
          <Input
            id="interparque-settings-count"
            type="number"
            min={1}
            max={52}
            value={sundaysCount}
            onChange={(e) => setSundaysCount(Number(e.target.value))}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={loading || !startDate || notSunday}>
        {loading ? "Guardando..." : "Guardar edición"}
      </Button>
      {(error || success) && (
        <p className={`text-sm ${error ? "text-loss" : "text-win"}`}>{error || success}</p>
      )}
    </div>
  )
}
