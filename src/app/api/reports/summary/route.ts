import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [total, approved, pending, rejected, draft, usersCount] = await Promise.all([
      prisma.priestProfile.count(),
      prisma.priestProfile.count({ where: { status: 'APPROVED' } }),
      prisma.priestProfile.count({ where: { status: 'PENDING' } }),
      prisma.priestProfile.count({ where: { status: 'REJECTED' } }),
      prisma.priestProfile.count({ where: { status: 'DRAFT' } }),
      prisma.user.count(),
    ])

    // Approved profiles for breakdowns (MongoDB has no groupBy-like aggregation via Prisma here)
    const approvedProfiles = await prisma.priestProfile.findMany({
      where: { status: 'APPROVED' },
      select: { diocese: true, nationality: true, dateOfOrdination: true },
    })
    const dioceseCounts: Record<string, number> = {}
    for (const p of approvedProfiles) {
      const key = p.diocese || 'Unspecified'
      dioceseCounts[key] = (dioceseCounts[key] || 0) + 1
    }
    const dioceseGroups = Object.entries(dioceseCounts).map(([name, count]) => ({ name, count }))

    // Breakdown by decade of ordination
    const profiles = await prisma.priestProfile.findMany({
      where: { status: 'APPROVED', dateOfOrdination: { not: null } },
      select: { dateOfOrdination: true },
    })
    const decadeCounts: Record<string, number> = {}
    for (const p of profiles) {
      const year = parseInt((p.dateOfOrdination as string).slice(0, 4))
      if (!isNaN(year)) {
        const decade = `${Math.floor(year / 10) * 10}s`
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
      }
    }

    // Recent reviews
    const recentReviews = await prisma.profileReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        profile: { select: { firstName: true, lastName: true } },
        reviewer: { select: { name: true } },
      },
    })

    // Nationality breakdown
    const nationalityCounts: Record<string, number> = {}
    for (const p of approvedProfiles) {
      const key = p.nationality || 'Unspecified'
      nationalityCounts[key] = (nationalityCounts[key] || 0) + 1
    }
    const nationalityGroups = Object.entries(nationalityCounts).map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      summary: {
        total,
        approved,
        pending,
        rejected,
        draft,
        users: usersCount,
      },
      diocese: dioceseGroups,
      ordinationDecades: Object.entries(decadeCounts)
        .map(([decade, count]) => ({ decade, count }))
        .sort((a, b) => a.decade.localeCompare(b.decade)),
      nationalities: nationalityGroups,
      recentReviews,
    })
  } catch (error) {
    console.error('Reports summary error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}