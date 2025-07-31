import express, { Router } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { validate, userSchemas, commonSchemas } from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  forbiddenError,
} from "../middleware/errorHandler";
import {
  authenticateToken,
  optionalAuth,
  requireOwnership,
} from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  User,
  UserProfile,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";

const router: Router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
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
        user: userProfile,
      },
    } as ApiResponse<{ user: User }>);
  })
);

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put(
  "/profile",
  authenticateToken,
  validate(userSchemas.updateProfile),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // Check if username is being changed and if it's available
    if (req.body.username) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", req.body.username)
        .neq("id", req.user!.id)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Username already taken",
        } as ApiResponse);
      }
    }

    // Update user profile
    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", req.user!.id)
      .select()
      .single();

    if (error) {
      throw notFoundError("User profile");
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    } as ApiResponse<{ user: User }>);
  })
);

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get(
  "/search",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      q: query = "",
      page = "1",
      limit = "20",
      sort = "username",
      order = "asc",
    } = req.query as Record<string, string>;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters long",
      } as ApiResponse);
    }

    let queryBuilder = supabaseAdmin
      .from("users")
      .select(
        "id, username, full_name, avatar_url, is_verified, is_business, business_name, join_date"
      )
      .or(
        `username.ilike.%${query}%, full_name.ilike.%${query}%, business_name.ilike.%${query}%`
      )
      .eq("is_active", true);

    // Apply sorting
    const validSorts = ["username", "full_name", "join_date"];
    const sortField = validSorts.includes(sort) ? sort : "username";
    const sortOrder = order === "desc" ? "desc" : "asc";

    queryBuilder = queryBuilder.order(sortField, {
      ascending: sortOrder === "asc",
    });

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1);

    const { data: users, error, count } = await queryBuilder;

    if (error) {
      throw new Error("Failed to search users");
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .or(
        `username.ilike.%${query}%, full_name.ilike.%${query}%, business_name.ilike.%${query}%`
      )
      .eq("is_active", true);

    const pagination = buildPaginationMetadata(
      pageNum,
      pageSize,
      totalCount || 0
    );

    res.json({
      success: true,
      data: users || [],
      pagination,
    } as PaginatedResponse<Partial<User>>);
  })
);

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get(
  "/:username",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;

    if (!username) {
      throw notFoundError("Username");
    }

    // Base user data
    let selectFields =
      "id, username, full_name, avatar_url, bio, location, website, is_verified, is_business, business_name, business_type, join_date";

    // Get current user's profile to check ownership
    let currentUserProfile = null;
    if (req.user) {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("username, role")
        .eq("id", req.user.id)
        .single();
      currentUserProfile = profile;
    }

    // Add private fields if user is viewing own profile or is admin
    const isOwnProfile =
      currentUserProfile && currentUserProfile.username === username;
    const isAdmin =
      currentUserProfile &&
      (currentUserProfile.role === "admin" ||
        currentUserProfile.role === "moderator");

    if (isOwnProfile || isAdmin) {
      selectFields +=
        ", email, phone, privacy_settings, notification_settings, last_active";
    }

    const { data: userProfile, error } = await supabaseAdmin
      .from("users")
      .select(selectFields)
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (error || !userProfile) {
      throw notFoundError("User");
    }

    // Type assertion to ensure userProfile is the correct type
    const user = userProfile as any;

    // Get user's vehicles count (public only unless own profile)
    const vehicleQuery = supabaseAdmin
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if (!isOwnProfile && !isAdmin) {
      vehicleQuery.eq("is_public", true);
    }

    const { count: vehicleCount } = await vehicleQuery;

    // Get user's forum posts count
    const { count: postCount } = await supabaseAdmin
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id);

    // Get user's marketplace listings count (active only)
    const { count: listingCount } = await supabaseAdmin
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .eq("is_active", true);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website,
          phone: user.phone,
          is_verified: user.is_verified,
          is_business: user.is_business,
          business_name: user.business_name,
          business_type: user.business_type,
          join_date: user.join_date,
          last_active: user.last_active,
          privacy_settings: user.privacy_settings,
          notification_settings: user.notification_settings,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
          stats: {
            vehicles: vehicleCount || 0,
            posts: postCount || 0,
            listings: listingCount || 0,
          },
        },
      },
    });
  })
);

// @route   GET /api/users/:username/vehicles
// @desc    Get user's vehicles
// @access  Public (filtered based on privacy)
router.get(
  "/:username/vehicles",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    // Get user ID from username
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      throw notFoundError("User");
    }

    const isOwnProfile = req.user && req.user.id === user.id;
    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "moderator");

    let vehicleQuery = supabaseAdmin
      .from("vehicles")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by privacy unless own profile or admin
    if (!isOwnProfile && !isAdmin) {
      vehicleQuery = vehicleQuery.eq("is_public", true);
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    vehicleQuery = vehicleQuery.range(offset, offset + pageSize - 1);

    const { data: vehicles, error } = await vehicleQuery;

    if (error) {
      throw new Error("Failed to fetch user vehicles");
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if (!isOwnProfile && !isAdmin) {
      countQuery = countQuery.eq("is_public", true);
    }

    const { count: totalCount } = await countQuery;

    const pagination = buildPaginationMetadata(
      pageNum,
      pageSize,
      totalCount || 0
    );

    res.json({
      success: true,
      data: vehicles || [],
      pagination,
    } as PaginatedResponse);
  })
);

// @route   GET /api/users/:username/posts
// @desc    Get user's forum posts
// @access  Public
router.get(
  "/:username/posts",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    // Get user ID from username
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      throw notFoundError("User");
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    const { data: posts, error } = await supabaseAdmin
      .from("forum_posts")
      .select(
        `
      *,
      category:forum_categories(name, slug, color),
      author:users(username, full_name, avatar_url, is_verified)
    `
      )
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error("Failed to fetch user posts");
    }

    // Get total count
    const { count: totalCount } = await supabaseAdmin
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id);

    const pagination = buildPaginationMetadata(
      pageNum,
      pageSize,
      totalCount || 0
    );

    res.json({
      success: true,
      data: posts || [],
      pagination,
    } as PaginatedResponse);
  })
);

// @route   POST /api/users/:username/follow
// @desc    Follow/unfollow a user
// @access  Private
router.post(
  "/:username/follow",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;

    // Get target user
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (userError || !targetUser) {
      throw notFoundError("User");
    }

    // Can't follow yourself
    if (targetUser.id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: "Cannot follow yourself",
      } as ApiResponse);
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from("user_follows")
      .select("id")
      .eq("follower_id", req.user!.id)
      .eq("following_id", targetUser.id)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error: unfollowError } = await supabaseAdmin
        .from("user_follows")
        .delete()
        .eq("follower_id", req.user!.id)
        .eq("following_id", targetUser.id);

      if (unfollowError) {
        throw new Error("Failed to unfollow user");
      }

      res.json({
        success: true,
        message: "User unfollowed successfully",
        data: { following: false },
      } as ApiResponse<{ following: boolean }>);
    } else {
      // Follow
      const { error: followError } = await supabaseAdmin
        .from("user_follows")
        .insert({
          follower_id: req.user!.id,
          following_id: targetUser.id,
        });

      if (followError) {
        throw new Error("Failed to follow user");
      }

      res.json({
        success: true,
        message: "User followed successfully",
        data: { following: true },
      } as ApiResponse<{ following: boolean }>);
    }
  })
);

// @route   GET /api/users/:username/followers
// @desc    Get user's followers
// @access  Public
router.get(
  "/:username/followers",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    // Get user ID from username
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      throw notFoundError("User");
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    const { data: followers, error } = await supabaseAdmin
      .from("user_follows")
      .select(
        `
      created_at,
      follower:users(id, username, full_name, avatar_url, is_verified)
    `
      )
      .eq("following_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error("Failed to fetch followers");
    }

    // Get total count
    const { count: totalCount } = await supabaseAdmin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const pagination = buildPaginationMetadata(
      pageNum,
      pageSize,
      totalCount || 0
    );

    res.json({
      success: true,
      data: followers || [],
      pagination,
    } as PaginatedResponse);
  })
);

// @route   GET /api/users/:username/following
// @desc    Get users that this user is following
// @access  Public
router.get(
  "/:username/following",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    // Get user ID from username
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      throw notFoundError("User");
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    const { data: following, error } = await supabaseAdmin
      .from("user_follows")
      .select(
        `
      created_at,
      following:users(id, username, full_name, avatar_url, is_verified)
    `
      )
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error("Failed to fetch following");
    }

    // Get total count
    const { count: totalCount } = await supabaseAdmin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id);

    const pagination = buildPaginationMetadata(
      pageNum,
      pageSize,
      totalCount || 0
    );

    res.json({
      success: true,
      data: following || [],
      pagination,
    } as PaginatedResponse);
  })
);

export default router;
