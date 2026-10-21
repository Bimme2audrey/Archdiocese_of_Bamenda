import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const masterCode = process.env.IT_ADMIN_MASTER_CODE || 'ADP-IT-MASTER-2024-SECURE'

  // === 1. Seed IT Administrator (created via the master backdoor code) ===
  const itAdminEmail = process.env.IT_ADMIN_EMAIL || 'itadmin@adpclergy.org'
  const existingIt = await prisma.user.findUnique({ where: { email: itAdminEmail } })
  if (!existingIt) {
    const password = await bcrypt.hash('ItAdmin@2024', 12)
    await prisma.user.create({
      data: {
        email: itAdminEmail,
        name: 'System IT Administrator',
        password,
        role: Role.IT_ADMIN,
        isActive: true,
        tempPassword: false,
      },
    })
    console.log(`✓ IT Administrator created: ${itAdminEmail}`)
  } else {
    console.log(`IT Administrator already exists: ${itAdminEmail}`)
  }

  // === 2. Seed a default ADP Administrator ===
  const adpEmail = process.env.ADP_ADMIN_EMAIL || 'admin@adpclergy.org'
  const existingAdp = await prisma.user.findUnique({ where: { email: adpEmail } })
  if (!existingAdp) {
    const password = await bcrypt.hash('Admin@2024', 12)
    await prisma.user.create({
      data: {
        email: adpEmail,
        name: 'ADP Administration',
        password,
        role: Role.ADP_ADMIN,
        isActive: true,
        createdBy: existingIt?.id,
      },
    })
    console.log(`✓ ADP Administrator created: ${adpEmail}`)
  } else {
    console.log(`ADP Administrator already exists: ${adpEmail}`)
  }

  // === 3. Seed a sample priest profile (optional demo) ===
  const shouldSeedPriest = process.env.SEED_SAMPLE_PRIEST === 'true'
  if (shouldSeedPriest) {
    const priestEmail = 'priest@adpclergy.org'
    const existingPriest = await prisma.user.findUnique({ where: { email: priestEmail } })
    if (!existingPriest) {
      const password = await bcrypt.hash('Priest@2024', 12)
      const priest = await prisma.user.create({
        data: {
          email: priestEmail,
          name: 'John Doe',
          password,
          role: Role.PRIEST,
          isActive: true,
          tempPassword: false,
        },
      })
      await prisma.priestProfile.create({
        data: {
          userId: priest.id,
          status: 'APPROVED',
          submittedAt: new Date(),
          approvedAt: new Date(),
          firstName: 'John',
          middleName: 'Paul',
          lastName: 'Doe',
          dateOfBirth: '1975-05-14',
          placeOfBirth: 'Nairobi',
          nationality: 'Kenyan',
          diocese: 'Nairobi Archdiocese',
          phoneNumber: '+254712345678',
          dateOfOrdination: '2005-08-20',
          placeOfOrdination: 'St. Peter Cathedral',
          ordinationBishop: 'Most Rev. John Cardinal Njue',
          academicRecords: [
            {
              institution: 'Pontifical Urbaniana University, Rome',
              degree: 'Licentiate in Sacred Theology',
              fieldOfStudy: 'Moral Theology',
              startYear: '1998',
              endYear: '2002',
              country: 'Italy',
            },
          ],
          assignments: [
            {
              parish: 'St. Joseph Parish, Karen',
              role: 'Parish Priest',
              startDate: '2015',
              endDate: '',
              isCurrent: true,
            },
            {
              parish: 'St. Monica Parish',
              role: 'Assistant Priest',
              startDate: '2007',
              endDate: '2015',
            },
          ],
          ministries: [
            {
              title: 'Chaplain - University Catholic Society',
              organization: 'Catholic University Outreach',
              description: 'Spiritual guidance for university students.',
              startDate: '2016',
            },
          ],
          additionalNotes: 'Dedicated to pastoral care and youth ministry.',
        },
      })
      console.log(`✓ Sample Priest created: ${priestEmail}`)
    } else {
      console.log(`Sample Priest already exists: ${priestEmail}`)
    }
  }

  console.log('\n✅ Seeding complete!')
  console.log('\nDefault logins:')
  console.log('  IT Admin   → itadmin@adpclergy.org / ItAdmin@2024')
  console.log('  ADP Admin  → admin@adpclergy.org  / Admin@2024')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
