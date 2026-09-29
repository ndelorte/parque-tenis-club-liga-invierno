import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export type SectionIdentity = "liga-invierno" | "liga-verano" | "circuito" | "interparque"

// Header + contenido + footer de las secciones públicas. `identity` activa los
// tokens de la sub-identidad (--section-*, ver app/globals.css).
export function SectionShell({
  identity,
  children,
}: {
  identity?: SectionIdentity
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <div id="contenido" data-identity={identity} className="scroll-mt-20">
        {children}
      </div>
      <SiteFooter />
    </>
  )
}
