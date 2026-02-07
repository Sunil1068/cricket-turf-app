const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Neon database for seeding.');

        // 1. Create Owner
        const ownerEmail = 'owner@turf.com';
        const ownerPassword = await bcrypt.hash('Owner@1234', 12);
        const ownerId = 'cl' + crypto.randomBytes(12).toString('hex');

        await client.query(`
            INSERT INTO users (id, name, email, "passwordHash", role, "emailVerified")
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (email) DO NOTHING
        `, [ownerId, 'Turf Owner', ownerEmail, ownerPassword, 'OWNER']);
        console.log('Owner user created (or already exists).');

        // 2. Create Sample User
        const userEmail = 'user@example.com';
        const userPassword = await bcrypt.hash('User@1234', 12);
        const userId = 'cl' + crypto.randomBytes(12).toString('hex');

        await client.query(`
            INSERT INTO users (id, name, email, "passwordHash", role)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING
        `, [userId, 'Sample User', userEmail, userPassword, 'USER']);
        console.log('Sample user created (or already exists).');

        console.log('Database seeding completed successfully.');
    } catch (error) {
        console.error('Error during Neon seeding:', error);
    } finally {
        await client.end();
    }
}

main();
