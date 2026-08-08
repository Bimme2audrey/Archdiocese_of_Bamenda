import { NextRequest, NextResponse } from 'next/server'

// Each role's pages are protected by its own session cookie, so multiple roles
// can be open simultaneously in the same browser.
const roleProtected: Array<{ prefix: string; cookie: string; login: string }> = [
  { prefix: '/it', cookie: 'session_it', login: '/admin-login' },
  { prefix: '/admin-dashboard', cookie: 'session_it', login: '/admin-login' },
  { prefix: '/adp', cookie: 'session_adp', login: '/clergy-login' },
  { prefix: '/clergy-dashboard', cookie: 'session_adp', login: '/clergy-login' },
  { prefix: '/priest', cookie: 'session_priest', login: '/priest-login' },
  { prefix: '/priest-dashboard', cookie: 'session_priest', login: '/priest-login' },
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  for (const r of roleProtected) {
    if (pathname === r.prefix || pathname.startsWith(r.prefix + '/')) {
      if (!request.cookies.get(r.cookie)?.value) {
        return NextResponse.redirect(new URL(r.login, request.url))
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
