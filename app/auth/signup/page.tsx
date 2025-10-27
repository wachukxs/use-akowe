'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

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
        }),
      });

      console.log('Sign up response:', response);

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
        console.log('Sign up error response:', response);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
              Akowe
            </h1>
            <p className="text-gray-600 mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
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

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
