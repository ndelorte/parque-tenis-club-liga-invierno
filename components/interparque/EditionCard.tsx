import Link from "next/link"
import { ArrowUpRight, Crown } from "lucide-react"
import {
  EDITION_STATUS_LABEL,
  deriveEditionStatus,
  editionLabel,
  formatEditionRange,
} from "@/lib/interparque/editions"
import type { InterparqueEdition } from "@/lib/data/interparque"

// "Campeón: X" / "Campeones: X y Y" / "Campeones: X, Y y Z".
function championsLine(names: string[]): string {
  if (names.length === 1) return `Campeón: ${names[0]}`
  return `Campeones: ${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

const BADGE_CLASSES = {
  active: "border-ip-line bg-ball text-on-ball",
  upcoming: "border-border-strong bg-card text-foreground",
  finished: "border-border bg-surface text-muted-foreground",
} as const

// Tarjeta de una edición en el selector de /interparque. El estado se deriva
// de las fechas (lib/interparque/editions.ts), nunca se guarda.
export function EditionCard({ edition, champions }: { edition: InterparqueEdition; champions: string[] }) {
  const status = deriveEditionStatus(edition)
  const label = editionLabel(edition.number)

  return (
    <li>
      <Link
        href={`/interparque/${edition.number}`}
        className="press group grid gap-1.5 border-[1.5px] border-border-strong bg-card px-4 py-4 text-foreground transition-colors hover:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5"
      >
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-heading text-2xl font-extrabold uppercase leading-none sm:text-3xl">{label}</span>
            <span className={`border-[1.5px] px-2 py-0.5 text-[13px] font-bold ${BADGE_CLASSES[status]}`}>
              {EDITION_STATUS_LABEL[status]}
            </span>
          </span>
          <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
        </span>
        <span className="text-sm text-muted-foreground">
          {formatEditionRange(edition)} · {edition.sundays_count} {edition.sundays_count === 1 ? "domingo" : "domingos"}
        </span>
        {status === "finished" && champions.length > 0 && (
          <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            <Crown aria-hidden="true" className="size-4 shrink-0 fill-ball text-ip-line" />
            {championsLine(champions)}
          </span>
        )}
      </Link>
    </li>
  )
}
