import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
        return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()

        // Check current database and schema
        const metaRes = await client.query(`
            SELECT current_database(), current_schema(), current_user
        `)

        // Check search path
        const pathRes = await client.query(`SHOW search_path`)

        // List tables in public
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `)

        // List all schemas
        const schemasRes = await client.query(`
            SELECT schema_name FROM information_schema.schemata
        `)

        // Initialize, Force Verify, Clean, or Test Email if requested
        let initStatus = 'not_requested'
        const { searchParams } = new URL(request.url)

        // Test email sending
        if (searchParams.get('test_email')) {
            const testTarget = searchParams.get('test_email') as string
            try {
                const { sendVerificationEmail } = await import('@/lib/email')
                const res = await sendVerificationEmail(testTarget, 'test-token-123')
                initStatus = res.success ? `Success: Test email sent to ${testTarget}` : `Error sending: ${res.error}`
            } catch (e: any) {
                initStatus = `Critical Error sending: ${e.message}`
            }
        }

        // Manual cleanup (Destructive!)
        if (searchParams.get('clean') === 'true') {
            try {
                // Delete everything in order of dependency
                await client.query('DELETE FROM turf_bookings')
                await client.query('DELETE FROM turf_payments')
                await client.query('DELETE FROM turf_sessions')
                await client.query('DELETE FROM turf_accounts')
                await client.query('DELETE FROM turf_users')
                initStatus = 'Success: Database cleaned (all users and bookings deleted)'
            } catch (e: any) {
                initStatus = `Error Cleaning: ${e.message}`
            }
        }

        // Selective user deletion
        if (searchParams.get('delete_user')) {
            const emailToDelete = searchParams.get('delete_user')
            try {
                await client.query('DELETE FROM turf_users WHERE email = $1', [emailToDelete])
                initStatus = `Success: Deleted user ${emailToDelete}`
            } catch (e: any) {
                initStatus = `Error Deleting User: ${e.message}`
            }
        }

        // Manual verification bypass
        if (searchParams.get('verify')) {
            const emailToVerify = searchParams.get('verify')
            try {
                await client.query('UPDATE turf_users SET "emailVerified" = NOW(), "verificationToken" = NULL WHERE email = $1', [emailToVerify])
                initStatus = `Success: Verified ${emailToVerify}`
            } catch (e: any) {
                initStatus = `Error Verifying: ${e.message}`
            }
        }

        if (searchParams.get('init') === 'true') {
            try {
                // 1. Create Enum Types if they don't exist
                await client.query(`
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
                `)

                // 2. Create Tables (with explicit references to the types)
                await client.query(`
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
                `)
                initStatus = 'success'
            } catch (e: any) {
                initStatus = `Error: ${e.message}`
            }
        }

        // Try direct query on turf_users
        let turfUsersCount = 'unknown'
        try {
            const countRes = await client.query('SELECT count(*) FROM turf_users')
            turfUsersCount = countRes.rows[0].count
        } catch (e: any) {
            turfUsersCount = `Error: ${e.message}`
        }

        // Try creating a test table to see if it persists
        let createTestTable = 'not_attempted'
        try {
            await client.query('CREATE TABLE IF NOT EXISTS turf_test_connection (id TEXT PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())')
            await client.query('INSERT INTO turf_test_connection (id) VALUES ($1) ON CONFLICT DO NOTHING', [`test_${Date.now()}`])
            createTestTable = 'success'
        } catch (e: any) {
            createTestTable = `Error: ${e.message}`
        }

        // List tables in public (refresh after actions)
        const tablesResAfter = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `)

        // List recent users for debugging
        const recentUsers = await client.query(`
            SELECT id, email, name, role, "verificationToken", "emailVerified"
            FROM turf_users
            ORDER BY "createdAt" DESC
            LIMIT 10
        `)

        await client.end()

        return NextResponse.json({
            status: "ready",
            quick_actions: {
                clear_database: `${process.env.NEXTAUTH_URL || 'YOUR_URL'}/api/debug-db?clean=true`,
                delete_specific_user: `${process.env.NEXTAUTH_URL || 'YOUR_URL'}/api/debug-db?delete_user=USER_EMAIL`,
                initialize_schema: `${process.env.NEXTAUTH_URL || 'YOUR_URL'}/api/debug-db?init=true`,
                manual_verify_user: `${process.env.NEXTAUTH_URL || 'YOUR_URL'}/api/debug-db?verify=USER_EMAIL`,
                test_email_send: `${process.env.NEXTAUTH_URL || 'YOUR_URL'}/api/debug-db?test_email=USER_EMAIL`
            },
            init_status: initStatus,
            turf_users_count: turfUsersCount,
            recent_users: recentUsers.rows,
            public_tables: tablesResAfter.rows.map(r => r.table_name),
            env_vars: {
                RESEND_API_KEY: process.env.RESEND_API_KEY ? `set (starts with ${process.env.RESEND_API_KEY.substring(0, 5)}...)` : 'NOT SET',
                NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET (defaulting to localhost)',
                DATABASE_URL: dbUrl.replace(/:[^:@]+@/, ':***@'),
                NODE_ENV: process.env.NODE_ENV
            },
            meta: {
                database: metaRes.rows[0].current_database,
                schema: metaRes.rows[0].current_schema,
                user: metaRes.rows[0].current_user,
                all_schemas: schemasRes.rows.map(r => r.schema_name),
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
