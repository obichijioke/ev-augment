'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useBlogPermissions } from '../../hooks/useBlogPermissions';
import { AlertCircle, Lock, ArrowLeft } from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AccessControlProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'user' | 'moderator' | 'admin';
  requirePermission?: string;
  requireBlogCreate?: boolean;
  requireBlogEdit?: boolean;
  requireDraftAccess?: boolean;
  postAuthorId?: string; // For checking blog post ownership
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AccessControl: React.FC<AccessControlProps> = ({
  children,
  requireAuth = false,
  requireRole,
  requirePermission,
  requireBlogCreate = false,
  requireBlogEdit = false,
  requireDraftAccess = false,
  postAuthorId,
  fallback,
  redirectTo,
  showError = true,
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    canCreateBlog,
    canAccessBlogEdit,
    canAccessDraftManagement,
    userRole,
    userId,
    isLoading,
  } = useBlogPermissions();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Check role requirement
  if (requireRole && userRole !== requireRole) {
    // Allow higher roles to access lower role requirements
    const roleHierarchy = { user: 1, moderator: 2, admin: 3 };
    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requireRole];

    if (userRoleLevel < requiredRoleLevel) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }

      if (fallback) {
        return <>{fallback}</>;
      }

      if (showError) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have the required permissions to access this page.
                {requireRole && ` Required role: ${requireRole}`}
              </p>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        );
      }

      return null;
    }
  }

  // Check blog creation permission
  if (requireBlogCreate && !canCreateBlog) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Blog Creation Restricted</h2>
            <p className="text-gray-600 mb-6">
              Only moderators and administrators can create new blog posts.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => router.push('/blog')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Blog
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Check blog edit permission
  if (requireBlogEdit && !canAccessBlogEdit(undefined, postAuthorId)) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Edit Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You can only edit your own blog posts, unless you're a moderator or administrator.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => router.push('/blog')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Blog
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Check draft access permission
  if (requireDraftAccess && !canAccessDraftManagement) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Draft Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              You don't have access to the draft management system.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => router.push('/blog')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Blog
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default AccessControl;
