import Image from "next/image"
import { MapPin } from "lucide-react"
import { CLUB, NAV_LINKS } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/images/LOGO.png"
            alt={CLUB.name}
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
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
