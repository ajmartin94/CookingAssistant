/**
 * Authentication Context
 *
 * Manages user authentication state and provides auth functions
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authApi from '../services/authApi';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: { email?: string; full_name?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      localStorage.setItem('auth_token', response.access_token);

      // Fetch user data
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      const userData = await authApi.register({
        username,
        email,
        password,
        full_name: fullName,
      });

      // Auto-login after registration
      await login(username, password);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = async (data: { email?: string; full_name?: string; password?: string }) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Profile update failed. Please try again.');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
