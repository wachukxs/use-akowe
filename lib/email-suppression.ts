import connectDB from '@/lib/mongodb';
import EmailSuppression from '@/models/EmailSuppression';

/**
 * Returns a Set of lowercase suppressed email addresses.
 */
export async function getSuppressedEmails(): Promise<Set<string>> {
  await connectDB();
  const records = await EmailSuppression.find({}).select('email').lean();
  return new Set(records.map((r) => r.email.toLowerCase()));
}

/**
 * Suppresses an email address. Upserts so calling multiple times is safe.
 */
export async function suppressEmail(
  email: string,
  reason: 'bounced' | 'complained' | 'unsubscribed',
  source: string
): Promise<void> {
  await connectDB();
  await EmailSuppression.updateOne(
    { email: email.toLowerCase() },
    { $set: { reason, source } },
    { upsert: true }
  );
}
