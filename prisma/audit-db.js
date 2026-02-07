const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function audit() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const tables = ['users', 'bookings', 'payments', 'accounts', 'sessions'];

        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.log(`Columns in ${table}:`, res.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await client.end();
    }
}

audit();
