'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { getStoredReferralCode, clearStoredReferralCode } from '@/components/ReferralCapture';

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

  // Capture referral code from URL or localStorage on mount
  useEffect(() => {
    // First check URL for referral code
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
  }, [searchParams]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Store referral code in cookie before redirecting to Google
      // This will be read by the auth callback to apply the referral
      if (referralCode) {
        document.cookie = `pending_referral=${referralCode}; path=/; max-age=3600; samesite=lax`;
      }
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google sign-up error:', error);
      alert('Failed to sign up with Google. Please try again.');
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
      alert('Please enter your name');
      return;
    }

    if (formData.name.trim().length < 2) {
      alert('Name must be at least 2 characters');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      alert('Please enter a password');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
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
            alert('Account created successfully! However, automatic sign-in failed. Please sign in manually with your credentials.');
            router.push('/auth/signin');
          } else if (result?.ok) {
            console.log('Auto sign-in successful, redirecting to dashboard...');
            router.push('/dashboard');
            router.refresh();
          } else {
            // Fallback for unexpected cases
            console.error('Unexpected auto sign-in result:', result);
            alert('Account created successfully! However, an unexpected error occurred during automatic sign-in. Please sign in manually.');
            router.push('/auth/signin');
          }
        } catch (error) {
          console.error('Auto sign-in error:', error);
          alert('Account created successfully! However, automatic sign-in failed. Please sign in manually with your credentials.');
          // Redirect to sign-in page instead of dashboard
          router.push('/auth/signin');
        }
      } else {
        const error = await response.json();
        // Show specific error messages for all edge cases
        if (error.error?.includes('already exists')) {
          alert('An account with this email already exists. Please sign in instead.');
        } else if (error.error?.includes('Invalid email')) {
          alert('Please enter a valid email address.');
        } else if (error.error?.includes('Password must be')) {
          alert('Password must be at least 6 characters long.');
        } else if (error.error?.includes('Name must be')) {
          alert('Name must be at least 2 characters long.');
        } else if (error.error?.includes('All fields are required')) {
          alert('Please fill in all required fields.');
        } else if (error.error?.includes('Missing required fields')) {
          alert('Please fill in all required fields.');
        } else if (error.error?.includes('Failed to create user')) {
          alert('Failed to create account. Please try again.');
        } else {
          alert(`Sign up failed: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          alert('Network error. Please check your connection and try again.');
        } else if (error.message.includes('already exists')) {
          alert('An account with this email already exists. Please sign in instead.');
        } else {
          alert(`Sign up failed: ${error.message}`);
        }
      } else {
        alert('An error occurred. Please try again.');
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
              Akọ̀wé studio
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-[0.18em]">
              Create account
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Join the research workspace built for scholars.
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
              {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--card))] px-4 text-[hsl(var(--muted-foreground))] tracking-[0.2em]">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <Input
              type="text"
              name="name"
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Already have an account?{' '}
              <Link href="/auth/signin" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                Sign in
              </Link>
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[hsl(var(--secondary))]">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
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
                Create account
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Loading...
              </p>
            </div>
          </Card>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
