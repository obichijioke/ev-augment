"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type UserRole = "user" | "moderator" | "admin";

export interface UserRoleData {
  role: UserRole;
  permissions: string[];
  isBanned: boolean;
  banExpiresAt: string | null;
}

export interface UseUserRoleReturn {
  role: UserRole | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
  isBanned: boolean;
  banExpiresAt: string | null;

  // Role checks
  isAdmin: boolean;
  isModerator: boolean;
  isModeratorOrAdmin: boolean;
  isRegularUser: boolean;

  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  // Actions
  refreshRole: () => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useUserRole = (): UseUserRoleReturn => {
  const { user, isAuthenticated, session } = useAuthStore();

  // State
  const [roleData, setRoleData] = useState<UserRoleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user role and permissions from backend
  const fetchUserRole = useCallback(async () => {
    if (!isAuthenticated || !user || !session?.accessToken) {
      setRoleData(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user profile with role information
      const response = await authService.getCurrentUser(session.accessToken);

      // Extract role from user profile or default to 'user'
      const userData = response.data.user;
      const role = (userData.role as UserRole) || "user";
      const permissions = userData.permissions || [];
      const isBanned = userData.is_banned || false;
      const banExpiresAt = userData.ban_expires_at || null;

      setRoleData({
        role,
        permissions,
        isBanned,
        banExpiresAt,
      });
    } catch (err) {
      console.error("Failed to fetch user role:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user permissions";
      setError(errorMessage);

      // Fallback to default role
      setRoleData({
        role: "user",
        permissions: [],
        isBanned: false,
        banExpiresAt: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, session?.accessToken]);

  // Refresh role data
  const refreshRole = useCallback(async () => {
    await fetchUserRole();
  }, [fetchUserRole]);

  // Load role data when user changes
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Permission checking functions
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!roleData) return false;
      return roleData.permissions.includes(permission);
    },
    [roleData]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!roleData) return false;
      return permissions.some((permission) =>
        roleData.permissions.includes(permission)
      );
    },
    [roleData]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!roleData) return false;
      return permissions.every((permission) =>
        roleData.permissions.includes(permission)
      );
    },
    [roleData]
  );

  // Role-based computed values
  const role = roleData?.role || null;
  const permissions = roleData?.permissions || [];
  const isBanned = roleData?.isBanned || false;
  const banExpiresAt = roleData?.banExpiresAt || null;

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isModeratorOrAdmin = role === "moderator" || role === "admin";
  const isRegularUser = role === "user";

  return {
    // Basic data
    role,
    permissions,
    isLoading,
    error,
    isBanned,
    banExpiresAt,

    // Role checks
    isAdmin,
    isModerator,
    isModeratorOrAdmin,
    isRegularUser,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Actions
    refreshRole,
  };
};

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to check if user has admin role
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useUserRole();
  return isAdmin;
};

/**
 * Hook to check if user has moderator role
 */
export const useIsModerator = (): boolean => {
  const { isModerator } = useUserRole();
  return isModerator;
};

/**
 * Hook to check if user has moderator or admin role
 */
export const useIsModeratorOrAdmin = (): boolean => {
  const { isModeratorOrAdmin } = useUserRole();
  return isModeratorOrAdmin;
};

/**
 * Hook to check if user is a regular user
 */
export const useIsRegularUser = (): boolean => {
  const { isRegularUser } = useUserRole();
  return isRegularUser;
};

/**
 * Hook to check if user is banned
 */
export const useIsBanned = (): boolean => {
  const { isBanned } = useUserRole();
  return isBanned;
};

export default useUserRole;
