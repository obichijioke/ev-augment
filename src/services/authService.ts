// Authentication service for API communication
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  subscribeNewsletter?: boolean;
  terms_accepted?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      full_name: string;
      avatar_url?: string;
      is_verified: boolean;
      email_confirmed: boolean;
    };
    session?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      expires_in: number;
    };
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: {
    status: number;
    details?: any;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "user" | "moderator" | "admin";
  is_active: boolean;
  email_verified: boolean;
  email_verified_at?: string;
  password_changed_at?: string;
  last_login_at?: string;
  login_count: number;
  preferences: {
    theme?: "light" | "dark" | "auto";
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
      forum?: boolean;
      marketplace?: boolean;
      messages?: boolean;
    };
    privacy?: {
      show_email?: boolean;
      show_location?: boolean;
      show_phone?: boolean;
      show_real_name?: boolean;
      show_online_status?: boolean;
    };
    display?: {
      posts_per_page?: number;
      date_format?: string;
      time_format?: string;
      timezone?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: {
    profile: UserProfile;
  };
}

export interface UpdateProfileRequest {
  role?: "user" | "moderator" | "admin";
  preferences?: UserProfile["preferences"];
}

export interface UpdateUserRequest {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  is_business?: boolean;
  business_name?: string;
  business_type?: string;
}

class AuthService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });

      throw {
        success: false,
        message: data.error.message || "An error occurred",
        error: {
          status: response.status,
          details: data,
        },
      } as ApiError;
    }

    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        full_name: userData.fullName,
        terms_accepted: userData.terms_accepted || true,
      }),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
    });

    return this.handleResponse(response);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async getCurrentUser(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    return this.handleResponse(response);
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ token, password }),
    });

    return this.handleResponse(response);
  }

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    return this.handleResponse(response);
  }

  async resendVerification(
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getProfile(token: string): Promise<ProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  async updateProfile(
    token: string,
    profileData: UpdateProfileRequest
  ): Promise<ProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(profileData),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  async verifyEmail(token: string): Promise<ProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  async updateUser(
    token: string,
    userData: UpdateUserRequest
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/user-profile`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<AuthResponse>(response);
  }
}

export const authService = new AuthService();
export default authService;
