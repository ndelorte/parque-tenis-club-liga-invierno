import Image from "next/image"
import { sponsors } from "@/content/sponsors"
import { cn } from "@/lib/utils"

const sponsorLoop = [...sponsors, ...sponsors, ...sponsors]

export function SponsorsBanner() {
  return (
    <section className="border-y border-border bg-white" aria-labelledby="sponsors-title">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-winter">
              Liga de Invierno
            </p>
            <h2 id="sponsors-title" className="font-heading text-2xl font-extrabold text-foreground">
              Sponsors oficiales
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Marcas que acompañan el torneo y hacen posible cada fecha.
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface py-4 shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent"
          />

          <div className="sponsors-marquee-track flex w-max items-center gap-4 px-4 sm:gap-5">
            {sponsorLoop.map((sponsor, index) => (
              <SponsorLogo
                key={`${sponsor.name}-${index}`}
                image={sponsor.image}
                alt={sponsor.alt}
                duplicate={index >= sponsors.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SponsorLogo({
  image,
  alt,
  duplicate,
}: {
  image: string
  alt: string
  duplicate: boolean
}) {
  const isCircular = image.endsWith("-clean.png")

  return (
    <div
      aria-hidden={duplicate ? true : undefined}
      className={cn(
        "flex h-24 w-36 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-4 shadow-sm sm:h-28 sm:w-44",
        isCircular && "p-3",
      )}
    >
      <Image
        src={image}
        alt={duplicate ? "" : alt}
        width={176}
        height={112}
        className={cn(
          "max-h-full w-full object-contain",
          isCircular ? "h-full w-auto rounded-full" : "h-auto",
        )}
      />
    </div>
  )
}