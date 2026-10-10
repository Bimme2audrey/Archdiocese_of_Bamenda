import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTempPassword, getUser, hashPassword } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const invitation = await prisma.invitation.findUnique({ where: { id } })
    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (invitation.usedAt) return NextResponse.json({ error: 'This invitation has already been accepted' }, { status: 400 })
    if (invitation.expiresAt <= new Date()) return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 })

    const updated = await prisma.invitation.update({
      where: { id },
      data: { whatsappSentAt: new Date() },
    })
    return NextResponse.json({ success: true, invitation: updated })
  } catch (error) {
    console.error('Update invitation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const invitation = await prisma.invitation.findUnique({ where: { id }, include: { user: true } })
    if (!invitation?.user) return NextResponse.json({ error: 'Invitation account not found' }, { status: 404 })
    if (invitation.usedAt || invitation.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'This invitation is no longer valid' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    await prisma.user.update({
      where: { id: invitation.user.id },
      data: { password: await hashPassword(tempPassword), tempPassword: true },
    })
    const inviteUrl = `${req.nextUrl.origin}/register?token=${invitation.token}`
    return NextResponse.json({ success: true, tempPassword, inviteUrl })
  } catch (error) {
    console.error('Prepare WhatsApp invitation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            priestProfile: {
              include: { _count: { select: { academicRecords: true, assignments: true, ministries: true, languages: true, documents: true, reviews: true } } },
            },
          },
        },
        },
    })
    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    const profile = invitation.user?.priestProfile
    const profileIsUntouched = profile?.status === 'DRAFT'
      && !profile.firstName && !profile.middleName && !profile.lastName
      && !profile.dateOfBirth && !profile.placeOfBirth && !profile.nationality && !profile.diocese
      && !profile.dateOfOrdination && !profile.placeOfOrdination && !profile.ordinationBishop && !profile.diaconate
      && !profile.additionalNotes && !profile.photoUrl && !profile.biography
      && !profile.baptismDate && !profile.baptismParish && !profile.confirmationDate && !profile.confirmationParish
      && !profile.emergencyContactName && !profile.emergencyContactPhone && !profile.nextOfKinName && !profile.nextOfKinPhone
      && profile.skills.length === 0
      && Object.values(profile._count).every((count) => count === 0)
    const accountIsUnregistered = !invitation.usedAt && invitation.user?.tempPassword && profileIsUntouched
    if (accountIsUnregistered && invitation.user) {
      const profileId = invitation.user.priestProfile?.id
      const operations: import('@prisma/client').Prisma.PrismaPromise<unknown>[] = [
        prisma.session.deleteMany({ where: { userId: invitation.user.id } }),
        prisma.passwordResetToken.deleteMany({ where: { userId: invitation.user.id } }),
        prisma.invitation.delete({ where: { id } }),
      ]
      if (profileId) {
        operations.push(
          prisma.academicRecord.deleteMany({ where: { profileId } }),
          prisma.pastoralAssignment.deleteMany({ where: { profileId } }),
          prisma.otherMinistry.deleteMany({ where: { profileId } }),
          prisma.languageProficiency.deleteMany({ where: { profileId } }),
          prisma.clergyDocument.deleteMany({ where: { profileId } }),
          prisma.profileReview.deleteMany({ where: { profileId } }),
          prisma.priestProfile.delete({ where: { id: profileId } }),
        )
      }
      operations.push(prisma.user.delete({ where: { id: invitation.user.id } }))
      await prisma.$transaction(operations)
    } else {
      await prisma.invitation.delete({ where: { id } })
    }

    return NextResponse.json({ success: true, accountRemoved: Boolean(accountIsUnregistered) })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}