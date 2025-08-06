import express from "express";
import { supabase } from "../services/supabaseClient";
import { authenticateToken } from "../middleware/auth";
import {
  validate,
  forumSchemas,
  commonSchemas,
} from "../middleware/validation";
import { AuthenticatedRequest } from "../types";
import { createError, validationError } from "../middleware/errorHandler";

const router = express.Router();

// =====================================================
// PERMISSION CHECKING MIDDLEWARE
// =====================================================

// Middleware to check if user is admin or moderator
const requireModeratorRole = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
) => {
  try {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role, forum_role")
      .eq("id", req.user!.id)
      .single();

    if (
      !userProfile ||
      (!["admin", "moderator"].includes(userProfile.role) &&
        !["admin", "moderator"].includes(userProfile.forum_role))
    ) {
      return next(
        createError("Insufficient permissions - moderator role required", 403)
      );
    }

    next();
  } catch (error) {
    next(createError("Failed to verify permissions", 500));
  }
};

// Middleware to check if user is admin only
const requireAdminRole = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
) => {
  try {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role, forum_role")
      .eq("id", req.user!.id)
      .single();

    if (
      !userProfile ||
      (!["admin"].includes(userProfile.role) &&
        !["admin"].includes(userProfile.forum_role))
    ) {
      return next(
        createError("Insufficient permissions - admin role required", 403)
      );
    }

    next();
  } catch (error) {
    next(createError("Failed to verify permissions", 500));
  }
};

// =====================================================
// USER ROLE MANAGEMENT
// =====================================================

// GET /api/forum/moderation/users - Get all users with their roles (Admin only)
router.get(
  "/users",
  authenticateToken,
  requireAdminRole,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      let query = supabase
        .from("user_profiles")
        .select(
          "id, username, email, full_name, role, forum_role, forum_post_count, forum_reputation, created_at"
        )
        .order("created_at", { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(
          `username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`
        );
      }

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: users, error, count } = await query;

      if (error) {
        return next(createError("Failed to fetch users", 500));
      }

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / Number(limit)),
        },
        message: "Users retrieved successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// PUT /api/forum/moderation/users/:userId/role - Update user forum role (Admin only)
router.put(
  "/users/:userId/role",
  authenticateToken,
  requireAdminRole,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { userId } = req.params;
      const { forum_role } = req.body;

      // Validate forum role
      if (!["user", "moderator", "admin"].includes(forum_role)) {
        return next(
          validationError(
            "Invalid forum role. Must be 'user', 'moderator', or 'admin'"
          )
        );
      }

      // Check if user exists
      const { data: targetUser, error: fetchError } = await supabase
        .from("user_profiles")
        .select("id, username, forum_role")
        .eq("id", userId)
        .single();

      if (fetchError || !targetUser) {
        return next(createError("User not found", 404));
      }

      // Prevent self-demotion from admin
      if (userId === req.user!.id && forum_role !== "admin") {
        return next(createError("Cannot change your own admin role", 403));
      }

      // Update user role
      const { data: updatedUser, error } = await supabase
        .from("user_profiles")
        .update({ forum_role })
        .eq("id", userId)
        .select("id, username, email, full_name, role, forum_role")
        .single();

      if (error) {
        return next(createError("Failed to update user role", 500));
      }

      res.json({
        success: true,
        data: updatedUser,
        message: `User role updated to ${forum_role} successfully`,
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// =====================================================
// CONTENT MODERATION
// =====================================================

// GET /api/forum/moderation/reports - Get reported content (Moderator+)
router.get(
  "/reports",
  authenticateToken,
  requireModeratorRole,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // For now, return empty array as we haven't implemented reporting system yet
      // This would be expanded to include actual reports
      res.json({
        success: true,
        data: [],
        message: "Reports retrieved successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// POST /api/forum/moderation/threads/:threadId/action - Moderate thread (Moderator+)
router.post(
  "/threads/:threadId/action",
  authenticateToken,
  requireModeratorRole,
  validate(forumSchemas.moderateThread),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { threadId } = req.params;
      const { action, reason } = req.body;

      // Check if thread exists
      const { data: thread, error: fetchError } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (fetchError || !thread) {
        return next(createError("Thread not found", 404));
      }

      let updateData: any = {};
      let actionMessage = "";

      switch (action) {
        case "pin":
          updateData.is_pinned = true;
          actionMessage = "pinned";
          break;
        case "unpin":
          updateData.is_pinned = false;
          actionMessage = "unpinned";
          break;
        case "lock":
          updateData.is_locked = true;
          actionMessage = "locked";
          break;
        case "unlock":
          updateData.is_locked = false;
          actionMessage = "unlocked";
          break;
        case "delete":
          updateData.is_deleted = true;
          actionMessage = "deleted";
          break;
        case "restore":
          updateData.is_deleted = false;
          actionMessage = "restored";
          break;
        default:
          return next(validationError("Invalid moderation action"));
      }

      // Update thread
      const { data: updatedThread, error } = await supabase
        .from("forum_threads")
        .update(updateData)
        .eq("id", threadId)
        .select()
        .single();

      if (error) {
        return next(createError("Failed to moderate thread", 500));
      }

      // Log moderation action (you could expand this to store in a moderation_log table)
      console.log(
        `Moderation action: User ${req.user!.id} ${actionMessage} thread ${threadId}. Reason: ${reason || "No reason provided"}`
      );

      res.json({
        success: true,
        data: updatedThread,
        message: `Thread ${actionMessage} successfully`,
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// POST /api/forum/moderation/replies/:replyId/action - Moderate reply (Moderator+)
router.post(
  "/replies/:replyId/action",
  authenticateToken,
  requireModeratorRole,
  validate(forumSchemas.moderateReply),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { replyId } = req.params;
      const { action, reason } = req.body;

      // Check if reply exists
      const { data: reply, error: fetchError } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("id", replyId)
        .single();

      if (fetchError || !reply) {
        return next(createError("Reply not found", 404));
      }

      let updateData: any = {};
      let actionMessage = "";

      switch (action) {
        case "delete":
          updateData.is_deleted = true;
          actionMessage = "deleted";
          break;
        case "restore":
          updateData.is_deleted = false;
          actionMessage = "restored";
          break;
        default:
          return next(validationError("Invalid moderation action"));
      }

      // Update reply
      const { data: updatedReply, error } = await supabase
        .from("forum_replies")
        .update(updateData)
        .eq("id", replyId)
        .select()
        .single();

      if (error) {
        return next(createError("Failed to moderate reply", 500));
      }

      // Log moderation action
      console.log(
        `Moderation action: User ${req.user!.id} ${actionMessage} reply ${replyId}. Reason: ${reason || "No reason provided"}`
      );

      res.json({
        success: true,
        data: updatedReply,
        message: `Reply ${actionMessage} successfully`,
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// =====================================================
// FORUM STATISTICS (Moderator+)
// =====================================================

// GET /api/forum/moderation/stats - Get forum statistics (Moderator+)
router.get(
  "/stats",
  authenticateToken,
  requireModeratorRole,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // Get category stats
      const { data: categoryStats } = await supabase
        .from("forum_categories")
        .select("id, name, thread_count, post_count")
        .eq("is_active", true);

      // Get total counts
      const { count: totalThreads } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      const { count: totalReplies } = await supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentThreads } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false)
        .gte("created_at", sevenDaysAgo.toISOString());

      const { count: recentReplies } = await supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false)
        .gte("created_at", sevenDaysAgo.toISOString());

      res.json({
        success: true,
        data: {
          totals: {
            threads: totalThreads || 0,
            replies: totalReplies || 0,
            users: totalUsers || 0,
          },
          recent: {
            threads: recentThreads || 0,
            replies: recentReplies || 0,
          },
          categories: categoryStats || [],
        },
        message: "Forum statistics retrieved successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

export default router;
