"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const subscribe = () => () => {}

// El tema real solo se conoce en el cliente: hasta montar se muestra un botón
// neutro para no romper la hidratación.
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? (isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro") : "Cambiar tema"}
      className={cn(
        "press inline-flex size-11 items-center justify-center rounded-md border border-board-foreground/25 text-board-foreground transition-colors hover:bg-board-foreground/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground",
        className,
      )}
    >
      {isDark ? <Sun aria-hidden="true" className="size-[18px]" /> : <Moon aria-hidden="true" className="size-[18px]" />}
    </button>
  )
}
