"use client"

import Image from "next/image"
import { useState } from "react"
import { Menu, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLUB, NAV_LINKS, waLink } from "@/lib/site"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2">
          <Image
            src="/images/LOGO.png"
            alt={CLUB.name}
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
          <span className="font-heading text-lg font-bold tracking-tight">
            {CLUB.shortName}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a
              href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <a
                href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Consultar por WhatsApp
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
