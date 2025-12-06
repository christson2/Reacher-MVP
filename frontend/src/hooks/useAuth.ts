/**
 * useAuth Hook
 * Custom hook to use auth store
 */

import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const authStore = useAuthStore();
  return authStore;
};
