const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to Neon for users table migration...');

        // 1. Check current columns
        const colRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        const columns = colRes.rows.map(r => r.column_name);
        console.log('Current columns:', columns);

        // 2. Rename password to passwordHash if it exists
        if (columns.includes('password') && !columns.includes('passwordHash')) {
            console.log('Renaming password to passwordHash...');
            await client.query(`ALTER TABLE users RENAME COLUMN password TO "passwordHash";`);
        } else if (!columns.includes('passwordHash')) {
            console.log('Adding passwordHash column...');
            await client.query(`ALTER TABLE users ADD COLUMN "passwordHash" TEXT;`);
        }

        // 3. Add verificationToken if missing
        if (!columns.includes('verificationToken')) {
            console.log('Adding verificationToken column...');
            await client.query(`ALTER TABLE users ADD COLUMN "verificationToken" TEXT;`);
        }

        // 4. Add emailVerified if missing
        if (!columns.includes('emailVerified')) {
            console.log('Adding emailVerified column...');
            await client.query(`ALTER TABLE users ADD COLUMN "emailVerified" TIMESTAMP WITH TIME ZONE;`);
        }

        // 5. Ensure phone column allows null if needed
        console.log('Ensuring phone column exists and is nullable...');
        if (!columns.includes('phone')) {
            await client.query(`ALTER TABLE users ADD COLUMN phone TEXT;`);
        }

        console.log('User table migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
