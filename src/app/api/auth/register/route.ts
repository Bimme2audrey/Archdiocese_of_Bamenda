import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createSession, getRoleCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { token, email, tempPassword, newPassword, name } = await req.json()

    if (!token || !tempPassword || !newPassword) {
      return NextResponse.json({ error: 'Invitation, temporary passcode, and new password are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 })
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired. Please contact ADP administration.' }, { status: 400 })
    }
    if (invitation.usedAt) {
      return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 400 })
    }
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
    if (normalizedEmail && invitation.email && !invitation.email.startsWith('whatsapp-') && invitation.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: 'Email does not match this invitation' }, { status: 400 })
    }
    if (!invitation.user) {
      return NextResponse.json({ error: 'No account linked to this invitation' }, { status: 404 })
    }

    // Verify the temporary password
    const validTemp = await verifyPassword(tempPassword, invitation.user.password)
    if (!validTemp) {
      return NextResponse.json({ error: 'Temporary password is incorrect' }, { status: 400 })
    }

    // Set new password, mark invitation used
    const hashed = await hashPassword(newPassword)
    const user = await prisma.user.update({
      where: { id: invitation.userId! },
      data: {
        password: hashed,
        name: name || invitation.user.name,
        tempPassword: false,
      },
    })

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    })

    // Auto create profile record if not exists
    await prisma.priestProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, status: 'DRAFT' },
    })

    const sessionToken = await createSession(user.id)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
    response.cookies.set('session_token', sessionToken, cookieOptions)
    response.cookies.set(getRoleCookie(user.role), sessionToken, cookieOptions)
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
