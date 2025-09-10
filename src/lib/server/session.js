// src/lib/server/session.js

/**
 * @type {Map<string, string>}
 * A map to store active user sessions.
 * Key: username, Value: sessionToken
 * In a real app, use a more persistent store like Redis or a database.
 */
export const activeSessions = new Map();