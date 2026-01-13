import NextAuth from 'next-auth';
import { authOptions } from './auth';

// Suppress NextAuth's verbose error logging for expected auth failures
// Only suppress errors that are clearly from NextAuth's error handling system
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Only filter if this is clearly a NextAuth error (more specific pattern matching)
  const firstArg = args[0];
  const isString = typeof firstArg === 'string';
  const isError = firstArg instanceof Error;
  
  // Only suppress if it's a NextAuth-specific error format
  // Check for the specific NextAuth error prefix and structure
  if (isString && firstArg.startsWith('[auth][error] CredentialsSignin')) {
    // This is a NextAuth expected error - suppress verbose stack trace
    return;
  }
  
  // Check error message for NextAuth-specific patterns (more restrictive)
  if (isError || isString) {
    const errorMessage = isError ? firstArg.message : firstArg;
    // Only suppress if it's the exact NextAuth error URL pattern
    if (errorMessage.includes('CredentialsSignin: Read more at https://errors.authjs.dev')) {
      return;
    }
  }
  
  // Allow all other errors through (database errors, application errors, etc.)
  originalConsoleError.apply(console, args);
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
export { authOptions };

