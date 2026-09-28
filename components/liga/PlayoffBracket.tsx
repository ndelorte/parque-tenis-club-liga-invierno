"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"
import type { ProvisionalBracket, QuarterFinalMatchup, PlayoffSlot } from "@/lib/playoffs/types"

type ScheduledMatch = {
  homeTeamName: string
  awayTeamName: string
  scheduledDate?: string | null
  scheduledTime?: string | null
  status: string
}
type ThirdPlace = Partial<ScheduledMatch>

interface Props {
  bracket: ProvisionalBracket
  semifinals?: ScheduledMatch[]
  final?: ScheduledMatch
  thirdPlace?: ThirdPlace
  provisional?: boolean
}

function dateLabel(date?: string | null, time?: string | null) {
  if (!date) return "Fecha a confirmar"
  const formatted = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))
  return time ? `${formatted} · ${time.slice(0, 5)} hs` : formatted
}

function MatchCard({ label, home, away, date, time, status, winnerId, homeId, awayId, note }: {
  label: string; home: string; away: string; date?: string | null; time?: string | null
  status?: string; winnerId?: string; homeId?: string; awayId?: string; note?: string
}) {
  const played = status === "completed" || status === "walkover"
  return <li className="rounded-md border border-border bg-card p-3">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="space-y-1 font-heading text-base font-semibold">
      <p className={winnerId && homeId === winnerId ? "text-primary" : "text-foreground"}>{home}{winnerId && homeId === winnerId && <span className="ml-2 text-xs">Ganó</span>}</p>
      <p className={winnerId && awayId === winnerId ? "text-primary" : "text-foreground"}>{away}{winnerId && awayId === winnerId && <span className="ml-2 text-xs">Ganó</span>}</p>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{dateLabel(date, time)}{played ? " · Jugado" : ""}</p>
    {note && <p className="mt-2 border-t border-border pt-2 text-xs font-medium text-primary">{note}</p>}
  </li>
}

function Quarterfinal({ qf, note }: { qf: QuarterFinalMatchup; note: string }) {
  return <MatchCard label="Cuartos de final" home={`${qf.home.seed}° ${qf.home.team.name}`} away={`${qf.away.seed}° ${qf.away.team.name}`} homeId={qf.home.team.id} awayId={qf.away.team.id} winnerId={qf.winnerTeamId} date={qf.scheduledDate} time={qf.scheduledTime} status={qf.status} note={note} />
}
function Bye({ slot, note }: { slot: PlayoffSlot; note: string }) {
  return <li className="rounded-md border border-primary/30 bg-primary/5 p-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">Pasa directo a semifinal</p><p className="mt-2 font-heading text-base font-semibold text-foreground">{slot.seed}° {slot.team.name}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></li>
}

export function PlayoffBracket({ bracket, semifinals, final, thirdPlace, provisional = true }: Props) {
  const [round, setRound] = useState(0)
  const five = bracket.format === "five_team"
  const first = bracket.byes[0]
  const second = bracket.byes[1]
  const third = bracket.byes[2]
  return <div>
    <div className="mb-5"><h3 className="font-heading text-2xl font-bold text-foreground">Fase Final</h3><p className="text-sm text-muted-foreground">{provisional ? "Con las posiciones actuales provisorias" : "Cuadro final"}</p></div>
    <div className="mb-4 flex gap-2 md:hidden" role="group" aria-label="Ronda de fase final">{["Cuartos", "Semifinales", "Final"].map((label, index) => <button key={label} type="button" aria-pressed={round === index} onClick={() => setRound(index)} className={round === index ? "min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" : "min-h-11 rounded-md border border-border bg-card px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary"}>{label}</button>)}</div>
    <div className="max-w-full" role="region" aria-label="Cuadro de fase final">
      <div className="grid gap-4 md:grid-cols-3">
        <section className={round === 0 ? "" : "hidden md:block"}><h4 className="mb-3 border-b-2 border-primary pb-2 font-heading text-lg font-bold">Cuartos</h4><ol className="space-y-3">
          {first && <Bye slot={first} note={five ? `Semifinal contra ${second?.team.name ?? "2°"}` : "Semifinal contra ganador de 3° vs 6°"} />}
          {!five && bracket.quarterfinals[0] && <Quarterfinal qf={bracket.quarterfinals[0]} note={`Ganador contra ${first?.team.name ?? "1°"}`} />}
          {five && second && <Bye slot={second} note={`Semifinal contra ${first?.team.name ?? "1°"}`} />}
          {bracket.quarterfinals[five ? 0 : 1] && <Quarterfinal qf={bracket.quarterfinals[five ? 0 : 1]} note={`Ganador contra ${five ? third?.team.name ?? "3°" : second?.team.name ?? "2°"}`} />}
          {five && third && <Bye slot={third} note="Semifinal contra ganador de 4° vs 5°" />}
          {!five && second && <Bye slot={second} note="Semifinal contra ganador de 4° vs 5°" />}
        </ol></section>
        <section className={round === 1 ? "" : "hidden md:block"}><h4 className="mb-3 border-b-2 border-primary pb-2 font-heading text-lg font-bold">Semifinales</h4><ol className="space-y-3">
          <MatchCard label="Cruce proyectado" home={first?.team.name ?? "1°"} away={five ? second?.team.name ?? "2°" : "Ganador 3° vs 6°"} note="Ganador a la final" />
          <MatchCard label="Cruce proyectado" home={five ? third?.team.name ?? "3°" : second?.team.name ?? "2°"} away="Ganador de cuartos" note="Ganador a la final" />
        </ol></section>
        <section className={round === 2 ? "" : "hidden md:block"}><h4 className="mb-3 border-b-2 border-primary pb-2 font-heading text-lg font-bold">Final</h4><ol><MatchCard label="Final" home={final?.homeTeamName ?? "Ganador semifinal 1"} away={final?.awayTeamName ?? "Ganador semifinal 2"} date={final?.scheduledDate} time={final?.scheduledTime} status={final?.status} /></ol>
          {final?.status === "completed" && <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><Trophy aria-hidden="true" className="size-4" /> Final disputada</p>}
        </section>
      </div>
    </div>
    {semifinals && semifinals.length > 0 && <section className="mt-5"><h4 className="mb-2 font-heading text-lg font-bold">Semifinales programadas</h4><p className="mb-3 text-xs text-muted-foreground">Partidos cargados, mostrados por separado del cuadro proyectado.</p><ol className="grid gap-3 sm:grid-cols-2">{semifinals.map((match, index) => <MatchCard key={`${match.homeTeamName}-${match.awayTeamName}-${index}`} label="Semifinal" home={match.homeTeamName} away={match.awayTeamName} date={match.scheduledDate} time={match.scheduledTime} status={match.status} />)}</ol></section>}
    {thirdPlace && <section className="mt-5 max-w-sm"><h4 className="mb-2 font-heading text-lg font-bold">3.º y 4.º puesto</h4><p className="mb-2 text-xs text-muted-foreground">Partido separado entre perdedores de semifinal.</p><ol><MatchCard label="3.º y 4.º puesto" home={thirdPlace.homeTeamName ?? "A definir"} away={thirdPlace.awayTeamName ?? "A definir"} date={thirdPlace.scheduledDate} time={thirdPlace.scheduledTime} status={thirdPlace.status} /></ol></section>}
  </div>
}
