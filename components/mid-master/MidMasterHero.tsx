import Image from "next/image"
import Link from "next/link"
import { CourtLines } from "./CourtLines"

interface Props {
  name: string
  year: number
  categoriesCount: number
  participantsCount: number
}

/**
 * Hero de la edición de Especiales (hoy: Mid Master). Sigue
 * product/refactor-visual/maquetas/fase-4/Opcion1-EspecialesEdicion.dc.html:
 * Playfair solo en el nombre propio del evento, resto Barlow/Barlow
 * Condensed. El trazo dorado de CourtLines es el único movimiento de la
 * pantalla.
 */
export function MidMasterHero({ name, year, categoriesCount, participantsCount }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-mm-gold-muted bg-mm-bg">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-8 pt-6 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-center md:gap-10 md:pb-12 md:pt-8">
        <div className="grid content-start gap-3.5">
          <nav aria-label="Estás en" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-mm-text-muted">
            <Link
              href="/circuito-del-parque"
              className="inline-flex min-h-11 items-center hover:text-mm-gold-light"
            >
              Circuito del Parque
            </Link>
            <span aria-hidden="true">/</span>
            <span>Especiales</span>
          </nav>

          <p className="flex items-center gap-3 text-[15px] font-semibold text-mm-text-muted">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mm-plaque">
              <Image src="/images/logopngcdp.png" alt="" width={40} height={40} className="size-10 object-contain" />
            </span>
            Torneo especial del Circuito del Parque
          </p>

          <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.005em] text-mm-text">
            <span className="font-mm-display">{name}</span>
            <small className="mt-2.5 block font-heading text-[0.42em] font-bold uppercase tracking-[0.02em] text-mm-gold">
              Edición {year}
            </small>
          </h1>

          <p className="max-w-[52ch] text-[17px] text-mm-text-muted">
            El torneo de mitad de año. Dos zonas de todos contra todos por categoría, los dos
            primeros de cada zona a semifinales y la final a tres sets completos.
          </p>

          <dl className="mt-1.5 grid w-fit grid-cols-2 justify-start gap-x-7 gap-y-0">
            <div>
              <dt className="text-[13px] text-mm-text-muted">Categorías</dt>
              <dd className="font-heading text-[26px] font-bold leading-[1.1] text-mm-gold-light tabular-nums">
                {categoriesCount}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-mm-text-muted">Inscriptos</dt>
              <dd className="font-heading text-[26px] font-bold leading-[1.1] text-mm-gold-light tabular-nums">
                {participantsCount}
              </dd>
            </div>
          </dl>

          <Link
            href="#categorias"
            className="mt-1.5 inline-flex min-h-12 w-fit items-center gap-2 rounded-sm border border-mm-gold px-5 text-sm font-bold text-mm-gold-light transition-colors hover:bg-mm-gold-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-gold-light"
          >
            Ver categorías
          </Link>
        </div>

        <CourtLines />
      </div>
    </section>
  )
}
