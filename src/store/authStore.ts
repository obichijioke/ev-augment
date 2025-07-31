import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  authService,
  AuthResponse,
  ApiError,
  UserProfile,
  UpdateProfileRequest,
  UpdateUserRequest,
} from "@/services/authService";

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  is_business?: boolean;
  business_name?: string;
  business_type?: string;
  joinedDate: string;
  isVerified: boolean;
  emailConfirmed: boolean;
  reputation?: number;
  evOwner?: boolean;
  evModels?: string[];
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    publicProfile: boolean;
    showEmail: boolean;
    theme: "light" | "dark" | "auto";
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
}

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateUserInfo: (userData: UpdateUserRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  getProfile: () => Promise<UserProfile>;
  updateProfile: (profileData: UpdateProfileRequest) => Promise<void>;
  verifyEmail: () => Promise<void>;
}

export interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  subscribeNewsletter?: boolean;
  termsAccepted?: boolean;
}

type AuthStore = AuthState & AuthActions;

// Helper function to transform API user data to frontend User interface
const transformApiUser = (apiUser: any): User => {
  const [firstName, ...lastNameParts] = (apiUser.full_name || "").split(" ");
  const lastName = lastNameParts.join(" ");

  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    firstName: firstName || "",
    lastName: lastName || "",
    avatar: apiUser.avatar_url,
    bio: apiUser.bio,
    location: apiUser.location,
    website: apiUser.website,
    phone: apiUser.phone,
    is_business: apiUser.is_business || false,
    business_name: apiUser.business_name,
    business_type: apiUser.business_type,
    joinedDate: apiUser.join_date
      ? apiUser.join_date instanceof Date
        ? apiUser.join_date.toISOString()
        : apiUser.join_date
      : new Date().toISOString(),
    isVerified: apiUser.is_verified,
    emailConfirmed: apiUser.email_confirmed,
    reputation: 0, // Default values for optional fields
    evOwner: false,
    evModels: [],
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      publicProfile: true,
      showEmail: false,
      theme: "auto",
    },
  };
};

// Helper function to transform API session data
const transformApiSession = (apiSession: any): AuthSession => ({
  accessToken: apiSession.access_token,
  refreshToken: apiSession.refresh_token,
  expiresAt: apiSession.expires_at,
  expiresIn: apiSession.expires_in,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      userProfile: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.login({ email, password });
          const user = transformApiUser(response.data.user);
          const session = response.data.session
            ? transformApiSession(response.data.session)
            : null;

          set({
            user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.register(userData);
          const user = transformApiUser(response.data.user);

          // Registration successful but user needs to verify email
          set({
            user,
            session: null, // No session until email is verified
            isAuthenticated: false, // Not authenticated until email verified
            isLoading: false,
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        const { session } = get();

        try {
          if (session?.accessToken) {
            await authService.logout(session.accessToken);
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.error("Logout API call failed:", error);
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
            userProfile: null,
          });
        }
      },

      refreshToken: async () => {
        const { session } = get();

        if (!session?.refreshToken) {
          throw {
            success: false,
            message: "No refresh token available",
            error: { status: 401 },
          } as ApiError;
        }

        try {
          const response = await authService.refreshToken(session.refreshToken);
          const newSession = transformApiSession(response.data.session);

          set({ session: newSession });
        } catch (error) {
          // If refresh fails, logout user
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: "Session expired. Please login again.",
            userProfile: null,
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        try {
          const response = await authService.getCurrentUser(
            session.accessToken
          );
          const user = transformApiUser(response.data.user);

          set({ user });
        } catch (error) {
          const apiError = error as ApiError;
          set({ error: apiError.message || "Failed to get user profile" });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await authService.forgotPassword(email);
          set({ isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to send password reset email",
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          await authService.resetPassword(token, password);
          set({ isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to reset password",
            isLoading: false,
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          await authService.changePassword(
            session.accessToken,
            currentPassword,
            newPassword
          );
          set({ isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to change password",
            isLoading: false,
          });
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      updateUserInfo: async (userData: UpdateUserRequest) => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.updateUser(
            session.accessToken,
            userData
          );
          const updatedUser = transformApiUser(response.data.user);

          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to update user information",
            isLoading: false,
          });
          throw error;
        }
      },

      uploadAvatar: async (file: File) => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
          throw {
            success: false,
            message: "Please select a JPEG, PNG, or WebP image",
            error: { status: 400 },
          } as ApiError;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
          throw {
            success: false,
            message: "Avatar file size must be less than 2MB",
            error: { status: 400 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.uploadAvatar(
            session.accessToken,
            file
          );
          const updatedUser = transformApiUser(response.data.user);

          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to upload avatar",
            isLoading: false,
          });
          throw error;
        }
      },

      removeAvatar: async () => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.removeAvatar(session.accessToken);
          const updatedUser = transformApiUser(response.data.user);

          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to remove avatar",
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      getProfile: async (): Promise<UserProfile> => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        try {
          const response = await authService.getProfile(session.accessToken);
          const userProfile = response.data.profile;

          set({ userProfile });
          return userProfile;
        } catch (error) {
          const apiError = error as ApiError;
          set({ error: apiError.message || "Failed to get user profile" });
          throw error;
        }
      },

      updateProfile: async (profileData: UpdateProfileRequest) => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.updateProfile(
            session.accessToken,
            profileData
          );
          const updatedProfile = response.data.profile;

          set({ userProfile: updatedProfile, isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to update profile",
            isLoading: false,
          });
          throw error;
        }
      },

      verifyEmail: async () => {
        const { session } = get();

        if (!session?.accessToken) {
          throw {
            success: false,
            message: "No access token available",
            error: { status: 401 },
          } as ApiError;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.verifyEmail(session.accessToken);
          const updatedProfile = response.data.profile;

          set({ userProfile: updatedProfile, isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || "Failed to verify email",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        userProfile: state.userProfile,
      }),
    }
  )
);

// Utility hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserProfile = () => useAuthStore((state) => state.userProfile);

// Helper hook to check if token is expired
export const useIsTokenExpired = () => {
  const session = useSession();
  if (!session) return true;
  return Date.now() >= session.expiresAt * 1000;
};

// Helper hook to get access token
export const useAccessToken = () => {
  const session = useSession();
  return session?.accessToken;
};
