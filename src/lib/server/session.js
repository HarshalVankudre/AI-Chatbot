// src/lib/server/session.js

/**
 * @type {Map<string, string>}
 * A map to store active user sessions.
 * Key: username, Value: sessionToken
 * In a real-world application, use a more persistent and secure store like Redis or a database.
 */
export const activeSessions = new Map();