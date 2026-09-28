import Image from "next/image"
import Link from "next/link"
import { CLUB, NAV_LINKS } from "@/lib/site"

// Sin teléfonos ni links a los paneles admin (CLAUDE.md).
export function SiteFooter() {
  return (
    <footer className="bg-board text-board-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="flex items-start gap-4">
          <Image src="/images/LOGO.png" alt="" width={64} height={64} className="size-14 shrink-0 md:size-16" />
          <div className="flex flex-col gap-1.5 text-[15px] text-board-foreground/80">
            <p className="font-heading text-2xl font-extrabold uppercase tracking-[0.01em] text-board-foreground">
              {CLUB.name}
            </p>
            <address className="not-italic">{CLUB.address}</address>
            <p>Desarrollado por Nicolás Delorte</p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </div>

        <nav aria-label="Pie" className="grid grid-cols-2 gap-x-12 gap-y-3 text-[15px]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-board-foreground/80 underline-offset-4 hover:text-board-foreground hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
