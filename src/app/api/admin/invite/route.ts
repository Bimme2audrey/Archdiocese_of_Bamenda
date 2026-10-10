import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser, generateToken, generateTempPassword, hashPassword } from '@/lib/auth'
import { sendEmail, invitationEmailTemplate } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, email, phoneNumber, deliveryMethod, sendEmail: shouldSendEmail = true } = await req.json()
    const method = deliveryMethod || (shouldSendEmail ? 'EMAIL' : 'WHATSAPP')
    if (!['EMAIL', 'WHATSAPP', 'BOTH'].includes(method)) {
      return NextResponse.json({ error: 'Choose email, WhatsApp, or both' }, { status: 400 })
    }
    const needsEmail = method === 'EMAIL' || method === 'BOTH'
    const needsWhatsApp = method === 'WHATSAPP' || method === 'BOTH'
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
    const phoneDigits = typeof phoneNumber === 'string' ? phoneNumber.replace(/\D/g, '') : ''

    if (!normalizedEmail && !phoneDigits) {
      return NextResponse.json({ error: 'Add an email address or WhatsApp number' }, { status: 400 })
    }
    if (phoneNumber && phoneDigits.length < 7) {
      return NextResponse.json({ error: 'Enter a valid WhatsApp number with country code' }, { status: 400 })
    }
    if (needsEmail && !normalizedEmail) {
      return NextResponse.json({ error: 'Add an email address or choose WhatsApp delivery' }, { status: 400 })
    }
    if (needsWhatsApp && !phoneDigits) {
      return NextResponse.json({ error: 'Add a WhatsApp number for WhatsApp delivery' }, { status: 400 })
    }

    // Keep the existing email-required database contract while allowing phone-only accounts.
    const accountEmail = normalizedEmail || `whatsapp-${phoneDigits}@accounts.adpclergy.local`

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email: accountEmail } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }
    if (phoneDigits) {
      const existingPhone = await prisma.priestProfile.findFirst({ where: { phoneNumber: phoneDigits } })
      if (existingPhone) {
        return NextResponse.json({ error: 'A user with this WhatsApp number already exists' }, { status: 400 })
      }
    }

    // Generate credentials
    const tempPassword = generateTempPassword()
    const inviteToken = generateToken(48)
    const hashedTemp = await hashPassword(tempPassword)

    // Create the user account (priest role, temp password)
    const createdUser = await prisma.user.create({
      data: {
        email: accountEmail,
        name: name || null,
        password: hashedTemp,
        role: 'PRIEST',
        tempPassword: true,
        createdBy: user.id,
      },
    })

    // Create a draft profile for them
    const priestProfile = await prisma.priestProfile.create({
      data: { userId: createdUser.id, status: 'DRAFT', phoneNumber: phoneDigits || null },
    })

    // Create invitation record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invitation = await prisma.invitation.create({
      data: {
        email: normalizedEmail || null,
        token: inviteToken,
        userId: createdUser.id,
        sentBy: user.id,
        expiresAt,
        deliveryMethod: method,
      },
    })

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${origin}/register?token=${inviteToken}`
    const questionnaireUrl = `${origin}/api/auth/questionnaire-link?token=${inviteToken}&email=${encodeURIComponent(normalizedEmail)}`

    // Only send email if the admin chose to
    let emailSent = false
    let emailPreview = false
    let emailError: string | null = null
    if (needsEmail && normalizedEmail) {
      const fullName = name || normalizedEmail.split('@')[0]
      try {
        const result = await sendEmail({
          to: normalizedEmail,
          subject: 'Invitation: Complete Your ADP Clergy Profile',
          html: invitationEmailTemplate({
            name: fullName,
            email: normalizedEmail,
            tempPassword,
            inviteUrl,
            questionnaireUrl,
          }),
        })
        emailPreview = result.preview
        emailSent = !result.preview
        if (emailSent) {
          await prisma.invitation.update({ where: { id: invitation.id }, data: { emailSentAt: new Date() } })
        }
      } catch (error) {
        console.error('Invitation email delivery failed:', error)
        emailError = 'Email could not be sent. The invitation is saved as not sent.'
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailPreview,
      emailError,
      whatsappReady: needsWhatsApp,
      invitation: { id: invitation.id, email: normalizedEmail || null, expiresAt },
      tempPassword,
      userId: createdUser.id,
      profileId: priestProfile.id,
      phoneNumber: phoneDigits || null,
      accountEmail,
      inviteUrl,    // so admin can copy/paste or share it manually
    })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
