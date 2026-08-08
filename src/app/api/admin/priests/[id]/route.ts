import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params

    const profile = await prisma.priestProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        academicRecords: true,
        assignments: true,
        ministries: true,
        reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get priest error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Manual editing of a clergy record by an administrator.
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await req.json()

    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      placeOfBirth,
      nationality,
      diocese,
      phoneNumber,
      dateOfOrdination,
      placeOfOrdination,
      ordinationBishop,
      diaconate,
      additionalNotes,
      academicRecords = [],
      assignments = [],
      ministries = [],
    } = body

    const profile = await prisma.priestProfile.findUnique({ where: { id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updated = await prisma.priestProfile.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        placeOfBirth,
        nationality,
        diocese,
        phoneNumber,
        dateOfOrdination,
        placeOfOrdination,
        ordinationBishop,
        diaconate,
        additionalNotes,
      },
    })

    await prisma.$transaction([
      prisma.academicRecord.deleteMany({ where: { profileId: id } }),
      prisma.pastoralAssignment.deleteMany({ where: { profileId: id } }),
      prisma.otherMinistry.deleteMany({ where: { profileId: id } }),
      ...academicRecords.filter((r: any) => r && r.institution).map((r: any) =>
        prisma.academicRecord.create({
          data: { profileId: id, institution: r.institution, degree: r.degree, fieldOfStudy: r.fieldOfStudy, startYear: r.startYear, endYear: r.endYear, country: r.country },
        })
      ),
      ...(Array.isArray(assignments) ? assignments : []).filter((r: any) => r && r.parish).map((r: any) =>
        prisma.pastoralAssignment.create({
          data: { profileId: id, parish: r.parish, diocese: r.diocese, role: r.role, startDate: r.startDate, endDate: r.endDate, isCurrent: !!r.isCurrent },
        })
      ),
      ...(Array.isArray(ministries) ? ministries : []).filter((r: any) => r && r.title).map((r: any) =>
        prisma.otherMinistry.create({
          data: { profileId: id, title: r.title, organization: r.organization, description: r.description, startDate: r.startDate, endDate: r.endDate },
        })
      ),
    ])

    return NextResponse.json({ success: true, profile: updated })
  } catch (error) {
    console.error('Update priest error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}