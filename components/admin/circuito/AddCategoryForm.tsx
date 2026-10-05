"use client"

import { useState } from "react"
import { addCircuitoCategoryAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  editionId: string
  editionSlug: string
}

export function AddCategoryForm({ editionId, editionSlug }: Props) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"single" | "dobles">("single")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setLoading(true)
    setError("")
    const result = await addCircuitoCategoryAction(editionId, editionSlug, name, type)
    setLoading(false)
    if (result.ok) setName("")
    else setError(result.error)
  }

  return (
    <div className="mt-8 space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Agregar una categoría a este torneo</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <Label htmlFor="circuito-category-name">Nombre</Label>
          <Input
            id="circuito-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Caballeros Cuarta"
          />
        </div>
        <div>
          <Label htmlFor="circuito-category-type">Tipo</Label>
          <select
            id="circuito-category-type"
            value={type}
            onChange={(e) => setType(e.target.value as "single" | "dobles")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="single">Single</option>
            <option value="dobles">Dobles</option>
          </select>
        </div>
        <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
          {loading ? "Agregando..." : "Agregar categoría"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
