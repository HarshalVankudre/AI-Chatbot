// src/routes/api/db/+server.js
import { json } from '@sveltejs/kit';
import { executeQuery, getDbSchema } from '$lib/server/db.js';

// GET endpoint to fetch the database schema
export async function GET() {
    try {
        const schemaInfo = await getDbSchema();
        return json(schemaInfo);
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}

// POST endpoint to execute a given SQL query
export async function POST({ request }) {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
        return json({ error: 'A valid SQL query string is required.' }, { status: 400 });
    }

    const result = await executeQuery(query);

    if (result.success) {
        return json(result.data);
    } else {
        return json({ error: result.error }, { status: 500 });
    }
}