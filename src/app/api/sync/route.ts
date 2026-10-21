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
        photoUrl,
        baptismDate,
        baptismParish,
        confirmationDate,
        confirmationParish,
        religiousCongregation,
        dateOfOrdination,
        placeOfOrdination,
        ordinationBishop,
        diaconate,
        additionalNotes,
        biography,
        academicRecords = [],
        assignments = [],
        ministries = [],
        documents = [],
      } = d

      const formattedAcademicRecords = (Array.isArray(academicRecords) ? academicRecords : [])
        .filter((r: any) => r && r.institution)
        .map((r: any) => ({
          level: r.level || null,
          institution: r.institution,
          degree: r.degree || '',
          fieldOfStudy: r.fieldOfStudy || null,
          startYear: r.startYear || null,
          endYear: r.endYear || null,
          country: r.country || null,
        }))

      const formattedAssignments = (Array.isArray(assignments) ? assignments : [])
        .filter((r: any) => r && r.parish)
        .map((r: any) => ({
          parish: r.parish,
          diocese: r.diocese || null,
          role: r.role || '',
          startDate: r.startDate || null,
          endDate: r.endDate || null,
          isCurrent: !!r.isCurrent,
        }))

      const formattedMinistries = (Array.isArray(ministries) ? ministries : [])
        .filter((r: any) => r && r.title)
        .map((r: any) => ({
          title: r.title,
          organization: r.organization || null,
          description: r.description || null,
          startDate: r.startDate || null,
          endDate: r.endDate || null,
        }))

      const formattedDocuments = (Array.isArray(documents) ? documents : [])
        .filter((doc: any) => doc && doc.name)
        .map((doc: any) => ({
          name: doc.name,
          type: doc.type || 'Other',
          uploadDate: doc.uploadDate || '',
          fileSize: doc.fileSize || '',
          originalName: doc.originalName || null,
          contentType: doc.contentType || null,
          fileUrl: doc.fileUrl || null,
          contentData: doc.contentData || null,
        }))

      const profileData = {
        updatedAt: new Date(),
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        placeOfBirth,
        nationality,
        diocese,
        phoneNumber,
        photoUrl,
        baptismDate,
        baptismParish,
        confirmationDate,
        confirmationParish,
        religiousCongregation,
        dateOfOrdination,
        placeOfOrdination,
        ordinationBishop,
        diaconate,
        additionalNotes,
        biography,
        academicRecords: formattedAcademicRecords,
        assignments: formattedAssignments,
        ministries: formattedMinistries,
        documents: formattedDocuments,
      }

      await prisma.priestProfile.upsert({
        where: { userId: user.id },
        update: profileData,
        create: {
          userId: user.id,
          status: 'DRAFT',
          ...profileData,
        },
      })

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
