"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isAdminUser } from "@/lib/auth/admin"

export default function PanelMasterLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError("Email o contraseña incorrectos.")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!isAdminUser(user)) {
      await supabase.auth.signOut()
      setError("No tenés permisos de administrador.")
      setLoading(false)
      return
    }

    router.push("/panel-circuito")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mm-bg px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mm-text-muted">
            Parque Tenis Club
          </p>
          <h1 className="mt-3 font-mm-display text-3xl font-bold text-mm-text">
            Mid Master
          </h1>
          <div className="mx-auto my-4 h-px w-12 bg-mm-gold opacity-60" />
          <p className="text-sm text-mm-text-muted">Panel de administración</p>
        </div>

        {/* Form */}
        <div className="border border-mm-border bg-mm-surface p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-mm-text-muted">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@parquetenis.com"
                className="w-full border border-mm-border bg-mm-bg px-3 py-2.5 text-sm text-mm-text placeholder:text-mm-text-faint focus:outline-none focus:ring-1 focus:ring-mm-gold/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-mm-text-muted">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-mm-border bg-mm-bg px-3 py-2.5 text-sm text-mm-text placeholder:text-mm-text-faint focus:outline-none focus:ring-1 focus:ring-mm-gold/50"
              />
            </div>

            {error && (
              <p className="border border-red-900/30 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-mm-gold/60 py-2.5 text-sm font-medium uppercase tracking-[0.1em] text-mm-gold transition-colors hover:border-mm-gold hover:bg-mm-gold/5 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
