/**
 * useAuthForm Hook
 * Handles form state, validation, and submission for auth pages
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { validateEmail, validatePassword, validateRequired } from '@/utils/validation';

export interface UseAuthFormOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function useAuthForm(options?: UseAuthFormOptions) {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const validateForm = useCallback(
    (values: Record<string, string>, type: 'signup' | 'login') => {
      const errors: Record<string, string> = {};

      // Email validation
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(values.email)) {
        errors.email = 'Invalid email format';
      }

      // Password validation
      if (!values.password) {
        errors.password = 'Password is required';
      } else if (!validatePassword(values.password)) {
        errors.password = 'Password must be at least 6 characters';
      }

      // Signup-specific validation
      if (type === 'signup') {
        if (!values.name) {
          errors.name = 'Name is required';
        } else if (!validateRequired(values.name)) {
          errors.name = 'Name cannot be empty';
        }

        // Confirm password validation
        if (!values.confirmPassword) {
          errors.confirmPassword = 'Please confirm password';
        } else if (values.password !== values.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }

        // Phone validation (optional)
        if (values.phone && values.phone.length > 0) {
          // Simple check: at least 10 digits
          const digits = values.phone.replace(/\D/g, '');
          if (digits.length < 10) {
            errors.phone = 'Invalid phone number';
          }
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    },
    []
  );

  const handleSubmit = useCallback(
    async (
      values: Record<string, string>,
      type: 'signup' | 'login',
      onSubmit: (values: Record<string, string>) => Promise<any>
    ) => {
      clearError();
      clearFormErrors();

      // Validate form
      if (!validateForm(values, type)) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await onSubmit(values);

        // Store user data
        if (response.user) {
          setUser(response.user, response.token);
        }

        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess();
        }

        // Redirect if specified (default to landing)
        const redirectPath = options?.redirectTo || '/';
        router.push(redirectPath);
      } catch (err: any) {
        setError(err.message || 'An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, clearError, clearFormErrors, setUser, options, router]
  );

  return {
    isLoading,
    error,
    formErrors,
    clearError,
    clearFormErrors,
    validateForm,
    handleSubmit,
  };
}
