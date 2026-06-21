import Image from "next/image"
import { Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACTIVITIES, waLink } from "@/lib/site"

export function Activities() {
  return (
    <section id="actividades" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Actividades
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Todo lo que ofrece el club
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Jugá, entrená y competí. Elegí tu actividad y consultanos por
            WhatsApp.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {ACTIVITIES.map((act) => (
            <article
              key={act.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={act.image || "/placeholder.svg"}
                  alt={act.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-heading text-xl font-bold tracking-tight">
                  {act.title}
                </h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  {act.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {act.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                    >
                      <Check className="size-4 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Button asChild variant="secondary" className="w-fit">
                  <a
                    href={waLink(act.waMessage, "waNumber" in act ? act.waNumber : undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4 text-primary" />
                    Consultar
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
