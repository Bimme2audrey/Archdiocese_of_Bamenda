import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

// Offline synchronization endpoint.
// Priests may fill their questionnaire offline; this endpoint accepts
// saved offline payloads and persists them to the database.
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'PRIEST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const submissions = Array.isArray(body) ? body : [body]

    let saved = 0
    for (const submission of submissions) {
      const d = submission.data || submission
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
        academicRecords,
        assignments,
        ministries,
      } = d

      const profile = await prisma.priestProfile.upsert({
        where: { userId: user.id },
        update: {
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
          // Do NOT auto-change status on sync; keep draft unless already submitted
        },
        create: {
          userId: user.id,
          status: 'DRAFT',
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
        prisma.academicRecord.deleteMany({ where: { profileId: profile.id } }),
        prisma.pastoralAssignment.deleteMany({ where: { profileId: profile.id } }),
        prisma.otherMinistry.deleteMany({ where: { profileId: profile.id } }),
        ...(Array.isArray(academicRecords) ? academicRecords : []).filter((r: any) => r && r.institution).map((r: any) =>
          prisma.academicRecord.create({
            data: { profileId: profile.id, institution: r.institution, degree: r.degree, fieldOfStudy: r.fieldOfStudy, startYear: r.startYear, endYear: r.endYear, country: r.country },
          })
        ),
        ...(Array.isArray(assignments) ? assignments : []).filter((r: any) => r && r.parish).map((r: any) =>
          prisma.pastoralAssignment.create({
            data: { profileId: profile.id, parish: r.parish, diocese: r.diocese, role: r.role, startDate: r.startDate, endDate: r.endDate, isCurrent: !!r.isCurrent },
          })
        ),
        ...(Array.isArray(ministries) ? ministries : []).filter((r: any) => r && r.title).map((r: any) =>
          prisma.otherMinistry.create({
            data: { profileId: profile.id, title: r.title, organization: r.organization, description: r.description, startDate: r.startDate, endDate: r.endDate },
          })
        ),
      ])

      saved++
    }

    return NextResponse.json({ success: true, synced: saved })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ online: true, message: 'Server reachable' })
}
