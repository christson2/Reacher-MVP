/**
 * Form Component (Molecule)
 * Wrapper for form controls
 */

import React from 'react';
import { Button } from '../atoms/Button';

interface FormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  submitLabel?: string;
  loading?: boolean;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  submitLabel = 'Submit',
  loading = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
};
