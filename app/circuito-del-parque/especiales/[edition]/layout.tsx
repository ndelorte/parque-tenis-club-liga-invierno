import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function EdicionEspecialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh bg-mm-bg text-mm-text">{children}</main>
      <SiteFooter />
    </>
  )
}
