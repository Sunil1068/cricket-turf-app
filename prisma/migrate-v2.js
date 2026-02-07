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
        console.log('Connected to Neon for migration...');

        // 1. Add paymentId to bookings
        console.log('Adding paymentId to bookings table...');
        await client.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
        `);

        // 2. Remove bookingId from payments (if exists)
        console.log('Removing bookingId from payments table...');
        await client.query(`
            ALTER TABLE payments 
            DROP COLUMN IF EXISTS "bookingId";
        `);

        // 3. Add Foreign Key constraint
        console.log('Adding foreign key constraint...');
        await client.query(`
            ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS bookings_paymentId_fkey,
            ADD CONSTRAINT bookings_paymentId_fkey 
            FOREIGN KEY ("paymentId") REFERENCES payments(id) 
            ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
