import { fail, redirect } from '@sveltejs/kit';

// --- SIMULATED USER DATABASE ---
// In a real application, you would query an actual database here.
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

    // Check if the user exists and the password is correct
    if (!validUsers[username] || validUsers[username] !== password) {
      return fail(401, { error: 'Invalid username or password. Please try again.' });
    }

    // --- SUCCESSFUL LOGIN ---
    // 1. Create a session token (in a real app, use a secure, random string)
    const sessionToken = `session_${username}_${Date.now()}`;

    // 2. Set a secure, HTTP-only cookie to manage the session
    cookies.set('session_token', sessionToken, {
      path: '/',
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    // 3. Redirect to the main chatbot page
    throw redirect(303, '/');
  }
};
