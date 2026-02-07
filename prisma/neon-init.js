const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Neon database.');

        // 1. Create Tables
        console.log('Creating tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                "passwordHash" TEXT NOT NULL,
                "emailVerified" TIMESTAMP WITH TIME ZONE,
                "verificationToken" TEXT,
                role TEXT DEFAULT 'USER',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                provider TEXT NOT NULL,
                "providerAccountId" TEXT NOT NULL,
                refresh_token TEXT,
                access_token TEXT,
                expires_at INTEGER,
                token_type TEXT,
                scope TEXT,
                id_token TEXT,
                session_state TEXT,
                UNIQUE(provider, "providerAccountId")
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                "sessionToken" TEXT UNIQUE NOT NULL,
                "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires TIMESTAMP WITH TIME ZONE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date TIMESTAMP WITH TIME ZONE NOT NULL,
                "startTimeUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endTimeUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
                "slotsCount" INTEGER NOT NULL,
                "amountPaise" INTEGER NOT NULL,
                status TEXT DEFAULT 'PENDING',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(date, "startTimeUtc", "endTimeUtc")
            );

            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                "bookingId" TEXT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                provider TEXT DEFAULT 'razorpay',
                "razorpayOrderId" TEXT,
                "razorpayPaymentId" TEXT,
                "razorpaySignature" TEXT,
                "amountPaise" INTEGER NOT NULL,
                currency TEXT DEFAULT 'INR',
                status TEXT DEFAULT 'PENDING',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('Tables created successfully.');

        // 2. Add sample/initial data via seed script (later)

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error during Neon initialization:', error);
    } finally {
        await client.end();
    }
}

main();
