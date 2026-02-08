'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { getStoredReferralCode } from '@/components/ReferralCapture';
import { setUserId } from '@/lib/gtag';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SignInForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for referral code from URL or localStorage
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    } else {
      const storedRef = getStoredReferralCode();
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Store referral code in cookie before redirecting to Google
      // This allows new users signing up via Google to be tracked
      if (referralCode) {
        document.cookie = `pending_referral=${referralCode}; path=/; max-age=3600; samesite=lax`;
      }
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert(t('errors.googleSignInFailed'));
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      alert(t('errors.enterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert(t('errors.validEmail'));
      return;
    }

    if (!password) {
      alert(t('errors.enterPassword'));
      return;
    }

    if (password.length < 6) {
      alert(t('errors.passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      // Check for errors FIRST - this is the key fix
      if (result?.error) {
        // Handle specific error cases with clean messages
        if (result.error === 'CredentialsSignin') {
          alert(t('errors.invalidCredentials'));
        } else if (result.error.includes('No account found')) {
          alert(t('errors.noAccount'));
        } else if (result.error.includes('Invalid password')) {
          alert(t('errors.invalidPassword'));
        } else {
          alert(`${t('errors.signInFailed')}: ${result.error}`);
        }
      } else if (result?.ok) {
        // Set GA user_id immediately after successful login
        // Note: We need to wait for session to be available, so we'll use a small delay
        // The GoogleAnalyticsUserId component will also set it, but this ensures immediate tracking
        setTimeout(async () => {
          try {
            // Fetch session to get user ID
            const sessionResponse = await fetch('/api/auth/session');
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              const userId = sessionData?.user?.id;
              if (userId) {
                setUserId(userId);
              }
            }
          } catch (error) {
            // Silently fail - GoogleAnalyticsUserId component will handle it
            console.error('Failed to set user_id immediately:', error);
          }
        }, 500);

        // Only redirect if there's no error AND ok is true
        router.push('/dashboard');
        // Note: router.refresh() removed - navigation will render the new page automatically
      } else {
        // Fallback for unexpected cases
        alert(t('errors.unexpectedError'));
      }
    } catch (error) {
      // Handle all possible error types
      if (error instanceof Error) {
        if (error.message.includes('No account found')) {
          alert(t('errors.noAccount'));
        } else if (error.message.includes('Invalid password')) {
          alert(t('errors.invalidPassword'));
        } else if (error.message.includes('Google')) {
          alert(t('errors.accountCreatedWithGoogle'));
        } else if (error.message.includes('Email and password are required')) {
          alert(t('errors.enterBothEmailPassword'));
        } else if (error.message.includes('CallbackRouteError')) {
          alert(t('errors.noAccount'));
        } else {
          alert(`${t('errors.signInFailed')}: ${error.message}`);
        }
      } else {
        alert(t('errors.errorOccurred'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="w-full max-w-md px-6">
        <Card className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
              {t('brand')}
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-[0.18em]">
              {t('signin.title')}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {t('signin.tagline')}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[hsl(var(--border))] rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">
              {isGoogleLoading ? t('signin.signingIn') : t('signin.continueWithGoogle')}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--card))] px-4 text-[hsl(var(--muted-foreground))] tracking-[0.2em]">
                {t('signin.or')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <Input
              type="email"
              label={t('signin.email')}
              placeholder={t('signin.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label={t('signin.password')}
                placeholder={t('signin.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                aria-label={showPassword ? t('signin.hidePassword') : t('signin.showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex justify-end text-xs uppercase tracking-[0.18em]">
              <Link href="/auth/forgot-password" className="underline underline-offset-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--secondary))]">
                {t('signin.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-sm font-semibold tracking-[0.24em]"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? t('signin.signingIn') : t('signin.submit')}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {t('signin.noAccount')}{' '}
              <Link href="/auth/signup" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                {t('signin.signUpLink')}
              </Link>
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              {t('signin.agreeSignIn')}{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                {t('signin.termsOfService')}
              </Link>{' '}
              {t('signin.and')}{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                {t('signin.privacyPolicy')}
              </Link>
              {t('signin.agreeEnd')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SignInFallback() {
  const t = useTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="w-full max-w-md px-6">
        <Card className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
              {t('brand')}
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-[0.18em]">
              {t('signin.title')}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {t('loading')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}

