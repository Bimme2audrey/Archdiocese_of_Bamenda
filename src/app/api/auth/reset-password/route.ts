import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = typeof body.token === 'string' ? body.token : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (!token || newPassword.length < 8) {
      return NextResponse.json({ error: 'Use a valid reset link and a password of at least 8 characters.' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'This password reset link is invalid or has expired. Request a new one.' }, { status: 400 })
    }

    const claimed = await prisma.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })
    if (claimed.count !== 1) {
      return NextResponse.json({ error: 'This password reset link has already been used or expired.' }, { status: 400 })
    }

    const password = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password, tempPassword: false },
    })
    await prisma.session.deleteMany({ where: { userId: resetToken.userId } })
    await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Could not reset the password. Request a new link and try again.' }, { status: 500 })
  }
}