import Link from "next/link"
import type { SeasonCalendarMonth } from "@/lib/circuito/seasonCalendar"

const STATUS_LABEL: Record<"upcoming" | "active" | "finished", string> = {
  upcoming: "Próximo",
  active: "En juego",
  finished: "Finalizado",
}

interface Props {
  months: SeasonCalendarMonth[]
}

// Calendario de la temporada del Circuito (landing) — product/refactor-visual/maquetas/fase-2/Landing.dc.html.
// Grand Slam: polvo fuerte con líneas de cancha (misma tarjeta esté jugado, en
// juego o próximo). Jugado (no GS): polvo suave. Próximo (no GS): borde
// punteado, transparente. Mes en juego: doble anillo + punto amarillo. Mes
// sin torneo cargado: tarjeta punteada, "A confirmar" — nunca se inventa un
// nombre de torneo.
export function SeasonCalendar({ months }: Props) {
  return (
    <div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {months.map((month) => (
          <li key={month.month}>
            <MonthCard month={month} />
          </li>
        ))}
      </ol>
      <p className="mt-3.5 flex items-center gap-2.5 text-sm text-muted-foreground">
        <span aria-hidden="true" className="gs-badge inline-block h-[18px] w-7 shrink-0 rounded-sm border-2 border-draw-line" />
        Grand Slam: puntos dobles para el ranking.
      </p>
    </div>
  )
}

function MonthCard({ month }: { month: SeasonCalendarMonth }) {
  const n = String(month.month).padStart(2, "0")
  const base =
    "flex h-[150px] flex-col gap-2 rounded p-3.5 pb-3 no-underline sm:h-[160px] lg:h-[168px] focus-visible:outline-3 focus-visible:outline-offset-2"

  if (!month.edition) {
    return (
      <div className={`${base} border-[1.5px] border-dashed border-border text-muted-foreground`}>
        <TopRow monthName={month.monthName} n={n} />
        <span className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold">
          {month.isCurrent && <LiveDot />}
          A confirmar
        </span>
      </div>
    )
  }

  const { edition } = month
  const isLive = edition.status === "active"
  const ring = isLive ? "shadow-[0_0_0_3px_var(--color-background),0_0_0_6px_var(--color-draw-line)]" : ""

  let tone: string
  let textTone: string
  if (month.isGrandSlam) {
    tone = "court-stripe border-2 border-draw-line"
    textTone = "text-board-foreground"
  } else if (edition.status === "finished") {
    tone = "border-[1.5px] border-clay-soft-border bg-clay-soft"
    textTone = "text-foreground"
  } else {
    tone = "border-[1.5px] border-dashed border-border"
    textTone = "text-muted-foreground"
  }

  return (
    <Link
      href={`/circuito-del-parque/torneos/${edition.slug}`}
      className={`${base} ${tone} ${textTone} ${ring} hover:outline-2 hover:outline-offset-2 hover:outline-draw-line focus-visible:outline-ring`}
    >
      <TopRow monthName={month.monthName} n={n} />
      <span className="mt-auto font-heading text-2xl font-extrabold leading-[0.95] sm:text-3xl">{edition.name}</span>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
        {isLive && <LiveDot />}
        {STATUS_LABEL[edition.status]}
      </span>
    </Link>
  )
}

function TopRow({ monthName, n }: { monthName: string; n: string }) {
  return (
    <span className="flex items-baseline justify-between text-sm font-semibold">
      <span>{monthName}</span>
      <span className="tabular-nums opacity-75">{n}</span>
    </span>
  )
}

function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="size-[9px] shrink-0 rounded-full bg-ball shadow-[0_0_0_2px_var(--color-draw-line)]"
    />
  )
}
