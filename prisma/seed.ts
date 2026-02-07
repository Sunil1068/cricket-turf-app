import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create owner user
  const ownerPassword = await bcrypt.hash('Owner@1234', 12)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@turf.com' },
    update: {},
    create: {
      email: 'owner@turf.com',
      name: 'Turf Owner',
      phone: '9876543210',
      passwordHash: ownerPassword,
      role: 'OWNER',
      emailVerified: new Date(),
    },
  })

  // Create sample user
  const userPassword = await bcrypt.hash('User@1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Sample User',
      phone: '1234567890',
      passwordHash: userPassword,
      role: 'USER',
    },
  })

  console.log('Seeded users:', { owner, user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
