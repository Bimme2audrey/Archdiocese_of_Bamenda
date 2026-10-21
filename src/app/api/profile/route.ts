import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'
import { withChronologicalRecords } from '@/lib/chronology'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.priestProfile.findUnique({
      where: { userId: user.id },
      include: {
        reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ profile: profile && withChronologicalRecords(profile) })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}