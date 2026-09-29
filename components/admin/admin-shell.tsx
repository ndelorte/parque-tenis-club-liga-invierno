import Link from "next/link"
import { ChevronDown, ExternalLink, LogOut } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { signOutMaster } from "@/app/actions/mid-master"
import { signOutInterparque } from "@/app/actions/interparque"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PanelLogo, PanelSwitcher } from "./panel-switcher"
import { PANELS, PANEL_LIST, PANEL_SECTIONS, type PanelKey } from "./panels"

// Patrón elegido: cada página renderiza <AdminShell> (no el layout).
// El layout no conoce la página, y el shell necesita cosas que solo la página
// sabe (edición activa, sección actual, a qué página pública corresponde lo
// que se está editando). Así todo sale renderizado en el servidor, sin
// contexto ni efectos que "avisen" al layout después, y los /login quedan
// fuera del shell sin route groups. Los layouts solo fijan el tema claro.

const SIGN_OUT = {
  liga: signOut,
  circuito: signOutMaster,
  interparque: signOutInterparque,
} as const

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
const btnBase = "press min-h-11 h-auto rounded-md px-4 text-[15px] font-bold"

interface AdminShellProps {
  panel: PanelKey
  /** Línea de contexto bajo el nombre del panel (edición activa, etc.). */
  context?: string
  /** `key` de la sección activa dentro de PANEL_SECTIONS[panel]. */
  currentSection: string
  /** Página pública equivalente a lo que se está editando. Sin valor, no hay botón. */
  publicHref?: string
  children: React.ReactNode
}

export function AdminShell({ panel, context, currentSection, publicHref, children }: AdminShellProps) {
  const info = PANELS[panel]
  const sections = PANEL_SECTIONS[panel]
  const currentLabel = sections.find((s) => s.key === currentSection)?.label ?? sections[0].label
  const signOutAction = SIGN_OUT[panel]

  return (
    <>
      <a
        href="#contenido-panel"
        className="sr-only z-50 rounded-md bg-card px-3.5 py-2.5 font-bold text-foreground shadow-md focus-visible:not-sr-only focus-visible:fixed focus-visible:left-3 focus-visible:top-3 focus-visible:outline-3 focus-visible:outline-accent"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-[inset_0_4px_0_var(--color-clay)]">
        <div className="flex items-center gap-3 px-4 pb-2.5 pt-3.5">
          <Link
            href={info.href}
            className={cn("flex min-h-11 min-w-0 flex-1 items-center gap-3 text-inherit no-underline", focusRing, "rounded-md")}
          >
            <PanelLogo src={info.logo} />
            <span className="grid min-w-0">
              <span className="truncate font-heading text-[22px] font-extrabold uppercase leading-[1.05]">
                {info.name}
              </span>
              {context && <span className="truncate text-sm text-muted-foreground">{context}</span>}
            </span>
          </Link>

          {/* Siempre visible, también en el celular. */}
          {publicHref && <PublicLink href={publicHref} />}

          <div className="hidden items-center gap-2 md:flex">
            <PanelSwitcher current={panel} />
            <SignOutButton action={signOutAction} />
          </div>
        </div>

        {/* Celular: sección actual + menú. `key` lo cierra al cambiar de sección. */}
        <details key={currentSection} className="group border-t border-border md:hidden">
          <summary
            className={cn(
              "press flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-1.5 [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            <span className="grid min-w-0">
              <span className="text-sm text-muted-foreground">Sección</span>
              <span className="truncate font-bold">{currentLabel}</span>
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-md border-[1.5px] border-border-strong px-3 font-bold">
              Menú
              <ChevronDown
                className="size-[18px] transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </span>
          </summary>
          <div className="grid max-h-[70vh] gap-2 overflow-y-auto overscroll-contain border-t border-border px-3 pb-4 pt-1">
            <nav aria-label="Secciones del panel">
              <SectionList panel={panel} current={currentSection} />
            </nav>
            <p className="px-3 pt-2.5 text-[13px] font-bold text-muted-foreground">Otros paneles</p>
            <ul role="list" className="grid gap-0.5">
              {PANEL_LIST.map((p) => (
                <li key={p.key}>
                  <Link
                    href={p.href}
                    aria-current={p.key === panel ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-md px-2.5 font-semibold text-foreground transition-colors hover:bg-surface aria-[current]:bg-brand-light",
                      focusRing,
                    )}
                  >
                    <PanelLogo src={p.logo} size="sm" />
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <SignOutButton action={signOutAction} full />
          </div>
        </details>
      </header>

      <div className="md:grid md:grid-cols-[232px_minmax(0,1fr)] md:items-start">
        <nav
          aria-label="Secciones del panel"
          className="hidden border-r border-border py-5 pl-4 pr-3 md:sticky md:top-[76px] md:block"
        >
          <SectionList panel={panel} current={currentSection} />
        </nav>
        <main
          id="contenido-panel"
          tabIndex={-1}
          className="mx-auto w-full min-w-0 max-w-[1040px] px-4 pb-10 pt-6 focus:outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent"
        >
          {children}
        </main>
      </div>
    </>
  )
}

function SectionList({ panel, current }: { panel: PanelKey; current: string }) {
  return (
    <ul role="list" className="grid gap-0.5">
      {PANEL_SECTIONS[panel].map(({ key, label, href, icon: Icon }) => (
        <li key={key}>
          <Link
            href={href}
            aria-current={key === current ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-2.5 rounded-md px-3 font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground motion-reduce:transition-none",
              "aria-[current]:bg-brand-light aria-[current]:font-bold aria-[current]:text-foreground",
              "aria-[current]:before:absolute aria-[current]:before:inset-y-2 aria-[current]:before:left-0 aria-[current]:before:w-[3px] aria-[current]:before:rounded-sm aria-[current]:before:bg-accent aria-[current]:before:content-['']",
              focusRing,
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SignOutButton({ action, full }: { action: () => Promise<void>; full?: boolean }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "outline" }),
          btnBase,
          "border-[1.5px] border-border-strong bg-card hover:border-foreground",
          full && "w-full",
          focusRing,
        )}
      >
        <LogOut className="size-[18px]" aria-hidden />
        Cerrar sesión
      </button>
    </form>
  )
}

// Abre la página pública equivalente en otra pestaña. El link va del panel al
// sitio; nunca al revés (los paneles no se linkean desde páginas públicas).
function PublicLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline" }),
        btnBase,
        "shrink-0 gap-2 border-[1.5px] border-border-strong bg-card px-3 hover:border-foreground sm:px-4",
        focusRing,
      )}
    >
      Ver en el sitio
      <ExternalLink className="size-4" aria-hidden />
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </Link>
  )
}

export function AdminPageHeader({
  title,
  lede,
  crumbs,
  actions,
}: {
  title: string
  lede?: string
  /** Miga de pan para páginas profundas; el último item es la página actual. */
  crumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
}) {
  return (
    <>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Ubicación" className="mb-2.5 text-sm">
          <ol role="list" className="flex flex-wrap">
            {crumbs.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "inline-flex min-w-0 items-center",
                  i > 0 && "before:px-2 before:text-muted-foreground before:content-['/']",
                )}
              >
                {c.href ? (
                  <Link
                    href={c.href}
                    className={cn("inline-flex min-h-8 items-center rounded font-semibold text-accent hover:underline", focusRing)}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-muted-foreground">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[clamp(28px,5vw,40px)] font-extrabold uppercase leading-none">{title}</h1>
          {lede && <p className="mt-1.5 max-w-[65ch] text-muted-foreground">{lede}</p>}
        </div>
        {actions}
      </div>
    </>
  )
}
