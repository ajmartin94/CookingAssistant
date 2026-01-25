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

interface UpdatePreferencesData {
  dietaryRestrictions: string[];
  skillLevel: string;
  defaultServings: number;
}

interface BackendUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  dietary_restrictions: string[] | null;
  skill_level: string | null;
  default_servings: number | null;
  created_at: string;
  updated_at: string;
}

const transformUser = (backend: BackendUser): User => ({
  id: backend.id,
  username: backend.username,
  email: backend.email,
  fullName: backend.full_name,
  dietaryRestrictions: backend.dietary_restrictions || [],
  skillLevel: backend.skill_level || 'beginner',
  defaultServings: backend.default_servings || 4,
  createdAt: backend.created_at,
  updatedAt: backend.updated_at,
});

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
  const response = await apiClient.get<BackendUser>('/api/v1/users/me');
  return transformUser(response.data);
};

/**
 * Update current user profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await apiClient.put('/api/v1/users/me', data);
  return response.data;
};

/**
 * Update current user preferences
 */
export const updatePreferences = async (data: UpdatePreferencesData): Promise<User> => {
  const response = await apiClient.patch<BackendUser>('/api/v1/users/me/preferences', {
    dietary_restrictions: data.dietaryRestrictions,
    skill_level: data.skillLevel,
    default_servings: data.defaultServings,
  });
  return transformUser(response.data);
};

/**
 * Logout (clear local token)
 */
export const logout = (): void => {
  localStorage.removeItem('auth_token');
};
