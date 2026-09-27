export default function EdicionEspecialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SiteHeader/SiteFooter los pone el layout padre (app/circuito-del-parque/layout.tsx).
  // Especiales (Mid Master, Final Master) se ven siempre en oscuro.
  return <main className="dark min-h-dvh bg-mm-bg text-mm-text">{children}</main>
}
