"use client";

import React, { useEffect, useCallback } from "react";
import { useAuthStore, useIsTokenExpired, useSession } from "@/store/authStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { refreshToken, logout, getCurrentUser, isAuthenticated } =
    useAuthStore();
  const session = useSession();
  const isTokenExpired = useIsTokenExpired();

  // Auto-refresh token when it's about to expire
  const handleTokenRefresh = useCallback(async () => {
    if (!session || !isAuthenticated) return;

    // Check if token expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    const tokenExpiresAt = session.expiresAt * 1000;

    if (tokenExpiresAt <= fiveMinutesFromNow) {
      try {
        await refreshToken();
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // Token refresh failed, logout user
        await logout();
      }
    }
  }, [session, isAuthenticated, refreshToken, logout]);

  // Initialize user data on app start; refresh if token is expired
  const initializeAuth = useCallback(async () => {
    if (!isAuthenticated || !session?.accessToken) return;

    try {
      if (isTokenExpired) {
        try {
          await refreshToken();
        } catch (e) {
          console.error("Failed to refresh token on init:", e);
          await logout();
          return;
        }
      }

      await getCurrentUser();
    } catch (error) {
      console.error("Failed to get current user:", error);
      await logout();
    }
  }, [
    isAuthenticated,
    session,
    isTokenExpired,
    refreshToken,
    getCurrentUser,
    logout,
  ]);

  // Run initialization on mount
  useEffect(() => {
    initializeAuth();
    // Attempt proactive refresh immediately on mount if needed
    handleTokenRefresh();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    // Check token every minute
    const interval = setInterval(handleTokenRefresh, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, session, handleTokenRefresh]);

  // Handle page visibility change to refresh token when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        handleTokenRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated, handleTokenRefresh]);

  return <>{children}</>;
};

export default AuthProvider;
