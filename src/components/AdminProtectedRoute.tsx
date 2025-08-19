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
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const role = userProfile?.role ?? null;
    if (role !== "admin") {
      router.push(redirectTo);
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
  const { userProfile } = useAuthStore();
  return userProfile?.role === "admin";
};

// Hook to check if current user is moderator or admin
export const useIsModerator = () => {
  const { userProfile } = useAuthStore();
  const role = userProfile?.role;
  return role === "admin" || role === "moderator";
};
