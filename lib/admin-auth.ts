import { cookies } from 'next/headers';
import type { AdminRole } from '@/models/Admin';

export interface AdminSession {
  authenticated: boolean;
  adminId?: string;
  role?: AdminRole;
}

/**
 * Verifies if the current request has a valid admin session.
 * Returns session details including the admin's role.
 */
export async function verifyAdminSession(): Promise<AdminSession> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie?.value) {
      return { authenticated: false };
    }

    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
      const [prefix, adminId, role, timestamp] = decoded.split(':');

      if (prefix !== 'admin' || !adminId || !role || !timestamp) {
        return { authenticated: false };
      }

      const sessionTime = parseInt(timestamp, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - sessionTime > twentyFourHours) {
        return { authenticated: false };
      }

      return { authenticated: true, adminId, role: role as AdminRole };
    } catch {
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return { authenticated: false };
  }
}

/**
 * Verifies admin session and requires full_access role.
 * Returns the session if authorized, or null if not.
 */
export async function requireFullAccess(): Promise<AdminSession | null> {
  const session = await verifyAdminSession();
  if (!session.authenticated || session.role !== 'full_access') {
    return null;
  }
  return session;
}
