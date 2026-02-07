import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({ take: 1 })
    console.log('User fields:', Object.keys(users[0] || {}))
}

main()
    .catch((e) => {
        console.error('Error fetching users:', e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
