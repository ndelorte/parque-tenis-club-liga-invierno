import { SectionShell } from "@/components/layout/section-shell"
import { CircuitoNav } from "@/components/circuito/circuito-nav"
import { getMmActiveEdition } from "@/lib/data/mid-master"

export default async function CircuitoDelParqueLayout({ children }: { children: React.ReactNode }) {
  const midMaster = await getMmActiveEdition()

  return (
    <SectionShell identity="circuito">
      <CircuitoNav year={new Date().getFullYear()} midMasterSlug={midMaster?.slug ?? null} />
      {children}
    </SectionShell>
  )
}
