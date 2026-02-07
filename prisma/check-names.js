const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkExactNames() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables (raw names):', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

checkExactNames();
