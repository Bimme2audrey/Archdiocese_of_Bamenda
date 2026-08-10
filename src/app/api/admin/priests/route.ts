import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const diocese = searchParams.get('diocese') || ''
    const ecclesiasticalStatus = searchParams.get('ecclesiastical') || ''

    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (diocese && diocese !== 'ALL') where.diocese = { contains: diocese }
    if (ecclesiasticalStatus && ecclesiasticalStatus !== 'ALL') where.ecclesiasticalStatus = ecclesiasticalStatus
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }

    const profiles = await prisma.priestProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { academicRecords: true, assignments: true } },
      },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('List priests error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
