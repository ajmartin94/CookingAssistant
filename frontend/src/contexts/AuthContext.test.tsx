/**
 * Tests for AuthContext
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { useAuth } from './AuthContext';
import { ReactNode } from 'react';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Test component that uses the auth context
function TestComponent() {
  const { user, login, register, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  const handleLogin = async () => {
    try {
      await login('testuser', 'password');
    } catch (error) {
      // Error is expected in some tests, just log it
      console.log('Login failed:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await register('newuser', 'new@test.com', 'password');
    } catch (error) {
      // Error is expected in some tests, just log it
      console.log('Register failed:', error);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <div>Logged in as: {user.username}</div>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <div>Not logged in</div>
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide auth context', () => {
    render(<TestComponent />);

    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });

  it('should handle login successfully', async () => {
    const { user } = render(<TestComponent />);

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    });
  });

  it('should handle register successfully', async () => {
    const { user } = render(<TestComponent />);

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    localStorage.setItem('auth_token', 'mock-token');

    const { user } = render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });

  it('should load user from stored token on mount', async () => {
    localStorage.setItem('auth_token', 'mock-jwt-token');

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    });
  });

  it('should handle login error', async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/users/login`, () => {
        return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
      })
    );

    const { user } = render(<TestComponent />);

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    expect(() => {
      function BadComponent() {
        useAuth();
        return null;
      }
      render(<BadComponent />, {
        wrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
      });
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
