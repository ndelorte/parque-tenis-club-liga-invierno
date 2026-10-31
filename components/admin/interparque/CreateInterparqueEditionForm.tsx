"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createInterparqueEdition } from "@/app/actions/interparque"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { editionLabel, isSunday } from "@/lib/interparque/editions"

export function CreateInterparqueEditionForm({ nextNumber }: { nextNumber: number }) {
  const router = useRouter()
  const [startDate, setStartDate] = useState("")
  const [sundaysCount, setSundaysCount] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const notSunday = startDate !== "" && !isSunday(startDate)

  async function handleSubmit() {
    setLoading(true)
    setError("")
    const result = await createInterparqueEdition(startDate, sundaysCount)
    if (result.ok) {
      router.push(`/panel-interparque/${result.number}`)
      return
    }
    setLoading(false)
    setError(result.error)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Nueva edición</p>
      <p className="text-sm text-muted-foreground">Se va a crear la {editionLabel(nextNumber)}.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="interparque-edition-start">Primer domingo</Label>
          <Input
            id="interparque-edition-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-invalid={notSunday}
          />
          {notSunday && <p className="mt-1 text-sm text-loss">Elegí un domingo.</p>}
        </div>
        <div>
          <Label htmlFor="interparque-edition-count">Cantidad de domingos</Label>
          <Input
            id="interparque-edition-count"
            type="number"
            min={1}
            max={52}
            value={sundaysCount}
            onChange={(e) => setSundaysCount(Number(e.target.value))}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={loading || !startDate || notSunday}>
        {loading ? "Creando..." : "Crear edición"}
      </Button>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}
