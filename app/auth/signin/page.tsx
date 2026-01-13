'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!password) {
      alert('Please enter your password');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
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
          alert('Invalid email or password. Please check your credentials and try again.');
        } else if (result.error.includes('No account found')) {
          alert('No account found with this email. Please sign up first.');
        } else if (result.error.includes('Invalid password')) {
          alert('Invalid password. Please check your password and try again.');
        } else {
          alert(`Sign in failed: ${result.error}`);
        }
      } else if (result?.ok) {
        // Only redirect if there's no error AND ok is true
        router.push('/dashboard');
        router.refresh();
      } else {
        // Fallback for unexpected cases
        alert('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      // Handle all possible error types
      if (error instanceof Error) {
        if (error.message.includes('No account found')) {
          alert('No account found with this email. Please sign up first.');
        } else if (error.message.includes('Invalid password')) {
          alert('Invalid password. Please check your password and try again.');
        } else if (error.message.includes('Google')) {
          alert('This account was created with Google. Please sign in with Google.');
        } else if (error.message.includes('Email and password are required')) {
          alert('Please enter both email and password.');
        } else if (error.message.includes('CallbackRouteError')) {
          alert('No account found with this email. Please sign up first.');
        } else {
          alert(`Sign in failed: ${error.message}`);
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
              Sign in
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Write research that holds up.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              className="w-full py-4 text-sm font-semibold tracking-[0.24em]"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="underline underline-offset-4 hover:text-[hsl(var(--secondary))]">
                Sign up
              </Link>
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

