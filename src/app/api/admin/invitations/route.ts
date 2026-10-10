import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            isActive: true,
            tempPassword: true,
            priestProfile: { select: { id: true, status: true, phoneNumber: true } },
          },
        },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('List invitations error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
