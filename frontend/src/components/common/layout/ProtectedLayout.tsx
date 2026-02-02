/**
 * ProtectedLayout Component
 *
 * Wraps MainLayout with authentication check.
 * Redirects to login if not authenticated.
 */

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { Loader2 } from 'lucide-react';

export function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export default ProtectedLayout;
