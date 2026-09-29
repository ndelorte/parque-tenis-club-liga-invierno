"use client"

import type { PlayedDate } from "@/lib/team-detail-types"
import { DialogSheet } from "@/components/liga/DialogSheet"

// Fecha jugada de un equipo: abre el detalle de canchas en el mismo diálogo
// que la serie de la categoría (components/liga/DialogSheet.tsx), en vez del
// <details> nativo que tenía antes.
export function PlayedDateCard({ date, label }: { date: PlayedDate; label: string }) {
  return (
    <DialogSheet
      triggerClassName="flex min-h-16 w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      title={`vs ${date.opponent}`}
      description={`${date.round} · ${label}`}
      trigger={
        <>
          <span>
            <span className="block text-xs text-muted-foreground">
              {date.round} · {label}
            </span>
            <span className="font-heading font-bold text-foreground">vs {date.opponent}</span>
          </span>
          <span
            className={
              date.result === "win"
                ? "shrink-0 font-bold tabular-nums text-primary"
                : "shrink-0 font-bold tabular-nums text-loss"
            }
          >
            {date.courtsWon}–{date.courtsLost} <span className="text-xs">{date.result === "win" ? "Ganó" : "Perdió"}</span>
          </span>
        </>
      }
    >
      <div className="space-y-2">
        {date.courts.length === 0 && <p className="text-sm text-muted-foreground">Sin detalle de canchas disponible.</p>}
        {date.courts.map((court) => (
          <div key={court.court} className="rounded-md bg-secondary/40 p-3 text-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
              Cancha {court.court}
              {court.wo ? " · WO" : ""}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
              <span className={court.winner === "home" ? "font-bold" : "text-muted-foreground"}>
                {court.homePlayers.join(" / ")}
              </span>
              <span className="font-bold tabular-nums">{court.score}</span>
              <span className={court.winner === "away" ? "text-right font-bold" : "text-right text-muted-foreground"}>
                {court.awayPlayers.join(" / ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DialogSheet>
  )
}
