import Image from "next/image"
import { ACTIVITIES, waLink } from "@/lib/site"

// Cada link dice qué pasa al tocarlo (no "Consultar →").
const CTA_LABEL: Record<(typeof ACTIVITIES)[number]["id"], string> = {
  alquiler: "Reservar por WhatsApp",
  entrenamientos: "Consultar horarios",
  escuela: "Consultar por la escuela",
  torneos: "Consultar por torneos",
}

export function ClubActivities() {
  return (
    <section id="actividades" className="scroll-mt-20 pb-20 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-[clamp(2.75rem,6vw,4.75rem)] font-extrabold uppercase leading-[0.9]">El club</h2>

        <div className="mt-10 grid gap-x-6 gap-y-8 md:grid-cols-2">
          {ACTIVITIES.map((act) => (
            <article key={act.id} className="flex gap-5 border-t-2 border-board pt-5 dark:border-border">
              <Image
                src={act.image}
                alt=""
                width={220}
                height={220}
                sizes="(min-width: 640px) 220px, 112px"
                loading="lazy"
                className="size-28 shrink-0 rounded-md object-cover sm:size-[220px]"
              />
              <div className="flex min-w-0 flex-col gap-2.5">
                <h3 className="font-heading text-[28px] font-extrabold uppercase leading-none sm:text-[32px]">{act.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{act.description}</p>
                <p className="text-sm text-muted-foreground">{act.points.join(", ")}.</p>
                <a
                  href={waLink(act.waMessage, "waNumber" in act ? act.waNumber : undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto self-start rounded-sm pt-1 font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {CTA_LABEL[act.id]}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
