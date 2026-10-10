import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { passwordResetEmailTemplate, sendEmail } from '@/lib/email'

const genericResponse = {
  success: true,
  message: 'If that email belongs to a priest account, password reset instructions will be sent shortly.',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    if (!email || !email.includes('@')) return NextResponse.json(genericResponse)

    const account = await prisma.user.findUnique({ where: { email } })
    if (!account || account.role !== 'PRIEST' || !account.isActive || email.endsWith('@accounts.adpclergy.local')) {
      return NextResponse.json(genericResponse)
    }

    const cooldownStart = new Date(Date.now() - 2 * 60 * 1000)
    const recentRequest = await prisma.passwordResetToken.findFirst({
      where: { userId: account.id, createdAt: { gt: cooldownStart }, usedAt: null },
    })
    if (recentRequest) return NextResponse.json(genericResponse)

    await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
    await prisma.passwordResetToken.deleteMany({ where: { userId: account.id } })
    const token = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await prisma.passwordResetToken.create({
      data: {
        userId: account.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${encodeURIComponent(token)}`
    await sendEmail({
      to: account.email,
      subject: 'Reset your ADP clergy account password',
      html: passwordResetEmailTemplate({ name: account.name || 'Priest', resetUrl }),
    })

    return NextResponse.json(genericResponse)
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(genericResponse)
  }
}