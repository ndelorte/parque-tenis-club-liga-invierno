// Los paneles admin quedan siempre en claro (plan-refactor-visual.md §3.4).
export default function PanelCircuitoLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light min-h-dvh bg-background text-foreground">{children}</div>
}
