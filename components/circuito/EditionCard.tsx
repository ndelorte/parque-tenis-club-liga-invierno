import Link from "next/link"
import { ArrowRight } from "lucide-react"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface Props {
  slug: string
  name: string
  month: number
  year: number
  status: "upcoming" | "active" | "finished"
}

const STATUS_LABEL: Record<Props["status"], string> = {
  upcoming: "Próximamente",
  active: "En juego",
  finished: "Finalizado",
}

export function EditionCard({ slug, name, month, year, status }: Props) {
  return (
    <Link
      href={`/circuito-del-parque/torneos/${slug}`}
      className="group flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-brand/40"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand">{STATUS_LABEL[status]}</p>
        <p className="mt-0.5 font-heading text-lg font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">
          {MONTHS[month - 1]} {year}
        </p>
      </div>
      <ArrowRight className="size-5 text-muted-foreground transition-colors group-hover:text-brand" />
    </Link>
  )
}
