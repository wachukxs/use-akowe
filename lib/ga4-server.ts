/**
 * GA4 Measurement Protocol — server-side event sending.
 *
 * Fires events directly to Google Analytics from the server,
 * ensuring conversions are never missed even when client-side
 * tracking fails (e.g., redirect after Stripe checkout).
 *
 * Requires:
 *   GA4_MEASUREMENT_ID  — e.g. "G-KRXGBZVQ8Y"
 *   GA4_API_SECRET      — generated in GA4 Admin → Data Streams → Measurement Protocol API secrets
 */

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

interface GA4Event {
  name: string;
  params: Record<string, string | number | boolean>;
}

/**
 * Send one or more events to GA4 via the Measurement Protocol.
 *
 * @param clientId  A unique identifier for the user/session.
 *                  Using the MongoDB userId ensures server-side
 *                  events are attributable to the same user as
 *                  client-side gtag events (which also set user_id).
 * @param userId    Optional GA4 user_id for cross-device matching.
 * @param events    Array of events to send.
 */
export async function sendGA4ServerEvent(
  clientId: string,
  userId: string | undefined,
  events: GA4Event[]
): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn('[ga4-server] Missing GA4_MEASUREMENT_ID or GA4_API_SECRET — skipping server event');
    return;
  }

  const url = `${GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  const body: Record<string, unknown> = {
    client_id: clientId,
    events,
  };

  if (userId) {
    body.user_id = userId;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // GA4 Measurement Protocol returns 2xx even for invalid payloads,
    // but a non-2xx means a network or endpoint issue.
    if (!res.ok) {
      console.error('[ga4-server] GA4 Measurement Protocol returned', res.status);
    } else {
      console.info('[ga4-server] Event(s) sent:', events.map((e) => e.name).join(', '));
    }
  } catch (err) {
    // Never let analytics failures break the webhook
    console.error('[ga4-server] Failed to send event:', err);
  }
}
