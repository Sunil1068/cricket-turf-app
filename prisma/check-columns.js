const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Columns in users table:', res.rows.map(r => r.column_name));
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

check();
