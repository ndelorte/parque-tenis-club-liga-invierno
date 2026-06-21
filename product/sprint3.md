Voy a pasarte componentes generados por v0 para la landing.
Tu tarea:
- Integrarlos a la estructura actual del proyecto.
- Separar componentes si hace falta.
- Reemplazar datos hardcodeados por datos desde /content/site.ts.
- Mantener TypeScript estricto.
- Mantener rutas existentes.
- No modificar reglas del torneo.
- No tocar Supabase.
- No agregar login visible.
- Ejecutar lint y build al final.
Componentes v0:

app/page.tsx

import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Activities } from "@/components/activities"
import { WinterLeague } from "@/components/winter-league"
import { LocationContact } from "@/components/location-contact"
import { SiteFooter } from "@/components/site-footer"
import { WhatsappFab } from "@/components/whatsapp-fab"

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main>
        <Hero />
        <Activities />
        <WinterLeague />
        <LocationContact />
      </main>
      <SiteFooter />
      <WhatsappFab />
    </div>
  )
}


components/activities.tsx

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
                <Button
                  asChild
                  variant="secondary"
                  className="w-fit"
                >
                  <a
                    href={waLink(act.waMessage)}
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


components/hero.tsx

import Image from "next/image"
import { MessageCircle, Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLUB, waLink } from "@/lib/site"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/hero-court.png"
        alt="Jugadores de tenis en una cancha de polvo de ladrillo al atardecer"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-foreground/30" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-background/30 bg-background/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-background backdrop-blur-sm">
          <span className="size-2 rounded-full bg-accent" />
          {CLUB.tagline}
        </span>

        <h1 className="max-w-3xl text-balance font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-background sm:text-6xl lg:text-7xl">
          Viví el tenis en{" "}
          <span className="text-accent">Parque Tenis Club</span>
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-background/80">
          Canchas, entrenamientos, escuela y torneos durante todo el año. Vení a
          jugar y sumate a la comunidad.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-13 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
          >
            <a
              href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-5" />
              Consultar por WhatsApp
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-13 border-background/40 bg-background/10 px-7 text-base text-background backdrop-blur-sm hover:bg-background/20 hover:text-background"
          >
            <a href="#liga">
              <Trophy className="size-5" />
              Liga de Invierno
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}


components/location-contact.tsx

import { MapPin, Clock, Phone, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLUB, waLink } from "@/lib/site"

export function LocationContact() {
  return (
    <>
      <section id="ubicacion" className="bg-secondary/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                Ubicación
              </span>
              <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Te esperamos en el club
              </h2>
              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground">
                    {CLUB.address}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground">
                    {CLUB.hours}
                  </span>
                </li>
              </ul>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-sm">
              <iframe
                title="Mapa de ubicación de Parque Tenis Club"
                src={CLUB.mapsEmbed}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Contacto
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Escribinos y vení a jugar
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Respondemos tus consultas por WhatsApp de forma rápida. Te contamos
            horarios, valores y disponibilidad.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-13 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
            >
              <a
                href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" />
                Escribir por WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-8">
            <a
              href={`tel:+${CLUB.whatsapp}`}
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Phone className="size-4 text-primary" />
              {CLUB.phoneDisplay}
            </a>
            <a
              href={`mailto:${CLUB.email}`}
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="size-4 text-primary" />
              {CLUB.email}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}


components/site-footer.tsx

import { MapPin } from "lucide-react"
import { CLUB, NAV_LINKS } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            PT
          </span>
          <div>
            <p className="font-heading font-bold tracking-tight">{CLUB.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {CLUB.address}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/60 py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {CLUB.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}


components/site-header.tsx

"use client"

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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            PT
          </span>
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


components/whatsapp-fab.tsx

import { MessageCircle } from "lucide-react"
import { waLink } from "@/lib/site"

export function WhatsappFab() {
  return (
    <a
      href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-accent/20 transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7" />
    </a>
  )
}


components/winter-league.tsx

import Image from "next/image"
import { Trophy, Calendar, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { waLink } from "@/lib/site"

const FEATURES = [
  { icon: Calendar, label: "Junio a Septiembre" },
  { icon: Users, label: "Categorías por nivel" },
  { icon: Trophy, label: "Premios y ranking" },
]

export function WinterLeague() {
  return (
    <section id="liga" className="bg-primary py-20 text-primary-foreground sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            <Trophy className="size-3.5" />
            Liga de Invierno
          </span>
          <h2 className="mt-5 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Competí todo el invierno
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-primary-foreground/80">
            La liga más esperada del club. Partidos semanales, categorías para
            todos los niveles y mucho tenis aunque haga frío. Sumate y peleá tu
            lugar en el ranking.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 font-medium">
                <f.icon className="size-5 text-accent" />
                {f.label}
              </li>
            ))}
          </ul>

          <Button
            asChild
            size="lg"
            className="mt-9 h-13 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
          >
            <a
              href={waLink(
                "Hola! Quiero inscribirme en la Liga de Invierno de Parque Tenis Club.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-5" />
              Quiero inscribirme
            </a>
          </Button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-primary-foreground/20">
          <Image
            src="/images/liga-invierno.png"
            alt="Jugadores compitiendo en la Liga de Invierno"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}


lib/site.ts

// Mock data for Parque Tenis Club. No backend, no reservations system.

export const CLUB = {
  name: "Parque Tenis Club",
  shortName: "Parque Tenis",
  tagline: "Tu club de tenis en Argentina",
  phoneDisplay: "+54 9 11 5555-1234",
  // Mock WhatsApp number (international format, no +, no spaces)
  whatsapp: "5491155551234",
  email: "hola@parquetenisclub.com.ar",
  address: "Av. del Parque 1234, Buenos Aires, Argentina",
  hours: "Lun a Dom · 7:00 a 23:00",
  // Mock map embed (generic Buenos Aires area)
  mapsEmbed:
    "https://www.google.com/maps?q=Buenos+Aires+Argentina&output=embed",
} as const

export function waLink(message: string) {
  return `https://wa.me/${CLUB.whatsapp}?text=${encodeURIComponent(message)}`
}

export const NAV_LINKS = [
  { label: "Actividades", href: "#actividades" },
  { label: "Liga de Invierno", href: "#liga" },
  { label: "Ubicación", href: "#ubicacion" },
  { label: "Contacto", href: "#contacto" },
]

export const ACTIVITIES = [
  {
    id: "alquiler",
    title: "Alquiler de canchas",
    description:
      "Canchas de polvo de ladrillo en excelente estado. Reservá tu horario y vení a jugar con amigos.",
    image: "/images/alquiler-canchas.png",
    points: ["Polvo de ladrillo", "Iluminación nocturna", "Vestuarios"],
    waMessage:
      "Hola! Quiero consultar por el alquiler de canchas en Parque Tenis Club.",
  },
  {
    id: "entrenamientos",
    title: "Entrenamientos",
    description:
      "Clases personalizadas para todos los niveles. Mejorá tu técnica con profesores certificados.",
    image: "/images/entrenamientos.png",
    points: ["Profes certificados", "Grupos reducidos", "Todos los niveles"],
    waMessage:
      "Hola! Quiero info sobre los entrenamientos en Parque Tenis Club.",
  },
  {
    id: "escuela",
    title: "Escuela de tenis",
    description:
      "Formación para chicos y chicas. Aprenden jugando, en un ambiente seguro y divertido.",
    image: "/images/escuela-tenis.png",
    points: ["Desde los 5 años", "Profes formadores", "Ambiente seguro"],
    waMessage:
      "Hola! Quiero info sobre la escuela de tenis para chicos en Parque Tenis Club.",
  },
  {
    id: "torneos",
    title: "Torneos y competencia",
    description:
      "Competí todo el año en torneos por categorías. Ranking, premios y mucho tenis.",
    image: "/images/torneos.png",
    points: ["Por categorías", "Ranking del club", "Premios"],
    waMessage:
      "Hola! Quiero info sobre los torneos y la competencia en Parque Tenis Club.",
  },
] as const


lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
