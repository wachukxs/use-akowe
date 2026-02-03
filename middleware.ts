import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to:
 * 1. Protect admin API routes
 * 2. Protect signed-in user routes
 * 3. Assign A/B test variants for landing page
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const searchParams = request.nextUrl.searchParams;

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

    // Assign new variant (40/30/30 split: Control 40%, Variant A 30%, Variant B 30%)
    // Control is the baseline, so it gets a larger share for better comparison
    const random = Math.random();
    let variant;
    if (random < 0.4) {
      variant = 'control';
    } else if (random < 0.7) {
      variant = 'variant_a';
    } else {
      variant = 'variant_b';
    }

    // Set cookie with 30-day expiration
    response.cookies.set('akowe_ab_variant', variant, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }

  // Handle Paywall A/B testing for authenticated routes
  if (pathname.startsWith('/project') || pathname.startsWith('/dashboard')) {
    // Check for existing paywall variant cookie
    const existingPaywallVariant = request.cookies.get('akowe_paywall_variant');
    
    if (existingPaywallVariant?.value && ['variant_a', 'variant_b'].includes(existingPaywallVariant.value)) {
      // User already has a variant, keep it
      return response;
    }

    // Assign new paywall variant (50/50 split)
    const paywallVariant = Math.random() < 0.5 ? 'variant_a' : 'variant_b';

    // Set cookie with 30-day expiration
    response.cookies.set('akowe_paywall_variant', paywallVariant, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }

  // Normalize UTM parameters and referrers to fix "Unassigned" traffic
  // If there's a ref parameter but no UTMs, add default UTMs to the response
  const hasRef = searchParams.has('ref');
  const hasUTM = searchParams.has('utm_source') || 
                 searchParams.has('utm_medium') || 
                 searchParams.has('utm_campaign');
  
  // Store UTM params in response headers for client-side tracking
  // This avoids redirect loops while ensuring UTMs are tracked
  if (hasRef && !hasUTM) {
    response.headers.set('x-utm-source', 'referral');
    response.headers.set('x-utm-medium', 'referral');
    response.headers.set('x-utm-campaign', 'referral');
  }

  // Strip stray callbackUrl on public routes to avoid unintended auth redirects
  const isAuthRoute = pathname.startsWith('/auth');
  const isProtected = ['/dashboard', '/project', '/settings', '/payment'].some((path) =>
    pathname.startsWith(path)
  );
  if (!isProtected && !isAuthRoute) {
    const callbackCookie = request.cookies.get('next-auth.callback-url');
    if (callbackCookie?.value && callbackCookie.value.includes('/auth')) {
      // Clear callback-url cookies that point to auth pages to prevent loops
      response.cookies.delete('next-auth.callback-url');
    }

    if (searchParams.has('callbackUrl')) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('callbackUrl');
      const redirectResponse = NextResponse.redirect(cleanUrl);
      redirectResponse.cookies.delete('next-auth.callback-url');
      return redirectResponse;
    }
  }

  return response;
}

// Run middleware on routes that need UTM normalization and protection
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/',
    '/auth/:path*',
    '/dashboard/:path*',
    '/project/:path*',
    '/settings/:path*',
    '/payment/:path*',
    '/affiliate/:path*',
    '/guides/:path*',
    '/templates/:path*',
    '/citation-styles/:path*',
    '/faq/:path*',
    '/compare/:path*',
    '/keywords/:path*',
  ],
};
