"use client"

import { useState } from "react"
import { createCircuitoEditionAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function CreateEditionForm() {
  const now = new Date()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setLoading(true)
    setError("")
    const result = await createCircuitoEditionAction(slug, name, month, year)
    setLoading(false)
    if (result.ok) {
      setName("")
      setSlug("")
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Nueva edición mensual</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="circuito-edition-name">Nombre</Label>
          <Input
            id="circuito-edition-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Roland Garros"
          />
        </div>
        <div>
          <Label htmlFor="circuito-edition-slug">Slug</Label>
          <Input
            id="circuito-edition-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ej: roland-garros-2026-05"
          />
        </div>
        <div>
          <Label htmlFor="circuito-edition-month">Mes</Label>
          <select
            id="circuito-edition-month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="circuito-edition-year">Año</Label>
          <Input
            id="circuito-edition-year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={loading || !name.trim() || !slug.trim()}>
        {loading ? "Creando..." : "Crear edición"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
