import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refreshes the session cookie so it doesn't expire mid-session
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = [
    '/dashboard', '/tasks/new', '/profile', '/admin', '/notifications'
  ].some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/new',
    '/profile/:path*',
    '/admin/:path*',
    '/notifications/:path*',
  ],
}