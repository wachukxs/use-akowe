'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Link, useRouter } from '@/i18n/navigation';
import Card from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { getStoredReferralCode, clearStoredReferralCode } from '@/components/ReferralCapture';
import { trackFunnel } from '@/lib/gtag';

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

function SignUpForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Track the last processed URL params to detect navigation changes
  const [lastProcessedParams, setLastProcessedParams] = useState<string | null>(null);
  const hasTrackedSignupStart = useRef(false);

  // Track signup_start when form is first viewed
  useEffect(() => {
    if (!hasTrackedSignupStart.current) {
      const source = searchParams.get('from') || 'direct';
      trackFunnel.signupStart(source);
      hasTrackedSignupStart.current = true;
    }
  }, [searchParams]);

  // Capture referral code, email, and lead magnet source from URL
  // Re-runs when searchParams change (e.g., user clicks different lead magnet)
  useEffect(() => {
    // Create a key from current params to detect changes
    const currentParamsKey = `${searchParams.get('ref') || ''}-${searchParams.get('email') || ''}-${searchParams.get('from') || ''}`;
    
    // Skip if we've already processed these exact params
    if (currentParamsKey === lastProcessedParams) {
      return;
    }
    
    // Mark these params as processed
    setLastProcessedParams(currentParamsKey);
    
    // Handle referral code
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    } else {
      // Fallback to localStorage (captured from any previous page visit)
      const storedRef = getStoredReferralCode();
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }

    // Pre-fill email from lead magnet
    // Only update if there's a new email param (allows user edits when params don't change)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }

    // Store lead magnet source for redirect after signup
    // Only set if present, don't clear - preserves value if user navigates away and back
    const fromParam = searchParams.get('from');
    if (fromParam) {
      sessionStorage.setItem('signup_from', fromParam);
    }
  }, [searchParams, lastProcessedParams]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Track signup start for Google OAuth
      const source = searchParams.get('from') || 'direct';
      trackFunnel.signupStart(source);
      
      // Store referral code in cookie before redirecting to Google
      // This will be read by the auth callback to apply the referral
      if (referralCode) {
        document.cookie = `pending_referral=${referralCode}; path=/; max-age=2592000; samesite=lax${window.location.protocol === 'https:' ? '; secure' : ''}`;
      }
      
      // Store source for tracking signup_complete after redirect
      sessionStorage.setItem('signup_source', source);
      sessionStorage.setItem('signup_method', 'google');
      
      // Determine callback URL based on lead magnet source
      const fromParam = searchParams.get('from');
      let callbackUrl = '/dashboard';
      if (fromParam === 'import') {
        callbackUrl = '/dashboard/import?continue=true';
      } else if (fromParam === 'plagiarism') {
        callbackUrl = '/dashboard?from=plagiarism';
      }
      
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Google sign-up error:', error);
      alert(t('errors.googleSignUpFailed'));
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert(t('errors.enterName'));
      return;
    }

    if (formData.name.trim().length < 2) {
      alert(t('errors.nameMinLength'));
      return;
    }

    if (!formData.email.trim()) {
      alert(t('errors.enterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(t('errors.validEmail'));
      return;
    }

    if (!formData.password) {
      alert(t('errors.enterPasswordSignUp'));
      return;
    }

    if (formData.password.length < 6) {
      alert(t('errors.passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert(t('errors.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode, // Include referral code if present
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const userId = responseData.user?.id;
        const source = searchParams.get('from') || 'direct';
        
        // Track signup completion
        if (userId) {
          trackFunnel.signupComplete(userId, 'credentials', source);
        }
        
        // Clear the stored referral code after successful signup
        clearStoredReferralCode();
        
        // User created successfully, now sign them in
        try {
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          console.log('Auto sign-in result:', result);

          // Check for errors FIRST
          if (result?.error) {
            // Handle auto sign-in failure gracefully
            alert(t('errors.accountCreatedSignInFailed'));
            router.push('/auth/signin');
          } else if (result?.ok) {
            console.log('Auto sign-in successful, redirecting...');
            // Check for lead magnet redirect
            const signupFrom = sessionStorage.getItem('signup_from');
            sessionStorage.removeItem('signup_from');
            if (signupFrom === 'import') {
              router.push('/dashboard/import?continue=true');
            } else if (signupFrom === 'plagiarism') {
              router.push('/dashboard?from=plagiarism');
            } else if (signupFrom === 'topic') {
              // LeadMagnetContinuation will handle showing the topic finder results
              router.push('/dashboard');
            } else {
              router.push('/dashboard');
            }
            // Note: router.refresh() removed - navigation will render the new page automatically
          } else {
            // Fallback for unexpected cases
            console.error('Unexpected auto sign-in result:', result);
            alert(t('errors.accountCreatedUnexpected'));
            router.push('/auth/signin');
          }
        } catch (error) {
          console.error('Auto sign-in error:', error);
          alert(t('errors.accountCreatedSignInFailed'));
          // Redirect to sign-in page instead of dashboard
          router.push('/auth/signin');
        }
      } else {
        const error = await response.json();
        // Show specific error messages for all edge cases
        if (error.error?.includes('already exists')) {
          alert(t('errors.emailAlreadyExists'));
        } else if (error.error?.includes('Invalid email')) {
          alert(t('errors.validEmailShort'));
        } else if (error.error?.includes('Password must be')) {
          alert(t('errors.passwordMinLengthLong'));
        } else if (error.error?.includes('Name must be')) {
          alert(t('errors.nameMinLengthLong'));
        } else if (error.error?.includes('All fields are required')) {
          alert(t('errors.fillRequiredFields'));
        } else if (error.error?.includes('Missing required fields')) {
          alert(t('errors.fillRequiredFields'));
        } else if (error.error?.includes('Failed to create user')) {
          alert(t('errors.failedToCreateAccount'));
        } else {
          alert(`${t('errors.signUpFailed')}: ${error.error || t('errors.unknownError')}`);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          alert(t('errors.networkError'));
        } else if (error.message.includes('already exists')) {
          alert(t('errors.emailAlreadyExists'));
        } else {
          alert(`${t('errors.signUpFailed')}: ${error.message}`);
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
              {t('signup.title')}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {t('signup.tagline')}
            </p>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[hsl(var(--border))] rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">
              {isGoogleLoading ? t('signup.signingUp') : t('signup.continueWithGoogle')}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--card))] px-4 text-[hsl(var(--muted-foreground))] tracking-[0.2em]">
                {t('signup.or')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <Input
              type="text"
              name="name"
              label={t('signup.fullName')}
              placeholder={t('signup.fullNamePlaceholder')}
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <Input
              type="email"
              name="email"
              label={t('signup.email')}
              placeholder={t('signup.emailPlaceholder')}
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label={t('signup.password')}
                placeholder={t('signup.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                aria-label={showPassword ? t('signup.hidePassword') : t('signup.showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                label={t('signup.confirmPassword')}
                placeholder={t('signup.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? t('signup.hidePassword') : t('signup.showPassword')}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-sm font-semibold uppercase tracking-[0.24em]"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? t('signup.creatingAccount') : t('signup.submit')}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {t('signup.hasAccount')}{' '}
              <Link href="/auth/signin" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                {t('signup.signInLink')}
              </Link>
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              {t('signup.agreeSignUp')}{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                {t('signup.termsOfService')}
              </Link>{' '}
              {t('signup.and')}{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                {t('signup.privacyPolicy')}
              </Link>
              {t('signup.agreeEnd')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SignUpFallback() {
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
              {t('signup.title')}
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
