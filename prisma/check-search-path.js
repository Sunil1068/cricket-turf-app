const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSearchPath() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query(`SHOW search_path;`);
        console.log('Current search_path:', res.rows[0].search_path);

        const schemaRes = await client.query(`SELECT current_schema();`);
        console.log('Current schema:', schemaRes.rows[0].current_schema);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

checkSearchPath();
