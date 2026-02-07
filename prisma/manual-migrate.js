const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Add emailVerified column
        try {
            await client.query('ALTER TABLE users ADD COLUMN "emailVerified" TIMESTAMP WITH TIME ZONE;');
            console.log('Added emailVerified column.');
        } catch (e) {
            if (e.code === '42701') {
                console.log('emailVerified column already exists.');
            } else {
                throw e;
            }
        }

        // Add verificationToken column
        try {
            await client.query('ALTER TABLE users ADD COLUMN "verificationToken" TEXT;');
            console.log('Added verificationToken column.');
        } catch (e) {
            if (e.code === '42701') {
                console.log('verificationToken column already exists.');
            } else {
                throw e;
            }
        }

        // Verify all current users (Owner etc)
        const res = await client.query('UPDATE users SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;');
        console.log(`Verified ${res.rowCount} existing users.`);

        console.log('Database migration completed successfully.');
    } catch (error) {
        console.error('Error during SQL migration:', error);
    } finally {
        await client.end();
    }
}

main();
