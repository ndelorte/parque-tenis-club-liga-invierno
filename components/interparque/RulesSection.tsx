import { Users, Repeat, XCircle, CreditCard, Award, type LucideIcon } from "lucide-react"

const LEDGER = [
  { label: "Cada game ganado en los sets 1 y 2", value: "+1" },
  { label: "Ganar el partido", value: "+3" },
  { label: "Ganar el super tie-break", value: "+1" },
]

const RULES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Users,
    title: "Solo alumnos del club",
    body: "Se juega de single.",
  },
  {
    icon: Repeat,
    title: "Al mejor de 3 sets",
    body: "Si quedan 1-1, super tie-break a 10 con 2 de diferencia.",
  },
  {
    icon: XCircle,
    title: "Si no te presentás",
    body: "Perdés 6-0 6-0: tu rival suma 15 y vos 0.",
  },
  {
    icon: CreditCard,
    title: "$12.000 por partido",
    body: "Incluye cancha y pelotas.",
  },
  {
    icon: Award,
    title: "Premio",
    body: "Entrenamiento sin cargo en el grupo de adultos, dos veces por semana en noviembre.",
  },
]

// Reglas — dirección "Domingos": el puntaje como libro de cuentas destacado
// a la izquierda, el resto en una lista con íconos a la derecha (ver
// product/refactor-visual/maquetas/fase-4/Opcion2-Interparque.dc.html, .ip2-rules).
export function RulesSection() {
  return (
    <div className="grid border-[1.5px] border-border bg-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="grid content-start gap-3 bg-ip-soft px-4.5 py-5 sm:px-7 sm:py-6">
        <h3 className="font-heading text-xl font-extrabold uppercase tracking-[0.01em] text-foreground">
          Cómo se suman puntos
        </h3>
        <dl className="grid">
          {LEDGER.map((item) => (
            <div
              key={item.label}
              className="flex justify-between gap-3 border-b border-ip-line py-2.5 last:border-b-0"
            >
              <dt className="text-sm text-foreground">{item.label}</dt>
              <dd className="font-heading text-2xl leading-none font-extrabold tabular-nums text-ip-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-foreground">
          Un 6-2 6-3 le da{" "}
          <b className="font-heading text-lg tabular-nums">15</b> al ganador (12 games y 3
          por ganar) y <b className="font-heading text-lg tabular-nums">5</b> al rival.
        </p>
      </div>

      <ul className="grid px-4.5 py-3 sm:px-7 sm:py-4">
        {RULES.map((rule) => (
          <li key={rule.title} className="grid grid-cols-[28px_1fr] gap-3 border-b border-border py-3 last:border-b-0">
            <rule.icon aria-hidden="true" className="mt-0.5 size-5.5 text-muted-foreground" />
            <div>
              <strong className="block font-semibold text-foreground">{rule.title}</strong>
              <p className="text-sm text-muted-foreground">{rule.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
