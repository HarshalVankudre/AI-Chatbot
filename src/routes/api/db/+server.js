// src/routes/api/db/+server.js
import {
    json
} from '@sveltejs/kit';
import {
    executeQuery,
    getDbSchema
} from '$lib/server/db.js';

// Endpoint to get the database schema
export async function GET() {
    try {
        const schemaInfo = await getDbSchema();
        return json(schemaInfo);
    } catch (error) {
        return json({
            error: error.message
        }, {
            status: 500
        });
    }
}

// Endpoint to execute a query
export async function POST({
    request
}) {
    const {
        query
    } = await request.json();

    if (!query) {
        return json({
            error: 'Missing query in the request body'
        }, {
            status: 400
        });
    }

    const result = await executeQuery(query);

    if (result.success) {
        return json(result.data);
    } else {
        return json({
            error: result.error
        }, {
            status: 500
        });
    }
}