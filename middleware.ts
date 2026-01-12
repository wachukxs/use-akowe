import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to:
 * 1. Protect admin API routes
 * 2. Assign A/B test variants for landing page
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Handle admin API routes
  if (pathname.startsWith('/api/admin')) {
    // Allow public admin routes without auth
    const publicAdminRoutes = ['/api/admin/login', '/api/admin/logout', '/api/admin/verify'];
    if (publicAdminRoutes.includes(pathname)) {
      return response;
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
      return response;
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Handle A/B testing for landing page
  if (pathname === '/') {
    // Check if user is a bot (always show control for SEO)
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);

    // Always show control to bots for SEO
    if (isBot) {
      response.cookies.set('akowe_ab_variant', 'control', {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }

    // Check for existing variant cookie
    const existingVariant = request.cookies.get('akowe_ab_variant');
    
    if (existingVariant?.value && ['control', 'variant_a', 'variant_b'].includes(existingVariant.value)) {
      // User already has a variant, keep it
      return response;
    }

    // Assign new variant (50/50 split between variant_a and variant_b)
    // Control is the current version (no cookie needed, but we'll set it for consistency)
    const random = Math.random();
    const variant = random < 0.5 ? 'variant_a' : 'variant_b';

    // Set cookie with 30-day expiration
    response.cookies.set('akowe_ab_variant', variant, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }

  return response;
}

// Run middleware on admin API routes and landing page
export const config = {
  matcher: ['/api/admin/:path*', '/'],
};
