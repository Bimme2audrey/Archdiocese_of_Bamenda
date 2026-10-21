import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const profiles = await prisma.priestProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Calendar data error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}