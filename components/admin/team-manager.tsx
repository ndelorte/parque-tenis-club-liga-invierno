"use client"

import { useMemo, useState } from "react"
import { Users, Trophy, Star, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import type { AdminBundle } from "@/app/admin/page"

export function TeamManager({ bundles }: { bundles: AdminBundle[] }) {
  const [categoryId, setCategoryId] = useState<string>(bundles[0]?.category.id ?? "")
  const [query, setQuery] = useState("")

  const activeBundle = useMemo(
    () => bundles.find((b) => b.category.id === categoryId) ?? bundles[0],
    [bundles, categoryId],
  )

  const teams = useMemo(() => {
    const all = activeBundle?.teamsWithPlayers ?? []
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.players.some((tp) => tp.player?.display_name?.toLowerCase().includes(q)),
    )
  }, [activeBundle, query])

  return (
    <div className="space-y-5">
      <Card className="border-t-4 border-t-primary">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Trophy className="size-3.5 text-accent" />
              Categoría
            </Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                if (v) setCategoryId(v)
                setQuery("")
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bundles.map((b) => (
                  <SelectItem key={b.category.id} value={b.category.id}>
                    {b.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Search className="size-3.5 text-winter" />
              Buscar
            </Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Equipo o jugador…"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map((team) => {
          const captain = team.players.find((tp) => tp.is_captain)
          return (
            <Card key={team.id} className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="gap-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-heading text-base font-bold leading-tight text-foreground">
                    {team.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-border text-muted-foreground"
                  >
                    {team.players.length} jugadores
                  </Badge>
                </div>
                {captain && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-accent text-accent" />
                    Cap: {captain.player?.display_name ?? "—"}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  <Users className="size-3.5" />
                  Lista de buena fe
                </div>
                <ul className="space-y-1">
                  {team.players.map((tp, i) => (
                    <li
                      key={tp.player_id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm",
                        tp.is_captain
                          ? "bg-accent/10 text-foreground"
                          : "text-muted-foreground odd:bg-secondary/40",
                      )}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate">
                        {tp.player?.display_name ?? tp.player_id}
                      </span>
                      {tp.is_captain && (
                        <Star className="size-3 shrink-0 fill-accent text-accent" />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {teams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {query ? "Sin resultados para esa búsqueda." : "No hay equipos en esta categoría."}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Los planteles se gestionan mediante importación de CSV. Para modificaciones, actualizá el
        archivo de listas y volvé a importar.
      </p>
    </div>
  )
}
