import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'PRIEST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const profile = await prisma.priestProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please save your draft first.' }, { status: 404 })
    }

    // Basic completeness check
    const required = [profile.firstName, profile.lastName, profile.dateOfOrdination]
    if (required.some((v) => !v)) {
      return NextResponse.json(
        { error: 'Please complete at least your full name and date of ordination before submitting.' },
        { status: 400 }
      )
    }

    const updated = await prisma.priestProfile.update({
      where: { id: profile.id },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
      },
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (error) {
    console.error('Submit profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
