import Image from "next/image"
import styles from "./sponsors-banner.module.css"

export type SponsorBannerItem = {
  id: string
  name: string
  image: string
}

type SponsorsBannerProps = {
  sponsors: SponsorBannerItem[]
}

export function SponsorsBanner({ sponsors }: SponsorsBannerProps) {
  if (sponsors.length === 0) return null

  const hasMotion = sponsors.length > 1
  // Keep each half of the loop wider than the desktop viewport, even with two sponsors.
  const copiesPerGroup = hasMotion ? Math.max(1, Math.ceil(7 / sponsors.length)) : 1

  return (
    <section className="border-y border-border bg-card" aria-labelledby="sponsors-title">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Liga del Parque
            </p>
            <h2 id="sponsors-title" className="font-heading text-2xl font-extrabold text-foreground">
              Sponsors oficiales
            </h2>
          </div>
        </div>

        <div
          className={`${styles.viewport} rounded-2xl border border-border bg-surface py-4 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
          tabIndex={hasMotion ? 0 : undefined}
          role="region"
          aria-label="Logos de sponsors"
        >
          <div className={styles.track} data-paused={!hasMotion}>
            <div className={styles.group}>
              {Array.from({ length: copiesPerGroup }, (_, copyIndex) => (
                <div
                  key={copyIndex}
                  className={`${styles.copy} ${copyIndex > 0 ? styles.extraCopy : ""}`}
                  aria-hidden={copyIndex > 0 ? true : undefined}
                >
                  {sponsors.map((sponsor) => (
                    <SponsorLogo key={sponsor.id} sponsor={sponsor} duplicate={copyIndex > 0} />
                  ))}
                </div>
              ))}
            </div>
            {hasMotion && (
              <div className={`${styles.group} ${styles.duplicate}`} aria-hidden="true">
                {Array.from({ length: copiesPerGroup }, (_, copyIndex) => (
                  <div key={copyIndex} className={styles.copy}>
                    {sponsors.map((sponsor) => (
                      <SponsorLogo key={sponsor.id} sponsor={sponsor} duplicate />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SponsorLogo({
  sponsor,
  duplicate = false,
}: {
  sponsor: SponsorBannerItem
  duplicate?: boolean
}) {
  return (
    <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm sm:h-28 sm:w-44">
      <Image
        src={sponsor.image}
        alt={duplicate ? "" : `Logo de ${sponsor.name}`}
        width={176}
        height={112}
        sizes="(min-width: 640px) 176px, 144px"
        className="max-h-full w-full object-contain"
      />
    </div>
  )
}
