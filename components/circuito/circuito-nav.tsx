"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface CircuitoNavProps {
  year: number
  midMasterSlug: string | null
}

interface NavLink {
  label: string
  href: string
  current: boolean
}

export function CircuitoNav({ year, midMasterSlug }: CircuitoNavProps) {
  const pathname = usePathname()

  // Mid Master / Final Master especiales tienen identidad propia, siempre
  // oscura (Fase 4 del refactor) — no llevan esta subnav del Circuito.
  if (pathname.startsWith("/circuito-del-parque/especiales")) return null

  const links: NavLink[] = [
    {
      label: "Torneos",
      href: "/circuito-del-parque",
      current: pathname === "/circuito-del-parque" || pathname.startsWith("/circuito-del-parque/torneos"),
    },
    {
      label: `Ranking ${year}`,
      href: "/circuito-del-parque/ranking",
      current: pathname.startsWith("/circuito-del-parque/ranking"),
    },
    {
      label: "Final Master",
      href: "/circuito-del-parque/final-master",
      current: pathname.startsWith("/circuito-del-parque/final-master"),
    },
  ]

  if (midMasterSlug) {
    links.push({
      label: "Mid Master",
      href: `/circuito-del-parque/especiales/${midMasterSlug}`,
      current: pathname.startsWith(`/circuito-del-parque/especiales/${midMasterSlug}`),
    })
  }

  return (
    <nav aria-label="Circuito del Parque" className="bg-court-net text-board-foreground">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/circuito-del-parque"
          className="flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded bg-board-foreground">
            <Image src="/images/logopngcdp.png" alt="" width={30} height={30} className="size-[30px] object-contain" />
          </span>
          <span className="font-heading text-lg font-extrabold uppercase tracking-wide">Circuito del Parque</span>
        </Link>

        <div className="hidden items-stretch gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className="flex items-center text-[15px] font-semibold hover:underline underline-offset-[6px] focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-board-foreground aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-clay)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Fila de navegación en celular: en lg+ los links ya están en la fila
          del logo (arriba) y esta fila se oculta. */}
      <div className="overflow-x-auto overscroll-x-contain lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-semibold hover:underline underline-offset-[6px] focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-board-foreground aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-clay)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
