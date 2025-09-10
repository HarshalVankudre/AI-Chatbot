// src/routes/login/+page.server.js

import { fail, redirect } from '@sveltejs/kit';
// --- NEW: Import from the server module ---
import { activeSessions } from '$lib/server/session.js';

// --- SIMULATED USER DATABASE ---
const validUsers = {
  'admin': 'password123',
  'user1': 'sveltekit_rocks',
  'testuser': 'test'
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    // Check for an existing active session
    if (activeSessions.has(username)) {
      return fail(409, { error: 'This user is already logged in on another device.' });
    }

    // Check if the user exists and the password is correct
    if (!validUsers[username] || validUsers[username] !== password) {
      return fail(401, { error: 'Invalid username or password. Please try again.' });
    }

    // --- SUCCESSFUL LOGIN ---
    const sessionToken = `session_${username}_${Date.now()}`;

    // Store the active session on the server
    activeSessions.set(username, sessionToken);

    cookies.set('session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 // 1 hour
    });

    throw redirect(303, '/');
  }
};

// REMOVED: Do NOT export activeSessions from here.