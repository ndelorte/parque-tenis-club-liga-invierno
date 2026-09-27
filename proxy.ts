import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isAdminUser } from "@/lib/auth/admin"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() valida la sesión contra Supabase (seguro, no solo lee la cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Compat: rutas viejas de los paneles (pre-rename) → 301 a las nuevas.
  if (path === "/panel-parque" || path.startsWith("/panel-parque/")) {
    const url = request.nextUrl.clone()
    url.pathname = path.replace("/panel-parque", "/panel-liga")
    return NextResponse.redirect(url, 301)
  }
  if (path === "/panel-master" || path.startsWith("/panel-master/")) {
    const url = request.nextUrl.clone()
    url.pathname = path.replace("/panel-master", "/panel-circuito")
    return NextResponse.redirect(url, 301)
  }

  const isAdmin = isAdminUser(user)

  // Prefijo del panel actual → { home, login }. Se agrega una entrada acá
  // por cada panel nuevo en vez de apilar ternarios binarios a mano.
  const PANELS = [
    { prefix: "/panel-liga", home: "/panel-liga", login: "/panel-liga/login" },
    { prefix: "/panel-circuito", home: "/panel-circuito", login: "/panel-circuito/login" },
    { prefix: "/panel-interparque", home: "/panel-interparque", login: "/panel-interparque/login" },
  ] as const

  const panel = PANELS.find((p) => path.startsWith(p.prefix)) ?? PANELS[0]
  const isLoginPage = path === panel.login

  if (isLoginPage) {
    if (user && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = panel.home
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user || !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = panel.login
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/panel-liga",
    "/panel-liga/:path*",
    "/panel-circuito",
    "/panel-circuito/:path*",
    "/panel-parque",
    "/panel-parque/:path*",
    "/panel-master",
    "/panel-master/:path*",
    "/panel-interparque",
    "/panel-interparque/:path*",
  ],
}
