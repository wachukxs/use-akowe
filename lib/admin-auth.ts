import { cookies } from 'next/headers';

/**
 * Verifies if the current request has a valid admin session
 * @returns boolean indicating if the admin is authenticated
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie?.value) {
      return false;
    }

    // Decode and validate the session token
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
      const [prefix, timestamp] = decoded.split(':');

      // Verify the token structure
      if (prefix !== 'admin' || !timestamp) {
        return false;
      }

      // Check if the session is still valid (within 24 hours)
      const sessionTime = parseInt(timestamp, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - sessionTime > twentyFourHours) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return false;
  }
}

