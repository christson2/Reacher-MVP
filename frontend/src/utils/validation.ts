/**
 * Utility: Validation
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateRequired = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'This field is required';
  }
  return null;
};
