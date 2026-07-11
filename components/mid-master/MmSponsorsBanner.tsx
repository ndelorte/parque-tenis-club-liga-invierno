import Image from "next/image"

const sponsors = [
  { name: "Gretta Aromas", image: "/images/sponsorsMM/grettaaromas.jpeg" },
  { name: "Kirchsbaum",    image: "/images/sponsorsMM/kirchsbaum.jpeg"   },
  { name: "Marea Mate",    image: "/images/sponsorsMM/mareamate.jpeg"    },
  { name: "Olivia",        image: "/images/sponsorsMM/olivia.png"        },
  { name: "Ponce",         image: "/images/sponsorsMM/ponce.png"         },
  { name: "Tourna",        image: "/images/sponsorsMM/tourna.jpeg"       },
]

const loop = [...sponsors, ...sponsors, ...sponsors]

export function MmSponsorsBanner() {
  return (
    <section className="border-y border-mm-border bg-mm-surface" aria-label="Sponsors del torneo">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mm-gold">
              Mid Master 2026
            </p>
            <h2 className="font-mm-display text-xl font-bold text-mm-text sm:text-2xl">
              Sponsors oficiales
            </h2>
          </div>
          <p className="max-w-xs text-sm text-mm-text-muted">
            Marcas que hacen posible el torneo.
          </p>
        </div>

        <div className="group relative overflow-hidden border border-mm-border bg-mm-bg py-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-mm-bg to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-mm-bg to-transparent"
          />

          <div className="sponsors-marquee-track flex w-max items-center gap-4 px-4 sm:gap-5">
            {loop.map((sponsor, index) => (
              <div
                key={`${sponsor.name}-${index}`}
                aria-hidden={index >= sponsors.length ? true : undefined}
                className="flex h-20 w-32 shrink-0 items-center justify-center border border-mm-border bg-white p-3 sm:h-24 sm:w-40"
              >
                <Image
                  src={sponsor.image}
                  alt={index >= sponsors.length ? "" : `Logo de ${sponsor.name}`}
                  width={160}
                  height={96}
                  className="max-h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
