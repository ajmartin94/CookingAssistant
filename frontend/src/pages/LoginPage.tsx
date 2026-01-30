/**
 * Login Page
 *
 * User authentication and registration page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password, fullName);
      }
      navigate('/recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-card p-8 rounded-lg shadow-soft-md max-w-md w-full">
        <h2 className="text-3xl font-bold text-text-primary mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-error-subtle border border-error rounded-lg p-4 mb-6" role="alert">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-card text-text-primary"
              placeholder="your_username"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-card text-text-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-card text-text-primary"
                  placeholder="John Doe"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-card text-text-primary"
              placeholder="••••••••"
              required
              minLength={8}
            />
            {!isLogin && <p className="text-xs text-text-muted mt-1">Minimum 8 characters</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-text-primary py-2 rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-accent hover:text-accent-hover font-semibold"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
