/**
 * Auth Service API
 * Handles all authentication-related API calls to the backend
 * Routes through API Gateway at /api/auth/*
 */

import { apiClient } from '@/services/api/client';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  token: string;
}

export interface VerifyResponse {
  success: boolean;
  user: {
    userId: string;
    email: string;
  };
}

/**
 * Register a new user
 * @param data - Signup form data
 * @returns User and JWT token
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  try {
    // apiClient.baseURL already includes the `/api` prefix (gateway),
    // so call the auth path relative to that base ("/auth/...")
    const response = await apiClient.post('/auth/signup', data);

    // `apiClient.post` returns the response data directly
    if (response.token) {
      localStorage.setItem('token', response.token);
    }

    return response;
  } catch (error: any) {
    // Propagate backend error to caller. Do not return a development
    // fallback token — frontend should rely on the real auth service.
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'Signup failed'
    );
  }
}

/**
 * Login with email and password
 * @param data - Login form data
 * @returns User and JWT token
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/login', data);

    if (response.token) {
      localStorage.setItem('token', response.token);
    }

    return response;
  } catch (error: any) {
    // Propagate backend error to caller. No development fallback here.
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'Login failed'
    );
  }
}

/**
 * Verify JWT token validity
 * @returns Decoded token data
 */
export async function verifyToken(): Promise<VerifyResponse> {
  try {
    const response = await apiClient.post('/api/auth/verify');
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Token verification failed'
    );
  }
}

/**
 * Logout user (client-side only - clears token)
 */
export function logout(): void {
  localStorage.removeItem('token');
  // Optionally: notify backend about logout (blacklist token)
}
