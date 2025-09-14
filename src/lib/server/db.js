// src/lib/server/db.js
import mariadb from 'mariadb';
import {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_DATABASE
} from '$env/static/private';

const pool = mariadb.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    connectionLimit: 5
});

export async function executeQuery(query, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(query, params);
        // The mariadb driver returns an array with a meta object.
        // We only need the array of results.
        const results = Array.isArray(rows) ? rows : [];
        const columns = rows.meta ? rows.meta.map(m => m.name) : [];

        return {
            success: true,
            data: {
                columns,
                values: results.map(row => Object.values(row))
            }
        };

    } catch (err) {
        console.error("Database Query Error:", err);
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

export async function getDbSchema() {
    const query = `
        SELECT table_name, GROUP_CONCAT(column_name ORDER BY ordinal_position) AS columns
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        GROUP BY table_name;
    `;
    let conn;
    try {
        conn = await pool.getConnection();
        const tables = await conn.query(query);

        if (!tables || tables.length === 0) {
            return {
                schema: "No tables found in the database.",
                tableNames: ""
            };
        }

        const schema = tables.map(table => {
            return `Table: ${table.table_name}\nColumns: ${table.columns}`;
        }).join('\n\n');

        const tableNames = tables.map(table => table.table_name).join(', ');

        return {
            schema,
            tableNames
        };

    } catch (err) {
        console.error("Schema Fetch Error:", err);
        throw new Error("Could not fetch database schema.");
    } finally {
        if (conn) conn.release();
    }
}