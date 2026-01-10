'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Capture referral code from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

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
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
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
                className="absolute right-4 top-[2.4rem] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
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
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Already have an account?{' '}
              <Link href="/auth/signin" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
