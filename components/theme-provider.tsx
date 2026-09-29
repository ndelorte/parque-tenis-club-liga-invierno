"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

// Modo oscuro: sigue al sistema y se puede cambiar desde el header
// (plan-refactor-visual.md §3.4). Guarda la elección en localStorage.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
