"use client"

import "@/components/liga/medals.css"
import { MedalFicha } from "@/components/liga/medals/medal-ficha"
import { medalDescription } from "@/lib/liga/medals/label"
import { candidateKey, type MedalCandidate } from "@/lib/liga/medals/candidates"

const MATCH_LABEL = { same: "Mismo nombre", similar: "Nombre parecido" } as const

function CandidateRow({
  candidate,
  checked,
  disabled,
  onToggle,
}: {
  candidate: MedalCandidate
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <label className="flex min-h-11 items-start gap-3 rounded-md px-1 py-1.5">
        <input type="checkbox" className="mt-1.5 size-5" checked={checked} disabled={disabled} onChange={onToggle} />
        <span className="grid min-w-0 gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <MedalFicha place={candidate.place} text={medalDescription(candidate)} />
            {candidate.match && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand">{MATCH_LABEL[candidate.match]}</span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {candidate.categoryName} · en esa edición figura como <strong className="text-foreground">{candidate.historicName}</strong>
          </span>
        </span>
      </label>
    </li>
  )
}

// Paso "Podios anteriores": el panel sugiere los podios cuyo nombre se parece
// al del equipo (las coincidencias exactas vienen tildadas, las parecidas no)
// y el organizador tilda los que corresponden. El resto de los podios queda
// plegado, por si el cruce por nombre no encontró uno.
export function MedalsStep({
  candidates,
  selected,
  disabled,
  onToggle,
}: {
  candidates: MedalCandidate[]
  selected: Set<string>
  disabled: boolean
  onToggle: (key: string) => void
}) {
  const matches = candidates.filter((c) => c.match)
  const others = candidates.filter((c) => !c.match)
  const row = (c: MedalCandidate) => (
    <CandidateRow key={candidateKey(c)} candidate={c} checked={selected.has(candidateKey(c))} disabled={disabled} onToggle={() => onToggle(candidateKey(c))} />
  )

  return (
    <section aria-labelledby="medals-step-title" className="rounded-lg border border-border p-3">
      <h3 id="medals-step-title" className="font-bold">Podios anteriores</h3>
      <p className="text-sm text-muted-foreground">
        Las medallas tildadas quedan en el equipo y se muestran en el sitio. Revisá que el equipo sea el mismo.
      </p>
      {matches.length > 0 ? (
        <ul className="mt-2 grid gap-1">{matches.map(row)}</ul>
      ) : (
        <p className="mt-2 text-sm">No encontramos podios con un nombre parecido.</p>
      )}
      {others.length > 0 && (
        <details className="mt-2">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">Otros podios ({others.length}) — el nombre no coincide</summary>
          <ul className="grid gap-1">{others.map(row)}</ul>
        </details>
      )}
    </section>
  )
}
