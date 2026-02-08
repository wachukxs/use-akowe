import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/** Path without locale prefix for route checks (e.g. /en/dashboard -> /dashboard, / -> /) */
function pathWithoutLocale(pathname: string): string {
  const localePattern = routing.locales.join('|');
  const without = pathname.replace(new RegExp(`^/(${localePattern})(?=/|$)`), '') || '';
  return without || '/';
}

/**
 * Middleware to:
 * 1. Protect admin API routes
 * 2. Assign A/B test variants for landing page
 * 3. Paywall A/B for project/dashboard
 * 4. UTM normalization and callbackUrl stripping
 * 5. next-intl locale routing (redirects / -> /en, etc.)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const searchParams = request.nextUrl.searchParams;
  const path = pathWithoutLocale(pathname);

  // 1. Admin API routes: no locale, return immediately
  if (pathname.startsWith('/api/admin')) {
    const publicAdminRoutes = ['/api/admin/login', '/api/admin/logout', '/api/admin/verify'];
    if (publicAdminRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
      const [prefix, timestamp] = decoded.split(':');
      if (prefix !== 'admin' || !timestamp) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const sessionTime = parseInt(timestamp, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - sessionTime > twentyFourHours) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 2. Strip callbackUrl on public routes before i18n (avoid auth redirect loops)
  const isAuthRoute = pathname.startsWith('/auth') || path.startsWith('/auth');
  const isProtected = ['/dashboard', '/project', '/settings', '/payment'].some((p) => path.startsWith(p));
  if (!isProtected && !isAuthRoute) {
    const callbackCookie = request.cookies.get('next-auth.callback-url');
    if (callbackCookie?.value && callbackCookie.value.includes('/auth')) {
      const res = NextResponse.next();
      res.cookies.delete('next-auth.callback-url');
      // Continue to i18n with this response replaced below
    }
    if (searchParams.has('callbackUrl')) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('callbackUrl');
      const redirectResponse = NextResponse.redirect(cleanUrl);
      redirectResponse.cookies.delete('next-auth.callback-url');
      return redirectResponse;
    }
  }

  // 3. next-intl: locale negotiation, redirects (e.g. / -> /en)
  const handleI18nRouting = createMiddleware(routing);
  let response = handleI18nRouting(request);

  // 4. Apply A/B and other cookies/headers on top of next-intl response
  const cookieOptions = {
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };

  if (path === '/') {
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);
    if (isBot) {
      response.cookies.set('akowe_ab_variant', 'control', cookieOptions);
    } else {
      const existingVariant = request.cookies.get('akowe_ab_variant');
      if (!existingVariant?.value || !['control', 'variant_a', 'variant_b'].includes(existingVariant.value)) {
        const random = Math.random();
        const variant = random < 0.4 ? 'control' : random < 0.7 ? 'variant_a' : 'variant_b';
        response.cookies.set('akowe_ab_variant', variant, cookieOptions);
      }
    }
  }

  if (path.startsWith('/project') || path.startsWith('/dashboard')) {
    const existingPaywall = request.cookies.get('akowe_paywall_variant');
    if (!existingPaywall?.value || !['variant_a', 'variant_b'].includes(existingPaywall.value)) {
      response.cookies.set('akowe_paywall_variant', Math.random() < 0.5 ? 'variant_a' : 'variant_b', cookieOptions);
    }
  }

  const hasRef = searchParams.has('ref');
  const hasUTM = searchParams.has('utm_source') || searchParams.has('utm_medium') || searchParams.has('utm_campaign');
  if (hasRef && !hasUTM) {
    response.headers.set('x-utm-source', 'referral');
    response.headers.set('x-utm-medium', 'referral');
    response.headers.set('x-utm-campaign', 'referral');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
