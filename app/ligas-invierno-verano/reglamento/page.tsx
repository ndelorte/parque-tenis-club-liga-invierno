import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ReglamentoNav } from "@/components/liga/ReglamentoNav"

export const metadata: Metadata = {
  title: "Reglamento | Liga de Invierno y Verano | Parque Tenis Club",
  description: "Formato, puntos, desempates, WO y fase final de la Liga.",
}

// Números grandes de la sección "Puntos": valores exactos de la tabla de
// puntos en product/reglas-liga-invierno.md (§Sistema de puntos).
const POINTS_KEYNUMS = [
  { value: "2", label: "Serie ganada" },
  { value: "1", label: "Serie perdida" },
  { value: "0", label: "WO general (ausente)" },
]

const sections = [
  { id: "formato", title: "Formato del torneo", items: [
    "Seis categorías: Caballeros A y B, Damas A y B, Mixto A y B.",
    "Fase regular de todos contra todos, ida y vuelta. Cada equipo juega dos veces contra cada rival en Parque Tenis Club.",
    "La mayoría de las categorías tiene seis equipos; Mixto B tiene cinco.",
  ] },
  { id: "serie", title: "La serie", items: [
    "Cada serie enfrenta a dos equipos en tres canchas de dobles.",
    "Gana la serie el equipo que gana dos de las tres canchas.",
    "El tercer set, jugado como supertiebreak, se registra 7-6.",
  ] },
  { id: "puntos", title: "Sistema de puntos", keynums: POINTS_KEYNUMS, items: [
    "Los puntos se asignan por serie, no por cancha.",
  ] },
  { id: "desempates", title: "Desempates", items: [
    "Orden: puntos, diferencia de canchas, diferencia de sets y diferencia de games.",
    "Si persiste el empate, se arma una mini-tabla solo con los equipos empatados, considerando únicamente los resultados entre ellos, y se compara diferencia de canchas, de sets y de games dentro de esa mini-tabla. Si continúa la igualdad, se define por sorteo.",
  ] },
  { id: "wo", title: "Walkover", items: [
    "WO general: si un equipo no se presenta, el rival recibe 2 puntos y las tres canchas 6-0 6-0. El ausente recibe 0 puntos.",
    "WO de cancha: si falta pareja en exactamente una cancha, esa cancha queda 6-0 6-0 y la serie continúa. Cada equipo debe presentar pareja en al menos dos canchas.",
  ] },
  { id: "fase-final", title: "Fase final", items: [
    "Con seis equipos, 1.º y 2.º pasan directo a semifinales. En cuartos juegan 3.º contra 6.º y 4.º contra 5.º.",
    "En Mixto B, con cinco equipos, 1.º, 2.º y 3.º pasan directo. En cuartos juegan 4.º contra 5.º; las semifinales son 1.º contra 2.º y 3.º contra el ganador de cuartos.",
    "Cada cruce se disputa en tres canchas. Los perdedores de semifinal juegan por el 3.º y 4.º puesto, con el mismo formato.",
    "Los resultados de playoffs no modifican la tabla de fase regular.",
  ] },
  { id: "reprogramaciones", title: "Reprogramaciones", items: [
    "Si una serie se reprograma (por ejemplo, por lluvia), la vista pública muestra la fecha actualizada con la etiqueta «Reprogramado por lluvia».",
  ] },
]

export default function ReglamentoPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <Link href="/ligas-invierno-verano" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft aria-hidden="true" className="size-4" /> Liga Invierno / Verano</Link>
      <header className="mt-6 border-b border-border pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">En la cancha</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold uppercase text-balance text-foreground sm:text-6xl">Reglamento</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">Las reglas esenciales de la Liga de Invierno y Verano, desde la fase regular hasta la definición.</p>
      </header>
      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Índice del reglamento" className="self-start lg:sticky lg:top-28">
          <ReglamentoNav sections={sections.map(({ id, title }) => ({ id, title }))} />
        </nav>
        <div className="min-w-0">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id} className="scroll-mt-28 border-b border-border py-8 first:pt-0">
              <div className="flex items-baseline gap-4"><span className="font-heading text-2xl font-bold tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span><h2 className="font-heading text-2xl font-bold text-balance text-foreground sm:text-3xl">{section.title}</h2></div>
              {"keynums" in section && section.keynums && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {section.keynums.map((kn) => (
                    <div key={kn.label} className="min-w-[7.5rem] rounded-md bg-board px-4 py-3 text-board-foreground">
                      <p className="font-heading text-4xl font-extrabold leading-none tabular-nums">{kn.value}</p>
                      <p className="mt-1 text-sm text-board-foreground/80">{kn.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <ul className="mt-5 space-y-3 pl-10">{section.items.map(item => <li key={item} className="relative leading-relaxed text-foreground before:absolute before:-left-5 before:top-[0.65em] before:size-1.5 before:rounded-full before:bg-primary">{item}</li>)}</ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
