'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Reset link is missing or invalid. Please request a new one.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'loading' || status === 'success') return;

    if (!token || !email) {
      setMessage('Reset link is missing or invalid. Please request a new one.');
      setStatus('error');
      return;
    }

    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setStatus('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to reset password');
      }

      setStatus('success');
      setMessage('Password updated! Redirecting you to sign in...');
      setTimeout(() => router.push('/auth/signin'), 1500);
    } catch (error) {
      console.error('Failed to reset password:', error);
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reset password right now. Please request a new link.'
      );
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
              Set new password
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Choose a strong password to secure your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="password"
              label="New password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Confirm password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {status === 'loading' ? 'Updating...' : 'Update password'}
            </Button>
          </form>

          <div className="text-center text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] space-y-2">
            <Link href="/auth/forgot-password" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
              Request a new link
            </Link>
            <div>
              <Link href="/auth/signin" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                Back to sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="w-full max-w-md px-6">
          <Card className="p-10 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                Akọ̀wé studio
              </span>
              <h1 className="text-3xl font-bold uppercase tracking-[0.18em]">
                Set new password
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Loading...
              </p>
            </div>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
