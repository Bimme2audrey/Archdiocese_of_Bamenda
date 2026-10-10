import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, getRoleCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, phoneNumber, password } = await req.json()
    const identifier = typeof email === 'string' ? email.trim() : ''
    const normalizedEmail = identifier.includes('@') ? identifier.toLowerCase() : ''
    const normalizedPhone = typeof phoneNumber === 'string'
      ? phoneNumber.replace(/\D/g, '')
      : normalizedEmail ? '' : identifier.replace(/\D/g, '')

    if ((!normalizedEmail && !normalizedPhone) || !password) {
      return NextResponse.json({ error: 'Email or WhatsApp number and password required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ priestProfile: { phoneNumber: normalizedPhone } }] : []),
        ],
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createSession(user.id)

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tempPassword: user.tempPassword },
    })

    // Role-specific cookie (allows simultaneous role sessions)
    response.cookies.set(getRoleCookie(user.role), token, cookieOpts)
    // Generic "active workspace" cookie used by shared operational pages
    response.cookies.set('session_token', token, cookieOpts)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
