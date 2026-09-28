"use client"

import { useId, useRef } from "react"
import { ChevronRight, X } from "lucide-react"
import type { Series } from "@/lib/tournament/types"
import { SeriesDetail } from "./SeriesDetail"

export function ResultCard({ series }: { series: Series }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const homeWon = series.winner_team_id === series.home_team_id || series.walkover_winner_team_id === series.home_team_id
  const awayWon = series.winner_team_id === series.away_team_id || series.walkover_winner_team_id === series.away_team_id
  const home = series.home_team?.name ?? "Local"
  const away = series.away_team?.name ?? "Visitante"

  return (
    <>
      <button ref={trigger} type="button" onClick={() => { dialog.current?.showModal(); closeButton.current?.focus() }} className="group flex min-h-16 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">{series.round?.name ?? "Serie"}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 font-heading text-base font-semibold">
            <span className={homeWon ? "text-foreground" : "text-muted-foreground"}>{home}{homeWon && <span className="sr-only">, ganó</span>}</span>
            <span className="tabular-nums text-primary">{series.is_general_walkover ? "WO" : `${series.home_courts_won ?? 0}–${series.away_courts_won ?? 0}`}</span>
            <span className={awayWon ? "text-foreground" : "text-muted-foreground"}>{away}{awayWon && <span className="sr-only">, ganó</span>}</span>
          </span>
        </span>
        <span className="hidden text-xs font-semibold text-primary sm:inline">Ver canchas</span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-primary" />
      </button>
      <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onClose={() => trigger.current?.focus()} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close() }} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55 sm:inset-0 sm:m-auto sm:max-h-[85dvh] sm:max-w-2xl sm:rounded-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background px-5 py-4">
          <div><h2 id={titleId} className="font-heading text-xl font-bold text-balance">{home} {series.is_general_walkover ? "WO" : `${series.home_courts_won ?? 0}–${series.away_courts_won ?? 0}`} {away}</h2><p id={descriptionId} className="text-sm text-muted-foreground">{series.round?.name ?? "Serie"} · Detalle de canchas</p></div>
          <button ref={closeButton} type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar detalle" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><X aria-hidden="true" className="size-5" /></button>
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"><SeriesDetail series={series} /></div>
      </dialog>
    </>
  )
}
