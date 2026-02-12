import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { validateUnsubscribeToken, suppressEmail } from '@/lib/email-suppression';

/**
 * GET /api/email/unsubscribe?email=X&token=Y
 * Renders a simple HTML confirmation page after unsubscribing.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email || !token) {
    return new NextResponse(renderPage('Invalid unsubscribe link', 'The link is missing required parameters.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    if (!validateUnsubscribeToken(token, email)) {
      return new NextResponse(renderPage('Invalid link', 'This unsubscribe link is not valid.', false), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    await connectDB();
    await suppressEmail(email, 'unsubscribed', 'link');

    return new NextResponse(renderPage('Unsubscribed', 'You have been unsubscribed from Akowe engagement emails. You will no longer receive these emails.', true), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[unsubscribe] GET error:', err);
    return new NextResponse(renderPage('Something went wrong', 'Please try again later or reply to any email from us to request removal.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/**
 * POST /api/email/unsubscribe
 * Handles RFC 8058 one-click unsubscribe (List-Unsubscribe-Post header).
 * Gmail/Outlook send: POST with body "List-Unsubscribe=One-Click"
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email || !token) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    if (!validateUnsubscribeToken(token, email)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    await connectDB();
    await suppressEmail(email, 'unsubscribed', 'one-click');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[unsubscribe] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function renderPage(title: string, message: string, success: boolean): string {
  const color = success ? '#059669' : '#dc2626';
  const icon = success ? '&#10003;' : '&#10007;';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Akowe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { text-align: center; max-width: 420px; padding: 48px 32px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; color: ${color}; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { font-size: 15px; color: #6b7280; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
