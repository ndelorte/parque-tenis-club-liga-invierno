"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Users,
  UserPlus,
  Trash2,
  Plus,
  Save,
  Check,
  X,
  Pencil,
  Loader2,
  Crown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
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
import {
  type CategoryForAdmin,
  type TeamInput,
  getTeamsForAdmin,
  saveTeamPlayers,
} from "@/app/actions/admin"

type PlayerDraft = {
  teamPlayerId: string | null
  playerId: string | null
  displayName: string
  isCaptain: boolean
}

type TeamDraft = {
  dbId: string | null
  localId: string
  name: string
  players: PlayerDraft[]
}

let seq = 0
function uid() {
  return `local-${++seq}`
}

export function TeamManager({ categories }: { categories: CategoryForAdmin[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [drafts, setDrafts] = useState<TeamDraft[]>([])
  const [isPending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function loadCategory(catId: string) {
    setSavedAt(null)
    setError(null)
    startTransition(async () => {
      const teams = await getTeamsForAdmin(catId)
      setDrafts(
        teams.map((t) => ({
          dbId: t.id,
          localId: uid(),
          name: t.name,
          players: t.players.map((p) => ({
            teamPlayerId: p.teamPlayerId,
            playerId: p.playerId,
            displayName: p.displayName,
            isCaptain: p.isCaptain,
          })),
        })),
      )
    })
  }

  useEffect(() => {
    if (categoryId) loadCategory(categoryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  function update(fn: (prev: TeamDraft[]) => TeamDraft[]) {
    setDrafts(fn)
    setSavedAt(null)
  }

  function setTeamName(localId: string, name: string) {
    update((ts) => ts.map((t) => (t.localId === localId ? { ...t, name } : t)))
  }

  function setPlayer(localId: string, idx: number, val: string) {
    update((ts) =>
      ts.map((t) =>
        t.localId === localId
          ? {
              ...t,
              players: t.players.map((p, i) =>
                i === idx ? { ...p, displayName: val } : p,
              ),
            }
          : t,
      ),
    )
  }

  function addPlayer(localId: string) {
    update((ts) =>
      ts.map((t) =>
        t.localId === localId
          ? {
              ...t,
              players: [
                ...t.players,
                { teamPlayerId: null, playerId: null, displayName: "", isCaptain: false },
              ],
            }
          : t,
      ),
    )
  }

  function setCaptain(localId: string, idx: number) {
    update((ts) =>
      ts.map((t) =>
        t.localId === localId
          ? { ...t, players: t.players.map((p, i) => ({ ...p, isCaptain: i === idx })) }
          : t,
      ),
    )
  }

  function removePlayer(localId: string, idx: number) {
    update((ts) =>
      ts.map((t) =>
        t.localId === localId
          ? { ...t, players: t.players.filter((_, i) => i !== idx) }
          : t,
      ),
    )
  }

  function addTeam() {
    update((ts) => [
      ...ts,
      {
        dbId: null,
        localId: uid(),
        name: "Nuevo equipo",
        players: [
          { teamPlayerId: null, playerId: null, displayName: "", isCaptain: false },
          { teamPlayerId: null, playerId: null, displayName: "", isCaptain: false },
        ],
      },
    ])
  }

  function removeTeam(localId: string) {
    update((ts) => ts.filter((t) => t.localId !== localId))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const input: TeamInput[] = drafts.map((t) => ({
        id: t.dbId,
        name: t.name,
        players: t.players.map((p) => ({
          teamPlayerId: p.teamPlayerId,
          playerId: p.playerId,
          displayName: p.displayName,
          isCaptain: p.isCaptain,
        })),
      }))
      const result = await saveTeamPlayers(categoryId, input)
      if (result.success) {
        setSavedAt(
          new Date().toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        )
        loadCategory(categoryId)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  return (
    <div className="space-y-5">
      <Card className="border-t-4 border-t-winter">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoría
            </Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                if (v) setCategoryId(v)
                setSavedAt(null)
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={addTeam}
            disabled={isPending}
            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Agregar equipo
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {drafts.map((team) => (
            <Card key={team.localId} className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-primary">
                    {team.name.charAt(0) || "?"}
                  </span>
                  <Input
                    value={team.name}
                    onChange={(e) => setTeamName(team.localId, e.target.value)}
                    aria-label="Nombre del equipo"
                    className="h-10 font-heading text-base font-bold"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeam(team.localId)}
                    aria-label={`Eliminar ${team.name}`}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <Users className="size-4" />
                  Jugadores ({team.players.length})
                </CardTitle>
                {team.players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCaptain(team.localId, i)}
                      aria-label={p.isCaptain ? "Capitán" : "Hacer capitán"}
                      title={p.isCaptain ? "Capitán" : "Hacer capitán"}
                      className={cn(
                        "shrink-0",
                        p.isCaptain
                          ? "text-accent hover:text-accent"
                          : "text-muted-foreground/30 hover:text-accent/60",
                      )}
                    >
                      <Crown className="size-4" />
                    </Button>
                    <Input
                      value={p.displayName}
                      onChange={(e) => setPlayer(team.localId, i, e.target.value)}
                      placeholder={`Jugador ${i + 1}`}
                      aria-label={`Jugador ${i + 1} de ${team.name}`}
                      className="h-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayer(team.localId, i)}
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
                  onClick={() => addPlayer(team.localId)}
                  className="mt-1 h-10 w-full border-dashed"
                >
                  <UserPlus className="size-4" />
                  Agregar jugador
                </Button>
              </CardContent>
            </Card>
          ))}
          {drafts.length === 0 && (
            <p className="col-span-2 text-sm text-muted-foreground">
              No hay equipos en esta categoría.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

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
            {drafts.length} equipo{drafts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          onClick={save}
          disabled={isPending}
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
