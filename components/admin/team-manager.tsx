"use client"

import { useMemo, useState } from "react"
import { Users, UserPlus, Trash2, Plus, Save, Check, X, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, LEAGUE, type CategoryId } from "@/lib/liga"

type TeamDraft = {
  id: string
  name: string
  players: string[]
}

let teamSeq = 0
function uid() {
  teamSeq += 1
  return `t${teamSeq}-${Math.random().toString(36).slice(2, 7)}`
}

function buildDraft(categoryId: CategoryId): TeamDraft[] {
  return LEAGUE[categoryId].teams.map((t) => ({
    id: uid(),
    name: t.name,
    players: [...t.players],
  }))
}

export function TeamManager() {
  const [active, setActive] = useState<CategoryId>("cab-a")
  const [drafts, setDrafts] = useState<Record<string, TeamDraft[]>>(() => ({
    "cab-a": buildDraft("cab-a"),
  }))
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const teams = useMemo(() => {
    if (!drafts[active]) {
      const next = buildDraft(active)
      setDrafts((d) => ({ ...d, [active]: next }))
      return next
    }
    return drafts[active]
  }, [drafts, active])

  function update(updater: (teams: TeamDraft[]) => TeamDraft[]) {
    setDrafts((d) => ({
      ...d,
      [active]: updater(d[active] ?? buildDraft(active)),
    }))
    setSavedAt(null)
  }

  function setTeamName(id: string, name: string) {
    update((ts) => ts.map((t) => (t.id === id ? { ...t, name } : t)))
  }

  function setPlayer(teamId: string, index: number, value: string) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.map((p, i) => (i === index ? value : p)) }
          : t,
      ),
    )
  }

  function addPlayer(teamId: string) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId ? { ...t, players: [...t.players, ""] } : t,
      ),
    )
  }

  function removePlayer(teamId: string, index: number) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.filter((_, i) => i !== index) }
          : t,
      ),
    )
  }

  function addTeam() {
    update((ts) => [
      ...ts,
      { id: uid(), name: "Nuevo equipo", players: ["", ""] },
    ])
  }

  function removeTeam(id: string) {
    update((ts) => ts.filter((t) => t.id !== id))
  }

  function save() {
    setSavedAt(
      new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    )
  }

  return (
    <div className="space-y-5">
      <Card className="border-t-4 border-t-winter">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoría
            </Label>
            <Select value={active} onValueChange={(v) => setActive(v as CategoryId)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={addTeam}
            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Agregar equipo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id} className="overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-primary">
                  {team.name.charAt(0) || "?"}
                </span>
                <Input
                  value={team.name}
                  onChange={(e) => setTeamName(team.id, e.target.value)}
                  aria-label="Nombre del equipo"
                  className="h-10 font-heading text-base font-bold"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTeam(team.id)}
                  aria-label={`Eliminar ${team.name}`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <Users className="size-4" />
                  Jugadores ({team.players.length})
                </CardTitle>
              </div>
              {team.players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <Input
                    value={p}
                    onChange={(e) => setPlayer(team.id, i, e.target.value)}
                    placeholder={`Jugador ${i + 1}`}
                    aria-label={`Jugador ${i + 1} de ${team.name}`}
                    className="h-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(team.id, i)}
                    disabled={team.players.length <= 1}
                    aria-label={`Quitar jugador ${i + 1}`}
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addPlayer(team.id)}
                className="mt-1 h-10 w-full border-dashed"
              >
                <UserPlus className="size-4" />
                Agregar jugador
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          {savedAt ? (
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Check className="size-3.5" />
              Guardado {savedAt}
            </Badge>
          ) : (
            <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
              <Pencil className="size-3.5" />
              Cambios sin guardar
            </Badge>
          )}
          <span className="hidden text-muted-foreground sm:inline">
            {teams.length} equipos en la categoría
          </span>
        </div>
        <Button
          onClick={save}
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="size-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
