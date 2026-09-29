"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isAdminUser } from "@/lib/auth/admin"
import { cn } from "@/lib/utils"
import { PanelLogo } from "./panel-switcher"
import { PANELS, type PanelKey } from "./panels"

// Login común de los tres paneles (maqueta Fase 5): cambia solo el logo, el
// nombre y a dónde se redirige. Misma autenticación que tenía cada login.
export function LoginCard({ panel }: { panel: PanelKey }) {
  const info = PANELS[panel]
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<{ title: string; hint?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError({
        title: "Email o contraseña incorrectos.",
        hint: "Revisá los datos. Si no tenés acceso, pedíselo al organizador del club.",
      })
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!isAdminUser(user)) {
      await supabase.auth.signOut()
      setError({ title: "No tenés permisos de administrador." })
      setLoading(false)
      return
    }

    router.push(info.href)
    router.refresh()
  }

  const fieldClass =
    "min-h-11 w-full rounded-md border-[1.5px] border-border-strong bg-card px-3 text-foreground transition-colors focus-visible:border-accent focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-accent aria-invalid:border-loss"

  return (
    <div className="theme-light relative grid min-h-dvh place-content-center gap-3.5 bg-background px-4 py-8 text-foreground">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[132px] bg-board" />
      <main className="relative grid w-[min(400px,100%)] gap-3.5">
        <div className="rounded-lg border border-border border-t-4 border-t-clay bg-card px-5 py-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3.5">
            <PanelLogo src={info.logo} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Parque Tenis Club · acceso privado</p>
              <h1 className="font-heading text-[30px] font-extrabold uppercase leading-none">{info.name}</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3.5" noValidate>
            <div aria-live="polite">
              {error && (
                <div
                  role="alert"
                  id="login-error"
                  className="flex items-start gap-3 rounded-lg border-l-4 border-loss bg-loss-soft px-4 py-3.5"
                >
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-loss" aria-hidden />
                  <div>
                    <p className="font-bold">{error.title}</p>
                    {error.hint && <p className="text-sm">{error.hint}</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="login-email" className="text-[15px] font-semibold">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className={fieldClass}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="login-password" className="text-[15px] font-semibold">
                Contraseña
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "press inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-bold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-foreground",
              )}
            >
              {loading ? "Ingresando…" : "Ingresar al panel"}
            </button>
          </form>
        </div>
        <p className="mx-auto max-w-[40ch] text-center text-sm text-muted-foreground">
          Solo para organizadores. Si llegaste acá por error, cerrá esta pestaña.
        </p>
      </main>
    </div>
  )
}
