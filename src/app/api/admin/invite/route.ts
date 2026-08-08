import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser, generateToken, generateTempPassword, hashPassword } from '@/lib/auth'
import { sendEmail, invitationEmailTemplate } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    // Generate credentials
    const tempPassword = generateTempPassword()
    const inviteToken = generateToken(48)
    const hashedTemp = await hashPassword(tempPassword)

    // Create the user account (priest role, temp password)
    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        password: hashedTemp,
        role: 'PRIEST',
        tempPassword: true,
        createdBy: user.id,
      },
    })

    // Create a draft profile for them
    await prisma.priestProfile.create({
      data: { userId: createdUser.id, status: 'DRAFT' },
    })

    // Create invitation record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invitation = await prisma.invitation.create({
      data: {
        email: normalizedEmail,
        token: inviteToken,
        userId: createdUser.id,
        sentBy: user.id,
        expiresAt,
      },
    })

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${origin}/register?token=${inviteToken}`
    const fullName = name || normalizedEmail.split('@')[0]

    await sendEmail({
      to: normalizedEmail,
      subject: 'Invitation: Complete Your ADP Clergy Profile',
      html: invitationEmailTemplate({
        name: fullName,
        email: normalizedEmail,
        tempPassword,
        inviteUrl,
      }),
    })

    return NextResponse.json({
      success: true,
      invitation: { id: invitation.id, email: normalizedEmail, expiresAt },
      tempPassword, // returned so admins can view it in dev if email fails
    })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
