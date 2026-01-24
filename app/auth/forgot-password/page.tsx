'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok && data?.error) {
        throw new Error(data.error);
      }

      setStatus('success');
      setMessage('If we find an account for that email, a reset link will be sent.');
    } catch (error) {
      console.error('Failed to request password reset:', error);
      setStatus('error');
      setMessage('Unable to send reset email right now. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="w-full max-w-md px-6">
        <Card className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
              Akọ̀wé studio
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-[0.18em]">
              Reset password
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Enter your account email and we&apos;ll send a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {message && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-sm font-semibold tracking-[0.24em]"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="text-center text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] space-y-2">
            <Link href="/auth/signin" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
