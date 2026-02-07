const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function renameTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to Neon for table prefixing...');

        const mappings = {
            'users': 'turf_users',
            'accounts': 'turf_accounts',
            'sessions': 'turf_sessions',
            'bookings': 'turf_bookings',
            'payments': 'turf_payments'
        };

        for (const [oldName, newName] of Object.entries(mappings)) {
            // Check if old table exists
            const checkOld = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '${oldName}'
                );
            `);

            if (checkOld.rows[0].exists) {
                console.log(`Renaming ${oldName} to ${newName}...`);
                // Use quotes for the table names to be safe, though rename might fail if new exists
                await client.query(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
            } else {
                console.log(`Old table ${oldName} not found, skipping rename.`);
            }
        }

        console.log('Table prefixing completed successfully!');
    } catch (err) {
        console.error('Rename failed:', err);
    } finally {
        await client.end();
    }
}

renameTables();
