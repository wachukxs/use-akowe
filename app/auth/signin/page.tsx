'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    console.log('Sign in button clicked!', { email });
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Sign in result:', result);

      // Check for errors FIRST - this is the key fix
      if (result?.error) {
        // Handle specific error cases without console.error for cleaner UX
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
        console.log('Sign in successful, redirecting...');
        router.push('/dashboard');
        router.refresh();
      } else {
        // Fallback for unexpected cases
        console.error('Unexpected sign in result:', result);
        alert('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Akowe
            </h1>
            <p className="text-gray-600 mt-2">Write research that holds up.</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
                Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

