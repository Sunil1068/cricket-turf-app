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
            -- Create Enum Types
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
                    CREATE TYPE "Role" AS ENUM ('USER', 'OWNER');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
                    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
                    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS turf_users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                "passwordHash" TEXT NOT NULL,
                "emailVerified" TIMESTAMP WITH TIME ZONE,
                "verificationToken" TEXT,
                role "Role" DEFAULT 'USER',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS turf_accounts (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES turf_users(id) ON DELETE CASCADE,
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

            CREATE TABLE IF NOT EXISTS turf_sessions (
                id TEXT PRIMARY KEY,
                "sessionToken" TEXT UNIQUE NOT NULL,
                "userId" TEXT NOT NULL REFERENCES turf_users(id) ON DELETE CASCADE,
                expires TIMESTAMP WITH TIME ZONE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS turf_bookings (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES turf_users(id) ON DELETE CASCADE,
                date TIMESTAMP WITH TIME ZONE NOT NULL,
                "startTimeUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endTimeUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
                "slotsCount" INTEGER NOT NULL,
                "amountPaise" INTEGER NOT NULL,
                status "BookingStatus" DEFAULT 'PENDING',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "paymentId" TEXT,
                UNIQUE(date, "startTimeUtc", "endTimeUtc")
            );

            CREATE TABLE IF NOT EXISTS turf_payments (
                id TEXT PRIMARY KEY,
                provider TEXT DEFAULT 'razorpay',
                "razorpayOrderId" TEXT,
                "razorpayPaymentId" TEXT,
                "razorpaySignature" TEXT,
                "amountPaise" INTEGER NOT NULL,
                currency TEXT DEFAULT 'INR',
                status "PaymentStatus" DEFAULT 'PENDING',
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Ensure foreign key for bookings -> payments
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_turf_bookings_payment') THEN
                    ALTER TABLE turf_bookings ADD CONSTRAINT fk_turf_bookings_payment FOREIGN KEY ("paymentId") REFERENCES turf_payments(id);
                END IF;
            END $$;

            -- Self-healing Type Migration: Convert text columns to Enums if they were created incorrectly
            DO $$
            BEGIN
                -- 1. turf_users.role
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'turf_users' AND column_name = 'role' AND data_type = 'text'
                ) THEN
                    ALTER TABLE turf_users ALTER COLUMN role TYPE "Role" USING role::"Role";
                END IF;

                -- 2. turf_bookings.status
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'turf_bookings' AND column_name = 'status' AND data_type = 'text'
                ) THEN
                    ALTER TABLE turf_bookings ALTER COLUMN status TYPE "BookingStatus" USING status::"BookingStatus";
                END IF;

                -- 3. turf_payments.status
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'turf_payments' AND column_name = 'status' AND data_type = 'text'
                ) THEN
                    ALTER TABLE turf_payments ALTER COLUMN status TYPE "PaymentStatus" USING status::"PaymentStatus";
                END IF;
            END $$;
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
