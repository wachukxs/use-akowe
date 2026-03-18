import NextAuth from 'next-auth';
import { authOptions } from './auth';

// Ensure Auth.js always has a valid base URL so it never calls new URL(invalid).
// Otherwise GET /api/auth/providers can throw "Failed to construct 'URL': Invalid URL"
// when NEXTAUTH_URL is unset or the request URL is relative (e.g. in some runtimes).
const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
if (!authUrl || typeof authUrl !== 'string' || authUrl.trim() === '') {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

// Debug mode: keeping console output visible for troubleshooting.
// If you want to re-enable suppression of noisy, expected NextAuth errors,
// restore the block below (currently commented). Remember to remove debug=true in auth.ts as well.
/*
// Suppress NextAuth's verbose error logging for expected auth failures.
// Uncomment to reduce noise once production login issues are resolved.
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const firstArg = args[0];
  const isString = typeof firstArg === 'string';
  const isError = firstArg instanceof Error;

  // Suppress expected credential failures
  if (isString && firstArg.startsWith('[auth][error] CredentialsSignin')) {
    return;
  }

  // Suppress the standard CredentialsSignin warning link
  if (isError || isString) {
    const errorMessage = isError ? firstArg.message : firstArg;
    if (errorMessage.includes('CredentialsSignin: Read more at https://errors.authjs.dev')) {
      return;
    }
  }

  // Let all other errors through
  originalConsoleError.apply(console, args);
};
*/

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
export { authOptions };

