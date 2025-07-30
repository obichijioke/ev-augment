import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthResponse, ApiError } from '@/services/authService';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
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
    theme: 'light' | 'dark' | 'auto';
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
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  const [firstName, ...lastNameParts] = (apiUser.full_name || '').split(' ');
  const lastName = lastNameParts.join(' ');
  
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    firstName: firstName || '',
    lastName: lastName || '',
    avatar: apiUser.avatar_url,
    bio: apiUser.bio,
    location: apiUser.location,
    joinedDate: apiUser.join_date,
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
      theme: 'auto'
    }
  };
};

// Helper function to transform API session data
const transformApiSession = (apiSession: any): AuthSession => ({
  accessToken: apiSession.access_token,
  refreshToken: apiSession.refresh_token,
  expiresAt: apiSession.expires_at,
  expiresIn: apiSession.expires_in
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

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ email, password });
          const user = transformApiUser(response.data.user);
          const session = response.data.session ? transformApiSession(response.data.session) : null;
          
          set({ 
            user, 
            session,
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            error: apiError.message || 'Login failed', 
            isLoading: false 
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
            isLoading: false 
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            error: apiError.message || 'Registration failed', 
            isLoading: false 
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
          console.error('Logout API call failed:', error);
        } finally {
          set({ 
            user: null, 
            session: null,
            isAuthenticated: false, 
            error: null 
          });
        }
      },

      refreshToken: async () => {
        const { session } = get();
        
        if (!session?.refreshToken) {
          const error = new Error('No refresh token available') as ApiError;
          error.statusCode = 401;
          throw error;
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
            error: 'Session expired. Please login again.' 
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const { session } = get();
        
        if (!session?.accessToken) {
          const error = new Error('No access token available') as ApiError;
          error.statusCode = 401;
          throw error;
        }
        
        try {
          const response = await authService.getCurrentUser(session.accessToken);
          const user = transformApiUser(response.data.user);
          
          set({ user });
        } catch (error) {
          const apiError = error as ApiError;
          set({ error: apiError.message || 'Failed to get user profile' });
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
            error: apiError.message || 'Failed to send password reset email', 
            isLoading: false 
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
            error: apiError.message || 'Failed to reset password', 
            isLoading: false 
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { session } = get();
        
        if (!session?.accessToken) {
          const error = new Error('No access token available') as ApiError;
          error.statusCode = 401;
          throw error;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await authService.changePassword(session.accessToken, currentPassword, newPassword);
          set({ isLoading: false });
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            error: apiError.message || 'Failed to change password', 
            isLoading: false 
          });
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...userData } 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

// Utility hooks
export const useUser = () => useAuthStore(state => state.user);
export const useSession = () => useAuthStore(state => state.session);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);

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