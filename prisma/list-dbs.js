const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDbs() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL.replace(/\/neondb\?/, '/postgres?'), // Try connecting to postgres db to list others
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT datname FROM pg_database WHERE datistemplate = false;`);
        console.log('Databases in cluster:', res.rows.map(r => r.datname));
    } catch (err) {
        console.error('Check DBs failed:', err);
    } finally {
        await client.end();
    }
}

checkDbs();
