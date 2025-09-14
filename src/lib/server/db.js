// src/lib/server/db.js
import mariadb from 'mariadb';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } from '$env/static/private';

// Create a connection pool for efficient database access
const pool = mariadb.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    connectionLimit: 5,
    connectTimeout: 10000 // 10-second timeout
});

/**
 * Executes a SQL query against the database.
 * @param {string} query - The SQL query to execute.
 * @param {any[]} [params=[]] - Optional parameters for prepared statements.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function executeQuery(query, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(query, params);

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
            error: `Database Error: ${err.message}`
        };
    } finally {
        if (conn) conn.release(); // Always release the connection back to the pool
    }
}

/**
 * Fetches the schema of the database, including table names and their columns.
 * @returns {Promise<{schema: string, tableNames: string}>}
 */
export async function getDbSchema() {
    const query = `
        SELECT table_name, GROUP_CONCAT(column_name ORDER BY ordinal_position SEPARATOR ', ') AS columns
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
                tableNames: "none"
            };
        }

        const schema = tables.map(table => {
            return `Table: \`${table.table_name}\` (Columns: ${table.columns})`;
        }).join('\n');

        const tableNames = tables.map(table => table.table_name).join(', ');

        return { schema, tableNames };
    } catch (err) {
        console.error("Schema Fetch Error:", err);
        throw new Error("Could not connect to the database to fetch schema.");
    } finally {
        if (conn) conn.release();
    }
}