import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session_token');
  const pathname = event.url.pathname;

  // Protect the root route (chatbot page)
  if (pathname === '/' && !sessionToken) {
    throw redirect(303, '/login');
  }

  if (pathname === '/login' && sessionToken) {
    throw redirect(303, '/');
  }

  return resolve(event);
};
