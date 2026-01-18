import NextAuth from 'next-auth';
import { authOptions } from './auth';

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

