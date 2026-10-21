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

    const rawProfiles = await prisma.priestProfile.findMany({
      where,
      orderBy: { dateOfOrdination: 'asc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    const profiles = rawProfiles.map((p) => ({
      ...p,
      _count: {
        academicRecords: p.academicRecords?.length || 0,
        assignments: p.assignments?.length || 0,
      },
    }))

    const unprofiledAccounts = await prisma.user.findMany({
      where: { role: 'PRIEST', priestProfile: { is: null } },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ profiles, unprofiledAccounts })
  } catch (error) {
    console.error('List priests error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await req.json()
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'A priest account is required' }, { status: 400 })
    }

    const priest = await prisma.user.findUnique({ where: { id: userId } })
    if (!priest || priest.role !== 'PRIEST') {
      return NextResponse.json({ error: 'Priest account not found' }, { status: 404 })
    }

    const existingProfile = await prisma.priestProfile.findUnique({ where: { userId } })
    if (existingProfile) {
      return NextResponse.json({ profileId: existingProfile.id })
    }

    const profile = await prisma.priestProfile.create({
      data: { userId, status: 'DRAFT' },
    })

    return NextResponse.json({ success: true, profileId: profile.id }, { status: 201 })
  } catch (error) {
    console.error('Create priest profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
