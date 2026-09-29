import Link from "next/link"
import type { MmCategory, MmKnockoutMatch } from "@/lib/mid-master/types"

interface Props {
  editionSlug: string
  categories: MmCategory[]
}

const PLAYED_STATUSES = new Set(["played", "walkover"])

function isDone(match: { status: string }) {
  return PLAYED_STATUSES.has(match.status)
}

/**
 * Estado de la categoría para el índice de "Especiales: edición" (fase
 * actual, legible sin entrar). Deriva la fase real (zonas → semis → final →
 * campeón) puramente a partir de los status ya presentes en los datos — no
 * agrega ninguna regla deportiva nueva.
 */
type CategoryState =
  | { kind: "champion"; label: string; winnerName: string }
  | { kind: "final"; when: string | null }
  | { kind: "semis" }
  | { kind: "zones"; played: number; total: number }

function getWinnerName(match: MmKnockoutMatch): string {
  if (match.winnerId === match.participantAId) return match.participantALabel
  if (match.winnerId === match.participantBId) return match.participantBLabel
  return match.participantALabel
}

function getChampionLabel(category: MmCategory): string {
  if (category.type === "doubles") return "Campeones"
  return /damas/i.test(category.name) ? "Campeona" : "Campeón"
}

function formatWhen(date?: string, time?: string): string | null {
  if (!date) return null
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`))
  return time ? `${formatted}, ${time} h` : formatted
}

function getCategoryState(category: MmCategory): CategoryState {
  const { final, semifinal1, semifinal2 } = category.knockout

  if (isDone(final)) {
    return { kind: "champion", label: getChampionLabel(category), winnerName: getWinnerName(final) }
  }

  const zoneMatches = [...category.zones[0].matches, ...category.zones[1].matches]
  const total = zoneMatches.length
  const played = zoneMatches.filter(isDone).length
  const zonesComplete = total > 0 && played === total
  const semisComplete = isDone(semifinal1) && isDone(semifinal2)

  if (zonesComplete && semisComplete) {
    return { kind: "final", when: formatWhen(final.scheduledDate, final.scheduledTime) }
  }
  if (zonesComplete) {
    return { kind: "semis" }
  }
  return { kind: "zones", played, total }
}

function formatMeta(category: MmCategory): string {
  const unit = category.type === "doubles" ? "parejas" : ""
  return unit ? `2 zonas de ${category.zoneSize} ${unit}` : `2 zonas de ${category.zoneSize}`
}

export function CategoryGrid({ editionSlug, categories }: Props) {
  if (categories.length === 0) {
    return (
      <section id="categorias" className="bg-mm-bg px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-mm-text-muted">Las categorías aún no fueron cargadas.</p>
        </div>
      </section>
    )
  }

  const singles = categories.filter((c) => c.type === "singles")
  const doubles = categories.filter((c) => c.type === "doubles")

  return (
    <section id="categorias" className="bg-mm-bg px-4 pb-16 pt-10 sm:px-6" aria-labelledby="mm-cats-h">
      <div className="mx-auto max-w-6xl">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
          <h2 id="mm-cats-h" className="font-mm-display text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.05] text-mm-text">
            Categorías
          </h2>
        </div>

        {singles.length > 0 && (
          <CategoryGroup label="Singles" categories={singles} editionSlug={editionSlug} />
        )}
        {doubles.length > 0 && (
          <CategoryGroup label="Dobles" categories={doubles} editionSlug={editionSlug} />
        )}
      </div>
    </section>
  )
}

function CategoryGroup({
  label,
  categories,
  editionSlug,
}: {
  label: string
  categories: MmCategory[]
  editionSlug: string
}) {
  return (
    <div>
      <h3 className="mt-6 mb-1 flex items-center gap-3 font-heading text-xl font-bold text-mm-gold">
        {label}
        <span aria-hidden="true" className="h-px flex-1 bg-mm-gold-muted" />
      </h3>
      <ul className="grid sm:grid-cols-2 sm:gap-x-10">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryRow editionSlug={editionSlug} category={category} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryRow({ editionSlug, category }: { editionSlug: string; category: MmCategory }) {
  const state = getCategoryState(category)

  return (
    <Link
      href={`/circuito-del-parque/especiales/${editionSlug}/categorias/${category.slug}`}
      className="group grid min-h-[76px] grid-cols-1 items-center gap-x-4 gap-y-1 border-b border-mm-border-strong px-2 py-4 text-mm-text transition-colors hover:bg-mm-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mm-gold-light sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <span className="font-mm-display text-[22px] leading-[1.15] group-hover:underline group-hover:decoration-mm-gold group-hover:underline-offset-4">
        {category.name}
      </span>
      <span className="text-sm text-mm-text-muted sm:col-start-1">{formatMeta(category)}</span>
      <CategoryStateBadge state={state} />
    </Link>
  )
}

function CategoryStateBadge({ state }: { state: CategoryState }) {
  if (state.kind === "champion") {
    return (
      <span className="mt-1.5 grid justify-items-start gap-0.5 text-right text-sm text-mm-text-muted sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-items-end">
        {state.label}
        <strong className="text-[15px] font-semibold text-mm-gold-light">{state.winnerName}</strong>
      </span>
    )
  }
  if (state.kind === "final") {
    return (
      <span className="mt-1.5 grid justify-items-start gap-0.5 text-right text-sm text-mm-text-muted sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-items-end">
        Final
        <strong className="text-[15px] font-semibold text-mm-text">
          {state.when ?? "A confirmar"}
        </strong>
      </span>
    )
  }
  if (state.kind === "semis") {
    return (
      <span className="mt-1.5 grid justify-items-start gap-0.5 text-right text-sm text-mm-text-muted sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-items-end">
        En juego
        <strong className="text-[15px] font-semibold text-mm-text">Semifinales</strong>
      </span>
    )
  }
  if (state.total === 0) {
    return (
      <span className="mt-1.5 text-right text-sm text-mm-text-muted sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0">
        Fixture no cargado
      </span>
    )
  }

  return (
    <span className="mt-1.5 grid justify-items-start gap-1 text-right text-sm text-mm-text-muted sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-items-end">
      Zonas
      <strong className="text-[15px] font-semibold tabular-nums text-mm-text">
        {state.played} de {state.total} partidos
      </strong>
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: state.total }, (_, i) => (
          <i key={i} className={`h-2.5 w-1.5 ${i < state.played ? "bg-mm-gold" : "bg-mm-border-strong"}`} />
        ))}
      </span>
    </span>
  )
}
