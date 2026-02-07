const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function scanAll() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE 'turf_%'
        `);
        console.log('Prefixed tables found:', res.rows);
    } catch (err) {
        console.error('Scan failed:', err);
    } finally {
        await client.end();
    }
}

scanAll();
