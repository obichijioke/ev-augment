import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  reputation: number;
  evOwner: boolean;
  evModels?: string[];
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    publicProfile: boolean;
    showEmail: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

type AuthStore = AuthState & AuthActions;

// Mock user data for demonstration
const mockUser: User = {
  id: '1',
  username: 'johndoe',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20friendly%20person%20smiling%2C%20clean%20background%2C%20high%20quality&image_size=square',
  bio: 'EV enthusiast and early adopter. Love sharing knowledge about electric vehicles and sustainable transportation.',
  location: 'San Francisco, CA',
  joinedDate: '2023-01-15',
  isVerified: true,
  reputation: 1250,
  evOwner: true,
  evModels: ['Tesla Model 3', 'Nissan Leaf'],
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    publicProfile: true,
    showEmail: false,
    theme: 'auto'
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock validation
          if (email === 'john@example.com' && password === 'password123') {
            set({ 
              user: mockUser, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error('Invalid email or password');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Create new user
          const newUser: User = {
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            joinedDate: new Date().toISOString(),
            isVerified: false,
            reputation: 0,
            evOwner: false,
            preferences: {
              emailNotifications: true,
              pushNotifications: true,
              publicProfile: true,
              showEmail: false,
              theme: 'auto'
            }
          };
          
          set({ 
            user: newUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
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
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

// Utility hooks
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);