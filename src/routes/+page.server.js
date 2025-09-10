import { redirect } from '@sveltejs/kit';
// --- NEW: Import the active session store ---
import { activeSessions } from './login/+page.server.js';

export const actions = {
  logout: ({ cookies }) => {
    // --- NEW: Clear the user's active session ---
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