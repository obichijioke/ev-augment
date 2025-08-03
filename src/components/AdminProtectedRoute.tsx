'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard',
  fallbackComponent
}) => {
  const { isAuthenticated, isLoading, userProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      // Check if user profile is loaded and user is not admin
      if (userProfile && userProfile.role !== 'admin') {
        router.push(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, isLoading, userProfile, redirectTo, router]);

  // Show loading spinner while checking authentication and role
  if (isLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return null;
  }

  // If not admin, show fallback or don't render children
  if (userProfile.role !== 'admin') {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Admin privileges are required.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

// Higher-order component version
export const withAdminAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; fallbackComponent?: React.ReactNode }
) => {
  const AdminAuthenticatedComponent = (props: P) => {
    return (
      <AdminProtectedRoute {...options}>
        <Component {...props} />
      </AdminProtectedRoute>
    );
  };

  AdminAuthenticatedComponent.displayName = `withAdminAuth(${Component.displayName || Component.name})`;
  
  return AdminAuthenticatedComponent;
};

// Hook to check if current user is admin
export const useIsAdmin = () => {
  const { userProfile } = useAuthStore();
  return userProfile?.role === 'admin';
};

// Hook to check if current user is moderator or admin
export const useIsModerator = () => {
  const { userProfile } = useAuthStore();
  return userProfile?.role === 'admin' || userProfile?.role === 'moderator';
};
