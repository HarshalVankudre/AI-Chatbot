// src/routes/+page.server.js

import { redirect } from '@sveltejs/kit';
// --- NEW: Import from the server module ---
import { activeSessions } from '$lib/server/session.js';

export const actions = {
  logout: ({ cookies }) => {
    const token = cookies.get('session_token');
    if (token) {
        // Find the username associated with the token to clear it from the map
        for (const [username, sessionToken] of activeSessions.entries()) {
            if (sessionToken === token) {
                activeSessions.delete(username);
                break;
            }
        }
    }

    cookies.delete('session_token', { path: '/' });
    throw redirect(303, '/login');
  }
};