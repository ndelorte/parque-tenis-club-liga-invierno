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

  const isAdmin = isAdminUser(user)
  const isLoginPage = request.nextUrl.pathname === "/panel-parque/login"

  if (isLoginPage) {
    if (user && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/panel-parque"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user || !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = "/panel-parque/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/panel-parque", "/panel-parque/:path*"],
}
