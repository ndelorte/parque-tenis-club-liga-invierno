import type { HistoryItem } from "@/app/actions/liga-registrations"

function formatAt(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso))
}

// Historial de cambios, del más nuevo al más viejo.
export function RegistrationHistory({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Todavía no hay cambios registrados.</p>
  return (
    <ol className="grid gap-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border border-border px-3 py-2 text-sm">
          <p className="font-semibold">{item.summary}</p>
          <p className="text-xs text-muted-foreground">
            {formatAt(item.at)} · {item.actor}
          </p>
        </li>
      ))}
    </ol>
  )
}
