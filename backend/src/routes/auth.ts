import express, { Router } from "express";
import { supabase, supabaseAdmin } from "../services/supabaseClient";
import { validate, userSchemas } from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  validationError,
  unauthorizedError,
  createError,
} from "../middleware/errorHandler";
import { authenticateToken } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { User, UserProfile, ApiResponse } from "../types/database";

const router: Router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  validate(userSchemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, username, full_name, terms_accepted } = req.body;

    // Check if username is already taken
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("username")
      .eq("username", username)
      .single();

    if (existingUser) {
      throw validationError("Username is already taken");
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Set to true to allow immediate login
        user_metadata: {
          username,
          full_name,
          terms_accepted,
          registration_date: new Date().toISOString(),
        },
      });

    if (authError) {
      throw createError(authError.message, 400, "REGISTRATION_FAILED");
    }

    // Create user profile in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        username,
        full_name,
        join_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw createError(
        "Failed to create user profile",
        500,
        "PROFILE_CREATION_FAILED"
      );
    }

    // Create user_profiles record with default settings
    const { data: userProfileData, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        username,
        email,
        role: "user", // Default role
        is_active: true,
        email_verified: false, // Will be updated when email is confirmed
        email_verified_at: null,
        password_changed_at: null,
        last_login_at: null,
        login_count: 0,
        preferences: {
          theme: "light",
          language: "en",
          notifications: {
            email: true,
            push: true,
            marketing: false,
          },
          privacy: {
            show_email: false,
            show_location: true,
            show_phone: false,
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup both auth user and users record if user_profiles creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("users").delete().eq("id", authData.user.id);
      throw createError(
        "Failed to create user profile settings",
        500,
        "USER_PROFILE_CREATION_FAILED"
      );
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          email_confirmed: false,
        },
      },
    } as ApiResponse<{ user: Partial<User> }>);
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  validate(userSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw unauthorizedError("Invalid email or password");
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      throw notFoundError("User profile");
    }

    // Update last active timestamp in users table
    await supabaseAdmin
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", data.user.id);

    // Update login tracking in user_profiles table
    const { data: currentProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("login_count")
      .eq("id", data.user.id)
      .single();

    await supabaseAdmin
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (currentProfile?.login_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          username: userProfile.username,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          is_verified: userProfile.is_verified,
          join_date: userProfile.join_date,
          email_confirmed: !!data.user.email_confirmed_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        },
      },
    } as ApiResponse<{ user: Partial<User>; session: any }>);
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  "/logout",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw createError("Logout failed", 500, "LOGOUT_FAILED");
    }

    res.json({
      success: true,
      message: "Logout successful",
    } as ApiResponse);
  })
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw validationError("Refresh token is required");
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      throw unauthorizedError("Invalid refresh token");
    }

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        },
      },
    } as ApiResponse<{ session: any }>);
  })
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  validate(userSchemas.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      throw createError(
        "Failed to send password reset email",
        500,
        "PASSWORD_RESET_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Password reset email sent successfully",
    } as ApiResponse);
  })
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  validate(userSchemas.resetPassword),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw unauthorizedError("Invalid or expired reset token");
    }

    res.json({
      success: true,
      message: "Password reset successfully",
    } as ApiResponse);
  })
);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });

    if (error) {
      throw unauthorizedError("Invalid or expired verification token");
    }

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed: true,
        },
      },
    } as ApiResponse<{ user: Partial<User> }>);
  })
);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post(
  "/resend-verification",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: req.user!.email,
    });

    if (error) {
      throw createError(
        "Failed to resend verification email",
        500,
        "VERIFICATION_RESEND_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Verification email sent successfully",
    } as ApiResponse);
  })
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Get user profile from database
    const { data: userProfile, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user!.id)
      .single();

    if (error) {
      throw notFoundError("User profile");
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          username: userProfile.username,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          bio: userProfile.bio,
          location: userProfile.location,
          website: userProfile.website,
          phone: userProfile.phone,
          is_verified: userProfile.is_verified,
          is_business: userProfile.is_business,
          business_name: userProfile.business_name,
          business_type: userProfile.business_type,
          join_date: userProfile.join_date,
          last_active: userProfile.last_active,
          privacy_settings: userProfile.privacy_settings,
          notification_settings: userProfile.notification_settings,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
          email_confirmed: !!req.user!.email_confirmed_at,
        },
      },
    } as ApiResponse<{ user: User }>);
  })
);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post(
  "/change-password",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw validationError("Current password and new password are required");
    }

    if (new_password.length < 8) {
      throw validationError("New password must be at least 8 characters long");
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user!.email,
      password: current_password,
    });

    if (verifyError) {
      throw unauthorizedError("Current password is incorrect");
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      throw createError(
        "Failed to update password",
        500,
        "PASSWORD_UPDATE_FAILED"
      );
    }

    // Update password change tracking in user_profiles
    await supabaseAdmin
      .from("user_profiles")
      .update({
        password_changed_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", (req.user as any).id);

    res.json({
      success: true,
      message: "Password changed successfully",
    } as ApiResponse);
  })
);

// @route   GET /api/auth/profile
// @desc    Get user profile settings
// @access  Private
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", (req.user as any).id)
      .single();

    if (error) {
      throw notFoundError("User profile");
    }

    res.json({
      success: true,
      data: {
        profile: userProfile,
      },
    } as ApiResponse<{ profile: UserProfile }>);
  })
);

// @route   PUT /api/auth/user-profile
// @desc    Update basic user information (users table)
// @access  Private
router.put(
  "/user-profile",
  authenticateToken,
  validate(userSchemas.updateProfile),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      username,
      full_name,
      bio,
      location,
      website,
      phone,
      is_business,
      business_name,
      business_type,
    } = req.body;

    const updateData: Partial<User> = {
      updated_at: new Date(),
    };

    // Add fields if they are provided
    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (is_business !== undefined) updateData.is_business = is_business;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (business_type !== undefined) updateData.business_type = business_type;

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", (req.user as any).id)
      .select()
      .single();

    if (error) {
      throw createError(
        "Failed to update user profile",
        500,
        "PROFILE_UPDATE_FAILED"
      );
    }

    res.json({
      success: true,
      message: "User profile updated successfully",
      data: {
        user: updatedUser,
      },
    } as ApiResponse<{ user: User }>);
  })
);

// @route   PUT /api/auth/profile
// @desc    Update user profile settings
// @access  Private
router.put(
  "/profile",
  authenticateToken,
  validate(userSchemas.updateUserProfile),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { role, preferences } = req.body;

    // Validate that non-admin users can't change their role
    if (role && role !== "user") {
      const { data: currentProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role")
        .eq("id", (req.user as any).id)
        .single();

      if (currentProfile?.role !== "admin") {
        throw unauthorizedError("Only admins can change user roles");
      }
    }

    const updateData: Partial<UserProfile> = {
      updated_at: new Date(),
    };

    if (preferences) {
      updateData.preferences = preferences;
    }

    // Only allow role updates for admins
    if (role && role !== "user") {
      updateData.role = role as "user" | "moderator" | "admin";
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .update(updateData)
      .eq("id", (req.user as any).id)
      .select("*")
      .single();

    if (error) {
      throw createError("Failed to update profile", 500);
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: updatedProfile,
      },
    } as ApiResponse<{ profile: UserProfile }>);
  })
);

// @route   POST /api/auth/verify-email
// @desc    Mark email as verified (internal use)
// @access  Private
router.post(
  "/verify-email",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { data: updatedProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        email_verified: true,
        email_verified_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", (req.user as any).id)
      .select("*")
      .single();

    if (error) {
      throw createError("Failed to verify email", 500);
    }

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        profile: updatedProfile,
      },
    } as ApiResponse<{ profile: UserProfile }>);
  })
);

export default router;
