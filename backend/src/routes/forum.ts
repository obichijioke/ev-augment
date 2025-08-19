import express from "express";
import { supabase, supabaseAdmin } from "../services/supabaseClient";
import { authenticateToken } from "../middleware/auth";
import {
  validate,
  forumSchemas,
  commonSchemas,
} from "../middleware/validation";
import { AuthenticatedRequest } from "../types";
import { reqIsModerator, reqIsOwner } from "../utils/roleUtils";
import {
  asyncHandler,
  createError,
  validationError,
} from "../middleware/errorHandler";

const router = express.Router();

// =====================================================
// CATEGORIES ENDPOINTS
// =====================================================

// GET /api/forum/categories - Get all categories
router.get("/categories", async (req, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from("forum_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return next(createError("Failed to fetch categories", 500));
    }

    res.json({
      success: true,
      data: categories,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    next(createError("Internal server error", 500));
  }
});

// POST /api/forum/categories - Create new category (Admin only)
router.post(
  "/categories",
  authenticateToken,
  validate(forumSchemas.createCategory),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // Check if user is admin/moderator
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, forum_role")
        .eq("id", req.user!.id)
        .single();

      if (
        !userProfile ||
        (!["admin", "moderator"].includes(userProfile.role) &&
          !["admin", "moderator"].includes(userProfile.forum_role))
      ) {
        return next(createError("Insufficient permissions", 403));
      }

      const { data: category, error } = await supabaseAdmin
        .from("forum_categories")
        .insert([req.body])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return next(validationError("Category name or slug already exists"));
        }
        return next(createError("Failed to create category", 500));
      }

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// PUT /api/forum/categories/:id - Update category (Admin only)
router.put(
  "/categories/:id",
  (req, res, next) => {
    console.log("🚀 PUT /categories/:id route matched! ID:", req.params.id);
    next();
  },
  authenticateToken,
  validate(forumSchemas.updateCategory),
  async (req: AuthenticatedRequest, res, next) => {
    console.log("🚀 PUT /categories/:id endpoint reached!");
    try {
      const { id } = req.params;

      // Check if user is admin/moderator
      console.log("🔍 Checking permissions for user:", req.user!.id);
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .select("role, forum_role")
        .eq("id", req.user!.id)
        .single();

      console.log("👤 User profile:", userProfile);
      console.log("❌ Profile error:", profileError);

      if (
        !userProfile ||
        (!["admin", "moderator"].includes(userProfile.role) &&
          !["admin", "moderator"].includes(userProfile.forum_role))
      ) {
        console.log("🚫 Authorization failed - insufficient permissions");
        return next(createError("Insufficient permissions", 403));
      }

      console.log("✅ Authorization passed");

      // Check if category exists
      const { data: existingCategory, error: fetchError } = await supabaseAdmin
        .from("forum_categories")
        .select("id")
        .eq("id", id)
        .single();

      if (fetchError || !existingCategory) {
        return next(createError("Category not found", 404));
      }

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Update data:", updateData);

      const { data: category, error } = await supabaseAdmin
        .from("forum_categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      console.log("📊 Update result - Category:", category);
      console.log("❌ Update error:", error);

      if (error) {
        console.log("💥 Update failed with error:", error);
        if (error.code === "23505") {
          return next(validationError("Category name or slug already exists"));
        }
        return next(createError("Failed to update category", 500));
      }

      res.json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// DELETE /api/forum/categories/:id - Delete category (Admin only)
router.delete(
  "/categories/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const { force } = req.query;

      // Check if user is admin/moderator
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, forum_role")
        .eq("id", req.user!.id)
        .single();

      if (
        !userProfile ||
        (!["admin", "moderator"].includes(userProfile.role) &&
          !["admin", "moderator"].includes(userProfile.forum_role))
      ) {
        return next(createError("Insufficient permissions", 403));
      }

      // Check if category exists
      const { data: existingCategory, error: fetchError } = await supabaseAdmin
        .from("forum_categories")
        .select("id, thread_count")
        .eq("id", id)
        .single();

      if (fetchError || !existingCategory) {
        return next(createError("Category not found", 404));
      }

      // Check if category has threads (unless force delete)
      if (existingCategory.thread_count > 0 && force !== "true") {
        return next(
          createError(
            "Cannot delete category with existing threads. Use force=true to override.",
            400
          )
        );
      }

      // If force delete, first delete all threads in this category
      if (force === "true" && existingCategory.thread_count > 0) {
        // Get all threads in this category
        const { data: threads } = await supabaseAdmin
          .from("forum_threads")
          .select("id")
          .eq("category_id", id);

        if (threads && threads.length > 0) {
          const threadIds = threads.map((t) => t.id);

          // Delete all replies in these threads
          await supabaseAdmin
            .from("forum_replies")
            .delete()
            .in("thread_id", threadIds);

          // Delete all threads in this category
          await supabaseAdmin
            .from("forum_threads")
            .delete()
            .eq("category_id", id);
        }
      }

      const { error } = await supabaseAdmin
        .from("forum_categories")
        .delete()
        .eq("id", id);

      if (error) {
        return next(createError("Failed to delete category", 500));
      }

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// =====================================================
// THREADS ENDPOINTS
// =====================================================

// GET /api/forum/threads - Get threads with filters
router.get(
  "/threads",
  validate(forumSchemas.searchThreads, "query"),
  async (req, res, next) => {
    try {
      const {
        q,
        category_id,
        author_id,
        sort = "newest",
        page = 1,
        limit = 20,
      } = req.query;

      let query = supabaseAdmin
        .from("forum_thread_list")
        .select("*", { count: "exact" });

      // Apply filters
      if (category_id) {
        query = query.eq("category_id", category_id);
      }
      if (author_id) {
        query = query.eq("author_id", author_id);
      }
      if (q) {
        query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
      }

      // Apply sorting
      switch (sort) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most_replies":
          query = query.order("reply_count", { ascending: false });
          break;
        case "most_views":
          query = query.order("view_count", { ascending: false });
          break;
        default: // newest
          query = query.order("created_at", { ascending: false });
      }

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: threads, error, count } = await query;

      if (error) {
        return next(createError("Failed to fetch threads", 500));
      }

      // Transform the data to match frontend expectations
      const transformedThreads =
        threads?.map((thread) => ({
          ...thread,
          author: {
            id: thread.author_id,
            username: thread.author_username,
            displayName: thread.author_name || thread.author_username,
            avatar: thread.author_avatar,
          },
          category: {
            id: thread.category_id,
            name: thread.category_name,
            slug: thread.category_slug,
            icon: thread.category_icon,
            color: thread.category_color,
          },
        })) || [];

      res.json({
        success: true,
        data: transformedThreads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / Number(limit)),
        },
        message: "Threads retrieved successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// GET /api/forum/threads/:id - Get single thread with replies
router.get("/threads/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get thread details
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("forum_thread_list")
      .select("*")
      .eq("id", id)
      .single();

    if (threadError || !thread) {
      return next(createError("Thread not found", 404));
    }

    // Get thread replies
    const { data: replies, error: repliesError } = await supabaseAdmin
      .from("forum_replies")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (repliesError) {
      return next(createError("Failed to fetch replies", 500));
    }

    // Get thread images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from("forum_images")
      .select("*")
      .eq("thread_id", id)
      .is("reply_id", null);

    if (imagesError) {
      return next(createError("Failed to fetch images", 500));
    }

    // Get reply images
    const replyIds = replies?.map((r) => r.id) || [];
    let replyImages: any[] = [];

    if (replyIds.length > 0) {
      const { data: replyImagesData, error: replyImagesError } =
        await supabaseAdmin
          .from("forum_images")
          .select("*")
          .in("reply_id", replyIds);

      if (replyImagesError) {
        return next(createError("Failed to fetch reply images", 500));
      }

      replyImages = replyImagesData || [];
    }

    // Increment view count
    await supabaseAdmin
      .from("forum_threads")
      .update({ view_count: thread.view_count + 1 })
      .eq("id", id);

    // Get author information for replies
    const authorIds = [
      ...new Set(replies?.map((r) => r.author_id).filter(Boolean)),
    ];
    let authors: any[] = [];

    if (authorIds.length > 0) {
      const { data: authorsData } = await supabaseAdmin
        .from("users")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds);
      authors = authorsData || [];
    }

    // Organize replies into nested structure with author data and images
    const organizedReplies = organizeRepliesWithAuthors(
      replies || [],
      authors,
      replyImages
    );

    // Transform the data to match frontend expectations
    const transformedThread = {
      ...thread,
      author: {
        id: thread.author_id,
        username: thread.author_username,
        displayName: thread.author_name || thread.author_username,
        avatar: thread.author_avatar,
      },
      category: {
        id: thread.category_id,
        name: thread.category_name,
        slug: thread.category_slug,
        icon: thread.category_icon,
        color: thread.category_color,
      },
      images: images || [],
      replies: organizedReplies,
    };

    res.json({
      success: true,
      data: transformedThread,
      message: "Thread retrieved successfully",
    });
  } catch (error) {
    next(createError("Internal server error", 500));
  }
});

// POST /api/forum/threads - Create new thread
router.post(
  "/threads",
  authenticateToken,
  validate(forumSchemas.createThread),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { category_id, title, content, images } = req.body;

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const threadData = {
        category_id,
        author_id: req.user!.id,
        title,
        content,
        slug,
      };

      const { data: thread, error } = await supabaseAdmin
        .from("forum_threads")
        .insert([threadData])
        .select()
        .single();

      if (error) {
        console.error("Database error creating thread:", error);
        if (error.code === "23505") {
          return next(
            validationError(
              "Thread with this title already exists in this category"
            )
          );
        }
        return next(
          createError(`Failed to create thread: ${error.message}`, 500)
        );
      }

      res.status(201).json({
        success: true,
        data: thread,
        message: "Thread created successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// Helper function to organize replies into nested structure with author data
function organizeRepliesWithAuthors(
  replies: any[],
  authors: any[],
  replyImages: any[] = []
): any[] {
  const replyMap = new Map();
  const rootReplies: any[] = [];

  // Create author lookup map
  const authorMap = new Map();
  authors.forEach((author) => {
    authorMap.set(author.id, author);
  });

  // Create reply images lookup map
  const replyImagesMap = new Map();
  replyImages.forEach((image) => {
    if (!replyImagesMap.has(image.reply_id)) {
      replyImagesMap.set(image.reply_id, []);
    }
    replyImagesMap.get(image.reply_id).push(image);
  });

  // First pass: create map of all replies with transformed author data and images
  replies.forEach((reply) => {
    const author = authorMap.get(reply.author_id);
    const images = replyImagesMap.get(reply.id) || [];

    const transformedReply = {
      ...reply,
      author_id: reply.author_id,
      author_username: author?.username || "Unknown User",
      author_name: author?.full_name || null,
      author_avatar: author?.avatar_url || null,
      author_role: "user", // Default role
      images: images,
      replies: [],
    };
    replyMap.set(reply.id, transformedReply);
  });

  // Second pass: organize into tree structure
  replies.forEach((reply) => {
    if (reply.parent_id) {
      const parent = replyMap.get(reply.parent_id);
      if (parent) {
        parent.replies.push(replyMap.get(reply.id));
      }
    } else {
      rootReplies.push(replyMap.get(reply.id));
    }
  });

  return rootReplies;
}

// PUT /api/forum/threads/:id - Update thread (Author or Admin)
router.put(
  "/threads/:id",
  authenticateToken,
  validate(forumSchemas.updateThread),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Check if thread exists and get author
      const { data: thread, error: fetchError } = await supabaseAdmin
        .from("forum_threads")
        .select("author_id")
        .eq("id", id)
        .single();

      if (fetchError || !thread) {
        return next(createError("Thread not found", 404));
      }

      // Check permissions using cached role
      const isAuthor = reqIsOwner(req as any, thread.author_id);
      const isAdminOrMod = reqIsModerator(req as any);

      if (!isAuthor && !isAdminOrMod) {
        return next(createError("Insufficient permissions", 403));
      }

      const { data: updatedThread, error } = await supabaseAdmin
        .from("forum_threads")
        .update(req.body)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return next(createError("Failed to update thread", 500));
      }

      res.json({
        success: true,
        data: updatedThread,
        message: "Thread updated successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// DELETE /api/forum/threads/:id - Delete thread (Author or Admin)
router.delete(
  "/threads/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Check if thread exists and get author
      const { data: thread, error: fetchError } = await supabaseAdmin
        .from("forum_threads")
        .select("author_id")
        .eq("id", id)
        .single();

      if (fetchError || !thread) {
        return next(createError("Thread not found", 404));
      }

      // Check permissions using cached role
      const isAuthor = reqIsOwner(req as any, thread.author_id);
      const isAdminOrMod = reqIsModerator(req as any);

      if (!isAuthor && !isAdminOrMod) {
        return next(createError("Insufficient permissions", 403));
      }

      // Soft delete by setting is_deleted = true
      const { error } = await supabaseAdmin
        .from("forum_threads")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) {
        return next(createError("Failed to delete thread", 500));
      }

      res.json({
        success: true,
        message: "Thread deleted successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// =====================================================
// REPLIES ENDPOINTS
// =====================================================

// POST /api/forum/replies - Create new reply
router.post(
  "/replies",
  authenticateToken,
  validate(forumSchemas.createReply),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { thread_id, parent_id, content, images } = req.body;

      // Check if thread exists and is not locked
      const { data: thread, error: threadError } = await supabaseAdmin
        .from("forum_threads")
        .select("is_locked")
        .eq("id", thread_id)
        .single();

      if (threadError || !thread) {
        return next(createError("Thread not found", 404));
      }

      if (thread.is_locked) {
        return next(createError("Cannot reply to locked thread", 403));
      }

      // Determine nesting level
      let nesting_level = 0;
      if (parent_id) {
        const { data: parentReply } = await supabaseAdmin
          .from("forum_replies")
          .select("nesting_level")
          .eq("id", parent_id)
          .single();

        if (parentReply) {
          nesting_level = parentReply.nesting_level + 1;
          // Enforce maximum nesting level of 1 (2 levels total: 0 and 1)
          if (nesting_level > 1) {
            return next(validationError("Maximum nesting level exceeded"));
          }
        }
      }

      const replyData = {
        thread_id,
        parent_id,
        author_id: req.user!.id,
        content,
        nesting_level,
      };

      const { data: reply, error } = await supabaseAdmin
        .from("forum_replies")
        .insert([replyData])
        .select()
        .single();

      if (error) {
        return next(createError("Failed to create reply", 500));
      }

      res.status(201).json({
        success: true,
        data: reply,
        message: "Reply created successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// PUT /api/forum/replies/:id - Update reply (Author or Admin)
router.put(
  "/replies/:id",
  authenticateToken,
  validate(forumSchemas.updateReply),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Check if reply exists and get author
      const { data: reply, error: fetchError } = await supabaseAdmin
        .from("forum_replies")
        .select("author_id")
        .eq("id", id)
        .single();

      if (fetchError || !reply) {
        return next(createError("Reply not found", 404));
      }

      // Check permissions using cached role
      const isAuthor = reqIsOwner(req as any, reply.author_id);
      const isAdminOrMod = reqIsModerator(req as any);

      if (!isAuthor && !isAdminOrMod) {
        return next(createError("Insufficient permissions", 403));
      }

      const { data: updatedReply, error } = await supabaseAdmin
        .from("forum_replies")
        .update(req.body)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return next(createError("Failed to update reply", 500));
      }

      res.json({
        success: true,
        data: updatedReply,
        message: "Reply updated successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// DELETE /api/forum/replies/:id - Delete reply (Author or Admin)
router.delete(
  "/replies/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Check if reply exists and get author
      const { data: reply, error: fetchError } = await supabaseAdmin
        .from("forum_replies")
        .select("author_id")
        .eq("id", id)
        .single();

      if (fetchError || !reply) {
        return next(createError("Reply not found", 404));
      }

      // Check permissions using cached role
      const isAuthor = reqIsOwner(req as any, reply.author_id);
      const isAdminOrMod = reqIsModerator(req as any);

      if (!isAuthor && !isAdminOrMod) {
        return next(createError("Insufficient permissions", 403));
      }

      // Soft delete by setting is_deleted = true
      const { error } = await supabaseAdmin
        .from("forum_replies")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) {
        return next(createError("Failed to delete reply", 500));
      }

      res.json({
        success: true,
        message: "Reply deleted successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// =====================================================
// MODERATION ENDPOINTS
// =====================================================

// POST /api/forum/threads/:id/moderate - Moderate thread (Admin/Moderator only)
router.post(
  "/threads/:id/moderate",
  authenticateToken,
  validate(forumSchemas.moderateThread),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      // Check if user is admin/moderator by cached role (global auth)
      const isAdminOrMod = reqIsModerator(req as any);
      if (!isAdminOrMod) {
        return next(createError("Insufficient permissions", 403));
      }

      // Check if thread exists
      const { data: thread, error: fetchError } = await supabaseAdmin
        .from("forum_threads")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !thread) {
        return next(createError("Thread not found", 404));
      }

      let updateData: any = {};

      switch (action) {
        case "pin":
          updateData.is_pinned = true;
          break;
        case "unpin":
          updateData.is_pinned = false;
          break;
        case "lock":
          updateData.is_locked = true;
          break;
        case "unlock":
          updateData.is_locked = false;
          break;
        case "delete":
          updateData.is_deleted = true;
          break;
        case "restore":
          updateData.is_deleted = false;
          break;
        default:
          return next(validationError("Invalid moderation action"));
      }

      const { data: updatedThread, error } = await supabaseAdmin
        .from("forum_threads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return next(createError("Failed to moderate thread", 500));
      }

      res.json({
        success: true,
        data: updatedThread,
        message: `Thread ${action}ed successfully`,
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

export default router;
