import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'
import { isUploadedClergyDocumentList } from '@/lib/clergy-documents'
import { withChronologicalRecords } from '@/lib/chronology'

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
        reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: withChronologicalRecords(profile) })
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
      accountName, accountEmail,
      firstName, middleName, lastName, dateOfBirth, placeOfBirth, nationality,
      diocese, phoneNumber, photoUrl, dateOfOrdination, placeOfOrdination,
      ordinationBishop, diaconate, additionalNotes,
      ecclesiasticalStatus, dateOfDeath, restingPlace, necrologyNotes,
      emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
      baptismDate, baptismParish, confirmationDate, confirmationParish,
      religiousCongregation, skills, bloodGroup, allergies, medicalConditions,
      nextOfKinName, nextOfKinPhone, biography,
      academicRecords = [], assignments = [], ministries = [],
      languages = [], documents = [],
    } = body

    const profile = await prisma.priestProfile.findUnique({ where: { id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!isUploadedClergyDocumentList(documents)) {
      return NextResponse.json({ error: 'Documents must be PDF or image files up to 4 MB' }, { status: 413 })
    }

    if (typeof accountEmail === 'string' && accountEmail.trim()) {
      const normalizedAccountEmail = accountEmail.toLowerCase().trim()
      const existingAccount = await prisma.user.findUnique({ where: { email: normalizedAccountEmail } })
      if (existingAccount && existingAccount.id !== profile.userId) {
        return NextResponse.json({ error: 'Another account already uses this email address' }, { status: 409 })
      }
      await prisma.user.update({
        where: { id: profile.userId },
        data: { email: normalizedAccountEmail, ...(typeof accountName === 'string' ? { name: accountName.trim() || null } : {}) },
      })
    } else if (typeof accountName === 'string') {
      await prisma.user.update({ where: { id: profile.userId }, data: { name: accountName.trim() || null } })
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

    const formattedLanguages = (Array.isArray(languages) ? languages : [])
      .filter((r: any) => r && r.language)
      .map((r: any) => ({
        language: r.language,
        spoken: r.spoken || 'Basic',
        written: r.written || 'Basic',
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

    const updated = await prisma.priestProfile.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        firstName, middleName, lastName, dateOfBirth, placeOfBirth, nationality,
        diocese, phoneNumber, photoUrl, dateOfOrdination, placeOfOrdination,
        ordinationBishop, diaconate, additionalNotes,
        ecclesiasticalStatus, dateOfDeath, restingPlace, necrologyNotes,
        emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
        baptismDate, baptismParish, confirmationDate, confirmationParish,
        religiousCongregation, skills, bloodGroup, allergies, medicalConditions,
        nextOfKinName, nextOfKinPhone, biography,
        academicRecords: formattedAcademicRecords,
        assignments: formattedAssignments,
        ministries: formattedMinistries,
        languages: formattedLanguages,
        documents: formattedDocuments,
      },
    })

    const actualFullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim()
    if (actualFullName) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { name: actualFullName },
      })
    }

    return NextResponse.json({ success: true, profile: updated })
  } catch (error) {
    console.error('Update priest error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const profile = await prisma.priestProfile.findUnique({ where: { id } })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    await prisma.$transaction([
      prisma.profileReview.deleteMany({ where: { profileId: id } }),
      prisma.invitation.deleteMany({ where: { userId: profile.userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: profile.userId } }),
      prisma.session.deleteMany({ where: { userId: profile.userId } }),
      prisma.priestProfile.delete({ where: { id } }),
      prisma.user.delete({ where: { id: profile.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete priest record error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}