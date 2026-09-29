import Link from "next/link"
import type { EnJuego } from "@/lib/data/home"
import type { SectionIdentity } from "@/components/layout/section-shell"
import { seasonFromSlug } from "@/components/liga/season-theme"

type Figure = { value: string; label: string; highlight?: boolean; delay?: number }
type Row = { href: string; identity: SectionIdentity; name: string; detail: string; figures: Figure[] }

function buildRows({ liga, circuito, interparque }: EnJuego): Row[] {
  const rows: Row[] = []
  if (liga) {
    const season = seasonFromSlug(liga.slug)
    rows.push({
      href: `/ligas-invierno-verano/${liga.slug}`,
      identity: season === "verano" ? "liga-verano" : "liga-invierno",
      name: liga.kind === "proximamente" ? "Próximamente" : liga.title,
      detail: liga.kind === "proximamente" ? liga.title : liga.kind === "playoffs" ? "Playoffs" : "Fase regular",
      figures: liga.kind === "fecha" ? [{ value: String(liga.round), label: "fecha", highlight: true }] : [],
    })
  }
  if (circuito) {
    rows.push({
      href: `/circuito-del-parque/torneos/${circuito.slug}`,
      identity: "circuito",
      name: "Circuito del Parque",
      detail: circuito.title,
      figures: circuito.categories > 0 ? [{ value: String(circuito.categories), label: "categorías" }] : [],
    })
  }
  rows.push({
    href: "/interparque",
    identity: "interparque",
    name: "Interparque",
    detail: "Alumnos del club",
    figures: [
      { value: String(interparque.players), label: "jugadores" },
      { value: String(interparque.matchesPlayed), label: "partidos" },
    ],
  })
  // 60 ms entre números (stagger de 30–80 ms, §3.5).
  let delay = 120
  for (const row of rows) for (const f of row.figures) f.delay = delay += 60
  return rows
}

// Tablero del hero (maqueta F1 aprobada): lo que se juega en cada competencia.
// Sus números son el único momento animado de la home (§3.5).
export function EnJuegoBoard({ data }: { data: EnJuego }) {
  const rows = buildRows(data)

  return (
    <figure className="m-0 rounded-md border-[3px] border-board-foreground bg-board p-1.5 text-board-foreground shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-1.5 rounded-[3px] border border-board-foreground/35 px-4 pb-2 pt-3.5 sm:px-5">
        <figcaption className="flex items-center gap-2.5 pb-1.5 font-heading text-2xl font-extrabold uppercase sm:text-3xl">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-ball" />
          En juego
        </figcaption>
        <ul className="m-0 list-none p-0">
          {rows.map((row, i) => (
            <li key={row.href} data-identity={row.identity} className={i > 0 ? "border-t border-board-foreground/20" : undefined}>
              <Link
                href={row.href}
                className="press flex items-center gap-3.5 rounded-sm py-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground sm:py-3.5 [@media(hover:hover)]:hover:bg-board-foreground/5"
              >
                <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-section-accent" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-heading text-xl font-extrabold uppercase leading-tight sm:text-2xl">{row.name}</span>
                  <span className="truncate text-sm text-board-foreground/78 sm:text-[15px]">{row.detail}</span>
                </span>
                <span className="flex gap-4 sm:gap-5">
                  {row.figures.map((f) => (
                      <span key={f.label} className="flex flex-col items-end">
                        <span
                          className={`font-heading text-[34px] font-extrabold leading-[0.95] tabular-nums sm:text-[44px] ${f.highlight ? "text-ball" : ""}`}
                        >
                          <span className="board-flip" style={{ animationDelay: `${f.delay}ms` }}>
                            {f.value}
                          </span>
                        </span>
                        <span className="text-xs text-board-foreground/72 sm:text-[13px]">{f.label}</span>
                      </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
