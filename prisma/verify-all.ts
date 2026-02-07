import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying all existing users...')
    const result = await prisma.user.updateMany({
        where: {
            emailVerified: null,
        },
        data: {
            emailVerified: new Date(),
        },
    })
    console.log(`Verified ${result.count} users.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
