'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/molecules/Card';
import Form from '@/components/molecules/Form';
import { useAuthForm } from '../components/useAuthForm';
import { signup } from '../services/auth-api';

export default function SignupPage() {
  const router = useRouter();
  const { isLoading, error, formErrors, clearError, handleSubmit } = useAuthForm({
    redirectTo: '/',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError();
  };

  const onSubmit = async (values: Record<string, string>) => {
    return signup({
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(formData, 'signup', onSubmit);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Reacher</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Name Field */}
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={formErrors.name}
            required
            disabled={isLoading}
          />

          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={formErrors.email}
            required
            disabled={isLoading}
          />

          {/* Phone Field (Optional) */}
          <Input
            label="Phone Number (Optional)"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            error={formErrors.phone}
            disabled={isLoading}
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={formErrors.password}
            required
            disabled={isLoading}
          />

          {/* Confirm Password Field */}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={formErrors.confirmPassword}
            required
            disabled={isLoading}
          />

          {/* Terms & Conditions */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Signup (Placeholder) */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={isLoading}
            className="w-full"
          >
            Sign up with Google
          </Button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </div>
      </Card>
    </div>
  );
}
