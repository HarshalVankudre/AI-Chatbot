import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session_token');
  const pathname = event.url.pathname;

  // Protect the root route (chatbot page)
  if (pathname === '/' && !sessionToken) {
    // If user is not logged in and tries to access chatbot, redirect to login
    throw redirect(303, '/login');
  }

  // Prevent logged-in users from accessing the login page
  if (pathname === '/login' && sessionToken) {
    // If user is logged in and tries to access login, redirect to chatbot
    throw redirect(303, '/');
  }

  return resolve(event);
};
