import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, getRoleCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', req.url)
      )
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!invitation) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', req.url)
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL('/login?error=expired', req.url)
      )
    }

    if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.redirect(
        new URL('/login?error=mismatch', req.url)
      )
    }

    if (!invitation.user) {
      return NextResponse.redirect(
        new URL('/login?error=no_user', req.url)
      )
    }

    // Mark invitation as used if it hasn't been already
    if (!invitation.usedAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      })
    }

    // Create a session for this priest
    const sessionToken = await createSession(invitation.user.id)

    const redirectUrl = new URL('/priest/questionnaire', req.url)
    const response = NextResponse.redirect(redirectUrl)

    // Set the session cookie (same as the regular login flow)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
    response.cookies.set('session_token', sessionToken, cookieOptions)
    response.cookies.set(getRoleCookie(invitation.user.role), sessionToken, cookieOptions)

    return response
  } catch (error) {
    console.error('Questionnaire magic link error:', error)
    return NextResponse.redirect(
      new URL('/login?error=server_error', req.url)
    )
  }
}