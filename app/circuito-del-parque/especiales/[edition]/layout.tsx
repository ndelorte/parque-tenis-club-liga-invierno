export default function EdicionEspecialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SiteHeader/SiteFooter los pone el layout padre (app/circuito-del-parque/layout.tsx).
  return <main className="min-h-dvh bg-mm-bg text-mm-text">{children}</main>
}
