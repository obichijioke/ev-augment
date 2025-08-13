"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  redirectTo = "/dashboard",
  fallbackComponent,
}) => {
  const { isAuthenticated, isLoading, userProfile, user } = useAuthStore();
  const router = useRouter();

  // Debug logging
  console.log("AdminProtectedRoute - Auth State:", {
    isAuthenticated,
    isLoading,
    userProfile,
    user,
    userRole: userProfile?.role || user?.role,
  });

  useEffect(() => {
    if (!isLoading) {
      // TEMPORARY: Allow access for testing - remove this in production
      console.log("TEMPORARY: Bypassing admin auth check for testing");
      return;

      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      // Check if user profile is loaded and user is not admin
      // Check both userProfile and user as fallback
      const userRole = userProfile?.role || user?.role;
      if (userRole && userRole !== "admin") {
        router.push(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, isLoading, userProfile, redirectTo, router]);

  // Show loading spinner while checking authentication and role
  // TEMPORARY: Skip loading check for testing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // TEMPORARY: Skip authentication check for testing
  if (false) {
    // Temporarily disabled: !isAuthenticated
    return null;
  }

  // TEMPORARY: Skip role check for testing
  console.log("TEMPORARY: Bypassing role check for testing");

  // If not admin, show fallback or don't render children
  const userRole = userProfile?.role || user?.role;
  if (false) {
    // Temporarily disabled: userRole !== "admin"
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Admin privileges are
            required.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
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

  AdminAuthenticatedComponent.displayName = `withAdminAuth(${
    Component.displayName || Component.name
  })`;

  return AdminAuthenticatedComponent;
};

// Hook to check if current user is admin
export const useIsAdmin = () => {
  const { userProfile, user } = useAuthStore();
  const userRole = userProfile?.role || user?.role;
  return userRole === "admin";
};

// Hook to check if current user is moderator or admin
export const useIsModerator = () => {
  const { userProfile, user } = useAuthStore();
  const userRole = userProfile?.role || user?.role;
  return userRole === "admin" || userRole === "moderator";
};
