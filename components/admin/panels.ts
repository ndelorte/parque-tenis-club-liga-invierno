import {
  CalendarClock,
  CalendarDays,
  ImagePlus,
  ListChecks,
  Megaphone,
  PlusCircle,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"

// Datos de los tres paneles admin. Este archivo vive en components/admin, así
// que es el único lugar (junto con los paneles mismos) donde pueden aparecer
// hrefs a /panel-* — ninguna página pública los linkea (CLAUDE.md, "Admin
// invisible").

export type PanelKey = "liga" | "circuito" | "interparque"

export interface PanelInfo {
  key: PanelKey
  name: string
  href: string
  logo: string
}

export const PANELS: Record<PanelKey, PanelInfo> = {
  liga: {
    key: "liga",
    name: "Panel de Liga",
    href: "/panel-liga",
    logo: "/images/logoligadeinvierno.png",
  },
  circuito: {
    key: "circuito",
    name: "Panel del Circuito",
    href: "/panel-circuito",
    logo: "/images/logopngcdp.png",
  },
  interparque: {
    key: "interparque",
    name: "Panel de Interparque",
    href: "/panel-interparque",
    logo: "/images/LOGO.png",
  },
}

export const PANEL_LIST: PanelInfo[] = [PANELS.liga, PANELS.circuito, PANELS.interparque]

export interface PanelSection {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

// Secciones de la barra lateral. Liga usa ?seccion=; Circuito son dos rutas;
// Interparque es una sola página, así que sus secciones son anclas.
export const PANEL_SECTIONS: Record<PanelKey, PanelSection[]> = {
  liga: [
    { key: "resultados", label: "Resultados", href: "/panel-liga?seccion=resultados", icon: Trophy },
    { key: "jugadores", label: "Jugadores", href: "/panel-liga?seccion=jugadores", icon: Users },
    { key: "fixture", label: "Fixture", href: "/panel-liga?seccion=fixture", icon: CalendarClock },
    { key: "playoffs", label: "Playoffs", href: "/panel-liga?seccion=playoffs", icon: Swords },
    { key: "fotos", label: "Fotos", href: "/panel-liga?seccion=fotos", icon: ImagePlus },
    { key: "sponsors", label: "Sponsors", href: "/panel-liga?seccion=sponsors", icon: Megaphone },
  ],
  circuito: [
    { key: "mid-master", label: "Mid Master", href: "/panel-circuito", icon: Trophy },
    { key: "mensual", label: "Circuito mensual", href: "/panel-circuito/mensual", icon: CalendarDays },
  ],
  interparque: [
    { key: "nuevo-partido", label: "Nuevo partido", href: "#nuevo-partido", icon: PlusCircle },
    { key: "partidos", label: "Partidos cargados", href: "#partidos", icon: ListChecks },
  ],
}

export const LIGA_SECTION_KEYS = PANEL_SECTIONS.liga.map((s) => s.key)
