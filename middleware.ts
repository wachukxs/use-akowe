import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin API routes
 * Validates the admin session cookie before allowing access
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to admin API routes (except login, logout, verify)
  if (pathname.startsWith('/api/admin')) {
    // Allow public admin routes without auth
    const publicAdminRoutes = ['/api/admin/login', '/api/admin/logout', '/api/admin/verify'];
    if (publicAdminRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Check for admin session cookie
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode and validate the session token
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
      const [prefix, timestamp] = decoded.split(':');

      // Verify the token structure
      if (prefix !== 'admin' || !timestamp) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check if the session is still valid (within 24 hours)
      const sessionTime = parseInt(timestamp, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - sessionTime > twentyFourHours) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }

      // Session is valid, proceed
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Only run middleware on admin API routes
export const config = {
  matcher: '/api/admin/:path*',
};
