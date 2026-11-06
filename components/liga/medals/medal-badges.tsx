"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { medalDescription } from "@/lib/liga/medals/label"
import type { MedalView } from "@/lib/liga/medals/types"
import { MedalFicha } from "./medal-ficha"
import { MedalGlyph } from "./medal-glyph"

// Medallas por equipo para toda una página: el servidor las pide en una sola
// consulta y las deja acá; cada nombre de equipo busca las suyas por id sin
// que haya que pasarlas componente por componente.
const MedalsContext = createContext<Record<string, MedalView[]>>({})

export function TeamMedalsProvider({ medals, children }: { medals: Record<string, MedalView[]>; children: ReactNode }) {
  return <MedalsContext.Provider value={medals}>{children}</MedalsContext.Provider>
}

// Solo el logito de cada medalla, al lado del nombre del equipo. Si no hay
// medallas (o no hay proveedor) no dibuja nada.
export function TeamMedals({ teamId }: { teamId?: string | null }) {
  const all = useContext(MedalsContext)
  const medals = teamId ? all[teamId] : undefined
  if (!medals || medals.length === 0) return null
  return (
    <span className="liga-medals" role="group" aria-label="Medallas de podios anteriores">
      {medals.map((medal, index) => (
        <MedalBadge key={`${medal.tournamentSlug}-${medal.categorySlug}-${medal.place}-${index}`} medal={medal} />
      ))}
    </span>
  )
}

type Position = { x: number; y: number; above: boolean; host: HTMLElement }

const POPOVER_MAX_REM = 16
const MARGIN = 8

function MedalBadge({ medal }: { medal: MedalView }) {
  const text = medalDescription(medal)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLSpanElement>(null)
  const lastPointer = useRef("")
  const [position, setPosition] = useState<Position | null>(null)
  const open = position !== null

  function show() {
    const el = button.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewport = window.innerWidth
    // Se centra bajo la medalla, sin salirse del ancho de la pantalla. El
    // ancho real depende del texto: se usa el máximo para no medirlo.
    const half = Math.min(POPOVER_MAX_REM * 16, viewport - MARGIN * 2) / 2
    const center = rect.left + rect.width / 2
    const x = Math.min(Math.max(center, MARGIN + half), viewport - MARGIN - half)
    const above = rect.bottom + 64 > window.innerHeight && rect.top > 64
    // El popover va en el <body> (o en el <dialog> abierto, que queda por
    // encima de todo) para que no lo recorte ningún overflow: el cuadro de
    // playoffs y las tablas scrollean.
    const host = el.closest("dialog") ?? document.body
    setPosition({ x, y: above ? rect.top - 6 : rect.bottom + 6, above, host })
  }
  const hide = () => setPosition(null)

  // Mientras está abierta: Escape, tocar afuera, scroll y resize la cierran.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPosition(null)
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!button.current?.contains(target) && !popover.current?.contains(target)) setPosition(null)
    }
    const close = () => setPosition(null)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        className="liga-medal-button"
        aria-label={text}
        aria-expanded={open}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") show()
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") hide()
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) show()
        }}
        onBlur={hide}
        onClick={(event) => {
          // En el celular el toque abre y cierra; con mouse o teclado solo abre
          // (el hover o el foco ya la abrieron: alternar la cerraría de golpe).
          const touch = lastPointer.current === "touch" || lastPointer.current === "pen"
          lastPointer.current = ""
          event.stopPropagation()
          if (touch && open) hide()
          else show()
        }}
      >
        <MedalGlyph place={medal.place} />
      </button>
      {position &&
        createPortal(
          // aria-hidden: el lector de pantalla ya lee el texto en el aria-label del botón.
          <span
            ref={popover}
            aria-hidden="true"
            className="liga-medal-popover"
            style={{ left: position.x, top: position.y, transform: position.above ? "translate(-50%, -100%)" : "translateX(-50%)" }}
          >
            <MedalFicha place={medal.place} text={text} />
          </span>,
          position.host,
        )}
    </>
  )
}
