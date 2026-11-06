import { SectionShell } from "@/components/layout/section-shell"
import "@/components/liga/season-views.css"
import "@/components/liga/medals.css"

export default function LigasLayout({ children }: { children: React.ReactNode }) {
  return <SectionShell>{children}</SectionShell>
}
