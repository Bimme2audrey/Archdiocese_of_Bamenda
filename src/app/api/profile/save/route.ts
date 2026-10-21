import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'
import { isUploadedClergyDocumentList } from '@/lib/clergy-documents'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'PRIEST') {
      return NextResponse.json({ error: 'Only priests can update their profile here' }, { status: 403 })
    }

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
    } = body

    if (!isUploadedClergyDocumentList(documents)) {
      return NextResponse.json({ error: 'Documents must be PDF or image files up to 4 MB' }, { status: 413 })
    }

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
      .filter((d: any) => d && d.name)
      .map((d: any) => ({
        name: d.name,
        type: d.type || 'Other',
        uploadDate: d.uploadDate || '',
        fileSize: d.fileSize || '',
        originalName: d.originalName || null,
        contentType: d.contentType || null,
        fileUrl: d.fileUrl || null,
        contentData: d.contentData || null,
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

    const profile = await prisma.priestProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        status: 'DRAFT',
        ...profileData,
      },
    })

    return NextResponse.json({ success: true, profileId: profile.id })
  } catch (error) {
    console.error('Save profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
