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
        languages: true,
        documents: true,
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
      },
    })

    const actualFullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim()
    if (actualFullName) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { name: actualFullName },
      })
    }

    await prisma.$transaction([
      prisma.academicRecord.deleteMany({ where: { profileId: id } }),
      prisma.pastoralAssignment.deleteMany({ where: { profileId: id } }),
      prisma.otherMinistry.deleteMany({ where: { profileId: id } }),
      prisma.languageProficiency.deleteMany({ where: { profileId: id } }),
      prisma.clergyDocument.deleteMany({ where: { profileId: id } }),
      ...academicRecords.filter((r: any) => r && r.institution).map((r: any) =>
        prisma.academicRecord.create({
          data: { profileId: id, level: r.level, institution: r.institution, degree: r.degree, fieldOfStudy: r.fieldOfStudy, startYear: r.startYear, endYear: r.endYear, country: r.country },
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
      ...(Array.isArray(languages) ? languages : []).filter((r: any) => r && r.language).map((r: any) =>
        prisma.languageProficiency.create({
          data: { profileId: id, language: r.language, spoken: r.spoken || 'Basic', written: r.written || 'Basic' },
        })
      ),
      ...(Array.isArray(documents) ? documents : []).filter((r: any) => r && r.name).map((r: any) =>
        prisma.clergyDocument.create({
          data: { profileId: id, name: r.name, type: r.type || 'Other', uploadDate: r.uploadDate || '', fileSize: r.fileSize || '' },
        })
      ),
    ])

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
      prisma.academicRecord.deleteMany({ where: { profileId: id } }),
      prisma.pastoralAssignment.deleteMany({ where: { profileId: id } }),
      prisma.otherMinistry.deleteMany({ where: { profileId: id } }),
      prisma.languageProficiency.deleteMany({ where: { profileId: id } }),
      prisma.clergyDocument.deleteMany({ where: { profileId: id } }),
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