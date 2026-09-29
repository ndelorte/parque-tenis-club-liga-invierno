"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, LayoutGrid } from "lucide-react"
import { PANEL_LIST, type PanelKey } from "./panels"
import { cn } from "@/lib/utils"

// Menú "Cambiar de panel" de escritorio. Es client solo para cerrar con
// Escape y con clic afuera; en el celular la misma lista va dentro del
// <details> del menú del shell.
export function PanelSwitcher({ current }: { current: PanelKey }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="cambiar-de-panel"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "press inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-[15px] font-bold transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open && "bg-surface",
        )}
      >
        <LayoutGrid className="size-[18px]" aria-hidden />
        Cambiar de panel
        <ChevronDown className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          id="cambiar-de-panel"
          className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[260px] rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          <ul role="list">
            {PANEL_LIST.map((p) => (
              <li key={p.key}>
                <Link
                  href={p.href}
                  aria-current={p.key === current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-2.5 rounded-md px-2.5 font-semibold text-foreground transition-colors hover:bg-surface aria-[current]:bg-brand-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <PanelLogo src={p.logo} size="sm" />
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PanelLogo({ src, size = "md" }: { src: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "sm" ? "size-[30px]" : size === "lg" ? "size-16" : "size-10"
  const px = size === "sm" ? 22 : size === "lg" ? 52 : 30
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-full border border-border bg-card", box)}>
      <Image src={src} alt="" width={px} height={px} className="object-contain" style={{ width: px, height: px }} />
    </span>
  )
}
