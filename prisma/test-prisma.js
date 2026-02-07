const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const userCount = await prisma.user.count();
        console.log('Prisma found users count:', userCount);
    } catch (err) {
        console.error('Prisma connection test failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
