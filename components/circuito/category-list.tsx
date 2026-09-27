import Link from "next/link"

export interface CategoryListItem {
  slug: string
  name: string
  formatText: string
  countText: string
  statusText: string
  statusTone: "live" | "done" | "pending"
}

const STATUS_TONE_CLASS: Record<CategoryListItem["statusTone"], string> = {
  live: "text-accent-dark",
  done: "text-win",
  pending: "text-muted-foreground",
}

export function SingleRacquetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <ellipse cx="13" cy="12" rx="8" ry="9.5" transform="rotate(-35 13 12)" />
      <path d="M18.5 18.5L27 27" />
    </svg>
  )
}

export function DoubleRacquetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <ellipse cx="13" cy="12" rx="8" ry="9.5" transform="rotate(-35 13 12)" />
      <path d="M18.5 18.5L27 27" />
      <ellipse cx="29" cy="12" rx="8" ry="9.5" transform="rotate(35 29 12)" />
      <path d="M23.5 18.5L15 27" />
    </svg>
  )
}

export function CategoryRow({ item, editionSlug }: { item: CategoryListItem; editionSlug: string }) {
  return (
    <li className="border-b border-border last:border-0">
      <Link
        href={`/circuito-del-parque/torneos/${editionSlug}/${item.slug}`}
        className="group flex min-h-[44px] flex-col gap-1 py-4 no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-xl font-extrabold uppercase leading-none text-foreground group-hover:underline group-hover:underline-offset-[5px] sm:text-2xl">
            {item.name}
          </span>
          <span className={`shrink-0 text-right text-sm font-semibold ${STATUS_TONE_CLASS[item.statusTone]}`}>
            {item.statusText}
          </span>
        </span>
        <span className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
          <span>{item.formatText}</span>
          <span className="shrink-0 text-right">{item.countText}</span>
        </span>
      </Link>
    </li>
  )
}

export function CategoryColumn({
  title,
  icon,
  items,
  editionSlug,
}: {
  title: string
  icon: React.ReactNode
  items: CategoryListItem[]
  editionSlug: string
}) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby={`h-${title}`}>
      <h2
        id={`h-${title}`}
        className="mb-3 flex items-center gap-3.5 border-b-2 border-draw-line pb-3 font-heading text-3xl font-extrabold uppercase text-foreground"
      >
        {icon}
        {title}
      </h2>
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <CategoryRow key={item.slug} item={item} editionSlug={editionSlug} />
        ))}
      </ul>
    </section>
  )
}
