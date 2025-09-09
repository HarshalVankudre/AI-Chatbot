import { redirect } from '@sveltejs/kit';

export const actions = {
  logout: ({ cookies }) => {
    // Delete the session cookie
    cookies.delete('session_token', { path: '/' });

    // Redirect the user to the login page
    throw redirect(303, '/login');
  }
};
