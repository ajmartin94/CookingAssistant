/**
 * Authentication API Client
 *
 * API functions for user authentication and profile management
 */

import apiClient from './api';
import type { User } from '../types';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UpdateProfileData {
  email?: string;
  full_name?: string;
  password?: string;
}

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<User> => {
  const response = await apiClient.post('/api/v1/users/register', data);
  return response.data;
};

/**
 * Login with username and password
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  // OAuth2 expects form data
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);

  const response = await apiClient.post('/api/v1/users/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/api/v1/users/me');
  return response.data;
};

/**
 * Update current user profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await apiClient.put('/api/v1/users/me', data);
  return response.data;
};

/**
 * Logout (clear local token)
 */
export const logout = (): void => {
  localStorage.removeItem('auth_token');
};
