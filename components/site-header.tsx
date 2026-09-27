"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, MessageCircle, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CLUB, NAV_LINKS, waLink } from "@/lib/site"
import { cn } from "@/lib/utils"

const WA_MESSAGE = "Hola! Quiero hacer una consulta sobre Parque Tenis Club."

function isCurrent(pathname: string, href: string) {
  // Los links a secciones de la home (/#actividades) no marcan página actual.
  return !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`))
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 bg-board text-board-foreground">
      <a
        href="#contenido"
        className="absolute left-4 top-0 z-10 -translate-y-full rounded-md bg-card px-4 py-2.5 font-semibold text-card-foreground focus:translate-y-3"
      >
        Saltar al contenido
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:gap-8 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground">
          <Image src="/images/LOGO.png" alt="" width={44} height={44} className="size-10 shrink-0 lg:size-11" priority />
          <span className="truncate font-heading text-xl font-extrabold uppercase tracking-[0.01em] lg:text-2xl">
            {CLUB.name}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 justify-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className="rounded-sm text-[15px] font-medium underline-offset-[6px] hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-board-foreground aria-[current=page]:underline aria-[current=page]:decoration-clay aria-[current=page]:decoration-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <a
            href={waLink(WA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="press hidden h-11 items-center gap-2 rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground transition-[filter] hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground sm:inline-flex"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            className="press inline-flex size-11 items-center justify-center rounded-md border border-board-foreground/25 transition-colors hover:bg-board-foreground/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground lg:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menú del celular: entra y sale por el mismo lado (§3.5, ease-drawer 250 ms). */}
      <div
        id="menu-movil"
        inert={!open}
        className={cn(
          "absolute inset-x-0 top-full border-t border-board-foreground/15 bg-board shadow-lg transition-[transform,opacity,visibility] duration-[250ms] ease-(--ease-drawer) motion-reduce:transition-none lg:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label="Principal" className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className="flex min-h-12 items-center border-b border-board-foreground/10 font-heading text-2xl font-bold uppercase last:border-b-0 underline-offset-8 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground aria-[current=page]:underline aria-[current=page]:decoration-clay aria-[current=page]:decoration-[3px]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={waLink(WA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="press mb-2 mt-3 flex h-12 items-center justify-center gap-2 rounded-md bg-accent font-semibold text-accent-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Consultar por WhatsApp
          </a>
        </nav>
      </div>
    </header>
  )
}
