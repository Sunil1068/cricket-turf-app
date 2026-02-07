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

        // Try direct query on turf_users
        let turfUsersCount = 'unknown'
        try {
            const countRes = await client.query('SELECT count(*) FROM turf_users')
            turfUsersCount = countRes.rows[0].count
        } catch (e: any) {
            turfUsersCount = `Error: ${e.message}`
        }

        await client.end()

        return NextResponse.json({
            database: metaRes.rows[0].current_database,
            schema: metaRes.rows[0].current_schema,
            user: metaRes.rows[0].current_user,
            search_path: pathRes.rows[0].search_path,
            public_tables: tablesRes.rows.map(r => r.table_name),
            turf_users_count: turfUsersCount,
            all_schemas: schemasRes.rows.map(r => r.schema_name),
            url_sanitized: dbUrl.replace(/:[^:@]+@/, ':***@') // Sanitize password
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
