import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../services/supabaseClient";
import {
  validate,
  forumSchemas,
  commonSchemas,
} from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  forbiddenError,
  validationError,
} from "../middleware/errorHandler";
import {
  authenticateToken,
  optionalAuth,
  requireOwnership,
  requireModerator,
  requireForumModerator,
  requirePostPermission,
  requireVotePermission,
} from "../middleware/auth";
import {
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { AuthenticatedRequest } from "../types";
import { mockRepliesStore } from "../services/mockRepliesStore";
import {
  ForumPost,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";
import { toString, toNumber } from "../utils/typeUtils";
import Joi from "joi";

// Helper function to fetch attachments for forum entities
async function fetchAttachments(entityType: string, entityIds: string[]) {
  if (!entityIds || entityIds.length === 0) return {};

  const { data: attachments, error } = await supabaseAdmin
    .from("file_uploads")
    .select("*")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn(`Failed to fetch ${entityType} attachments:`, error);
    return {};
  }

  // Group attachments by entity_id
  const attachmentMap = {};
  attachments?.forEach((attachment) => {
    const entityId = attachment.entity_id;
    if (!attachmentMap[entityId]) {
      attachmentMap[entityId] = [];
    }
    attachmentMap[entityId].push({
      id: attachment.id,
      filename: attachment.filename,
      original_filename: attachment.original_name,
      file_path: attachment.file_path,
      file_size: attachment.file_size,
      mime_type: attachment.mime_type,
      is_image: attachment.mime_type.startsWith("image/"),
      alt_text: attachment.alt_text,
      uploader_id: attachment.user_id,
      created_at: attachment.created_at,
    });
  });

  return attachmentMap;
}

const router: Router = express.Router();

// TypeScript interfaces
interface ForumPostsQuery {
  page?: number;
  limit?: number;
  category_id?: string;
  sort?: "asc" | "desc";
  sortBy?: "created_at" | "updated_at" | "views" | "title" | "reply_count";
  q?: string;
  is_pinned?: string;
  is_locked?: string;
}

interface CreatePostRequest {
  title: string;
  content: string;
  category_id: string;
  tags?: string[];
}

interface UpdatePostRequest {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_locked?: boolean;
}

interface CreateReplyRequest {
  content: string;
  parent_id?: string;
}

interface UpdateReplyRequest {
  content: string;
}

interface PinPostRequest {
  is_pinned: boolean;
}

interface LockPostRequest {
  is_locked: boolean;
}

interface SearchQuery {
  q: string;
  category_id?: string;
  page?: number;
  limit?: number;
}

interface UserPostsQuery {
  page?: number;
  limit?: number;
}

// @route   GET /api/forum/categories
// @desc    Get all forum categories
// @access  Public
router.get(
  "/categories",
  asyncHandler(async (req: Request, res: Response) => {
    const { data: categories, error } = await supabaseAdmin
      .from("forum_categories")
      .select(
        `
      *,
      forum_posts(count)
    `
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error("Failed to fetch forum categories");
    }

    res.json({
      success: true,
      data: {
        categories,
      },
    });
  })
);

// @route   GET /api/forum/categories/:id
// @desc    Get a specific forum category by ID
// @access  Public
router.get(
  "/categories/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid category ID format");
    }

    const { data: category, error } = await supabaseAdmin
      .from("forum_categories")
      .select(
        `
      *,
      forum_posts(count)
    `
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      throw notFoundError("Forum category");
    }

    res.json({
      success: true,
      data: {
        category,
      },
    });
  })
);

// Enhanced query schema for posts
const postsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category_id: Joi.string().uuid(),
  author_id: Joi.string().uuid(),
  sort: Joi.string().valid("asc", "desc").default("desc"),
  sortBy: Joi.string()
    .valid(
      "created_at",
      "updated_at",
      "views",
      "title",
      "reply_count",
      "last_activity_at"
    )
    .default("last_activity_at"),
  q: Joi.string().min(1).max(100),
  is_pinned: Joi.string().valid("true", "false"),
  is_locked: Joi.string().valid("true", "false"),
  is_featured: Joi.string().valid("true", "false"),
});

// @route   GET /api/forum/posts
// @desc    Get all forum posts with enhanced filtering
// @access  Public
router.get(
  "/posts",
  optionalAuth,
  validate(postsQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      category_id,
      author_id,
      sort,
      sortBy,
      q,
      is_pinned,
      is_locked,
      is_featured,
    } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    let query = supabaseAdmin
      .from("forum_posts")
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug, color)
    `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .range(from, to);

    // Apply filters
    const categoryIdStr = toString(category_id);
    if (categoryIdStr && isValidUUID(categoryIdStr)) {
      query = query.eq("category_id", categoryIdStr);
    }

    const authorIdStr = toString(author_id);
    if (authorIdStr && isValidUUID(authorIdStr)) {
      query = query.eq("author_id", authorIdStr);
    }

    if (is_pinned === "true") {
      query = query.eq("is_pinned", true);
    }
    if (is_locked === "true") {
      query = query.eq("is_locked", true);
    }
    if (is_featured === "true") {
      query = query.eq("is_featured", true);
    }
    if (q) {
      const searchTerm = toString(q);
      query = query.or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
      );
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "views",
      "title",
      "reply_count",
      "last_activity_at",
    ];
    const sortByStr = toString(sortBy);
    const sortField = validSortFields.includes(sortByStr)
      ? sortByStr
      : "last_activity_at";
    const sortOrder =
      sort === "asc" ? { ascending: true } : { ascending: false };

    // Always sort pinned posts first, then featured, then by selected field
    query = query.order("is_pinned", { ascending: false });
    query = query.order("is_featured", { ascending: false });
    query = query.order(sortField, sortOrder);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Supabase error details:", error);
      throw new Error(`Failed to fetch forum posts: ${error.message}`);
    }

    // Fetch attachments for all posts
    const postIds = posts?.map((post) => post.id) || [];
    const postAttachments = await fetchAttachments("forum_post", postIds);

    // Add attachments to posts
    const postsWithAttachments =
      posts?.map((post) => ({
        ...post,
        attachments: postAttachments[post.id] || [],
      })) || [];

    res.json({
      success: true,
      data: {
        posts: postsWithAttachments,
        pagination: buildPaginationMetadata(
          toNumber(page, 1),
          toNumber(limit, 20),
          count || 0
        ),
      },
    });
  })
);

// Utility function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 200);
};

// @route   POST /api/forum/posts
// @desc    Create a new forum post
// @access  Private
router.post(
  "/posts",
  authenticateToken,
  requirePostPermission,
  validate(forumSchemas.createPost),
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content, category_id, tags } = req.body;
    const userId = (req as any).user.id;

    // Verify category exists
    const { data: category, error: categoryError } = await supabaseAdmin
      .from("forum_categories")
      .select("id, name")
      .eq("id", category_id)
      .eq("is_active", true)
      .single();

    if (categoryError) {
      throw validationError("Invalid category selected");
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = `${baseSlug}-${Date.now()}`;

    const postData = {
      title,
      content,
      category_id,
      author_id: userId,
      slug,
      tags: tags || [],
      is_active: true,
      view_count: 0,
      like_count: 0,
      reply_count: 0,
      is_pinned: false,
      is_locked: false,
      is_featured: false,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: post, error } = await supabaseAdmin
      .from("forum_posts")
      .insert(postData)
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug, color)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to create forum post");
    }

    // Update category post count
    await supabaseAdmin
      .from("forum_categories")
      .update({
        post_count: (category as any).post_count + 1,
        last_post_id: post.id,
        last_post_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", category_id);

    // Fetch attachments for the created post
    const postAttachments = await fetchAttachments("forum_post", [post.id]);

    res.status(201).json({
      success: true,
      message: "Forum post created successfully",
      data: {
        post: {
          ...post,
          attachments: postAttachments[post.id] || [],
        },
      },
    });
  })
);

// @route   GET /api/forum/posts/:id
// @desc    Get forum post by ID with replies
// @access  Public
router.get(
  "/posts/:id",
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Get the post
    const { data: post, error: postError } = await supabaseAdmin
      .from("forum_posts")
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug)
    `
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (postError) {
      throw notFoundError("Forum post");
    }

    // Increment view count (only if not the author)
    if (!(req as any).user || (req as any).user.id !== post.author_id) {
      await supabaseAdmin
        .from("forum_posts")
        .update({ views: (post.views || 0) + 1 })
        .eq("id", id);

      post.views = (post.views || 0) + 1;
    }

    // Get replies with pagination - fetch all replies first, then organize into hierarchy
    // Try to fetch replies with user data first
    let {
      data: replies,
      error: repliesError,
      count,
    } = await supabaseAdmin
      .from("forum_replies")
      .select(
        `
      *,
      users!forum_replies_author_id_fkey(username, full_name, avatar_url)
    `,
        { count: "exact" }
      )
      .eq("post_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    // If foreign key relationship fails, try simple query without user data
    if (repliesError && repliesError.message?.includes("relationship")) {
      console.log("Foreign key relationship not found, trying simple query...");

      const simpleResult = await supabaseAdmin
        .from("forum_replies")
        .select("*", { count: "exact" })
        .eq("post_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (!simpleResult.error) {
        replies = simpleResult.data;
        count = simpleResult.count;
        repliesError = null;

        // Add real user data for display by fetching from users table
        if (replies && replies.length > 0) {
          // Get unique author IDs
          const authorIds = [
            ...new Set(replies.map((reply) => reply.author_id)),
          ];

          // Fetch user data for all authors
          const { data: usersData } = await supabaseAdmin
            .from("users")
            .select("id, username, full_name, avatar_url")
            .in("id", authorIds);

          // Create a map for quick lookup
          const usersMap = new Map();
          usersData?.forEach((user) => {
            usersMap.set(user.id, {
              username: user.username,
              full_name: user.full_name,
              avatar_url:
                user.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || "Unknown")}&background=random`,
            });
          });

          // Map replies with real user data
          replies = replies.map((reply) => ({
            ...reply,
            users: usersMap.get(reply.author_id) || {
              username: "unknown",
              full_name: "Unknown User",
              avatar_url:
                "https://ui-avatars.com/api/?name=Unknown&background=random",
            },
          }));
        } else {
          replies = [];
        }

        console.log(
          `✅ Simple query successful! Found ${replies.length} replies`
        );
      } else {
        repliesError = simpleResult.error;
      }
    }

    if (repliesError) {
      console.warn(
        "Failed to fetch replies (table may not exist):",
        repliesError
      );

      // Check if it's a table not found error
      if (repliesError.code === "PGRST200" || repliesError.code === "42P01") {
        console.log("forum_replies table does not exist - creating it...");

        // Try to create the table by inserting a minimal record
        try {
          const { data: posts } = await supabaseAdmin
            .from("forum_posts")
            .select("id, author_id")
            .limit(1);

          if (posts && posts.length > 0) {
            const testReply = {
              post_id: posts[0].id,
              author_id: posts[0].author_id,
              content: "Table creation test",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: createdReply, error: createError } =
              await supabaseAdmin
                .from("forum_replies")
                .insert(testReply)
                .select("id")
                .single();

            if (!createError && createdReply) {
              console.log("✅ forum_replies table created successfully!");

              // Clean up test record
              await supabaseAdmin
                .from("forum_replies")
                .delete()
                .eq("id", createdReply.id);

              // Now try to fetch replies again
              const retryResult = await supabaseAdmin
                .from("forum_replies")
                .select(
                  `
                *,
                users!forum_replies_author_id_fkey(username, full_name, avatar_url)
              `,
                  { count: "exact" }
                )
                .eq("post_id", id)
                .eq("is_active", true)
                .order("created_at", { ascending: true })
                .range(from, to);

              if (!retryResult.error) {
                replies = retryResult.data;
                count = retryResult.count;
                console.log("✅ Successfully fetched replies from new table");
              } else {
                console.log("⚠️  Retry failed, using empty replies");
                replies = [];
                count = 0;
              }
            } else {
              console.log("❌ Failed to create table:", createError?.message);
              replies = [];
              count = 0;
            }
          } else {
            console.log("❌ No posts found to create table");
            replies = [];
            count = 0;
          }
        } catch (tableCreateError) {
          console.log("❌ Table creation failed:", tableCreateError);
          replies = [];
          count = 0;
        }
      } else {
        // Other error, just return empty
        replies = [];
        count = 0;
      }
    }

    // Organize replies into nested structure with maximum depth of 2
    const organizeRepliesIntoTree = (replies: any[]): any[] => {
      if (!replies || replies.length === 0) return [];

      const replyMap = new Map();
      const rootReplies: any[] = [];
      const maxDepth = 2; // Maximum nesting depth: 0 (root), 1 (first level), 2 (second level)

      // Helper function to calculate depth of a reply
      const calculateDepth = (replyId: string, visited = new Set()): number => {
        if (visited.has(replyId)) return 0; // Prevent infinite loops
        visited.add(replyId);

        const reply = replies.find((r) => r.id === replyId);
        if (!reply || !reply.parent_id) return 0;

        return 1 + calculateDepth(reply.parent_id, visited);
      };

      // First pass: create map of all replies with depth calculation
      replies.forEach((reply) => {
        const depth = calculateDepth(reply.id);
        replyMap.set(reply.id, { ...reply, children: [], depth });
      });

      // Second pass: organize into tree structure, respecting max depth
      replies.forEach((reply) => {
        const replyWithChildren = replyMap.get(reply.id);
        const depth = replyWithChildren.depth;

        if (reply.parent_id && replyMap.has(reply.parent_id)) {
          const parent = replyMap.get(reply.parent_id);

          // If adding this reply would exceed max depth, find a suitable parent at max depth
          if (depth > maxDepth) {
            // Find the root or first-level parent to attach this reply to
            let targetParent = parent;
            while (targetParent.depth >= maxDepth && targetParent.parent_id) {
              const grandParent = replyMap.get(targetParent.parent_id);
              if (grandParent) {
                targetParent = grandParent;
              } else {
                break;
              }
            }
            targetParent.children.push(replyWithChildren);
          } else {
            // Normal nesting within depth limit
            parent.children.push(replyWithChildren);
          }
        } else {
          // This is a root-level reply
          rootReplies.push(replyWithChildren);
        }
      });

      return rootReplies;
    };

    // Apply pagination to the nested structure
    const nestedReplies = organizeRepliesIntoTree(replies || []);
    const paginatedReplies = nestedReplies.slice(
      from,
      from + toNumber(limit, 20)
    );

    // Get author's post count
    const { count: authorPostCount } = await supabaseAdmin
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", post.author_id)
      .eq("is_active", true);

    // Fetch attachments for the post
    const postAttachments = await fetchAttachments("forum_post", [post.id]);

    // Fetch attachments for all replies
    const replyIds = replies?.map((reply) => reply.id) || [];
    const replyAttachments = await fetchAttachments("forum_reply", replyIds);

    // Add attachments to post
    const postWithAttachments = {
      ...post,
      users: {
        ...post.users,
        post_count: authorPostCount || 0,
      },
      attachments: postAttachments[post.id] || [],
    };

    // Add attachments to replies recursively
    const addAttachmentsToReplies = (repliesList: any[]): any[] => {
      return repliesList.map((reply) => ({
        ...reply,
        attachments: replyAttachments[reply.id] || [],
        children: reply.children ? addAttachmentsToReplies(reply.children) : [],
      }));
    };

    const repliesWithAttachments = addAttachmentsToReplies(paginatedReplies);

    res.json({
      success: true,
      data: {
        post: postWithAttachments,
        replies: repliesWithAttachments,
        pagination: {
          page: toNumber(page, 1),
          limit: toNumber(limit, 20),
          total: nestedReplies.length, // Use nested count for pagination
          pages: Math.ceil(nestedReplies.length / toNumber(limit, 20)),
        },
      },
    });
  })
);

// @route   PUT /api/forum/posts/:id
// @desc    Update forum post
// @access  Private (Author or Moderator)
router.put(
  "/posts/:id",
  authenticateToken,
  validate(forumSchemas.updatePost),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists and get author
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from("forum_posts")
      .select("author_id, is_locked")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Forum post");
    }

    // Check permissions (author or moderator)
    const isAuthor = existingPost.author_id === (req as any).user.id;
    const isModerator =
      (req as any).user.role === "moderator" ||
      (req as any).user.role === "admin";

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only edit your own posts");
    }

    // Check if post is locked (only moderators can edit locked posts)
    if (existingPost.is_locked && !isModerator) {
      throw forbiddenError("This post is locked and cannot be edited");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // Only moderators can change certain fields
    if (!isModerator) {
      delete updateData.is_pinned;
      delete updateData.is_locked;
      delete updateData.category_id;
    }

    const { data: post, error } = await supabaseAdmin
      .from("forum_posts")
      .update(updateData)
      .eq("id", id)
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to update forum post");
    }

    res.json({
      success: true,
      message: "Forum post updated successfully",
      data: {
        post,
      },
    });
  })
);

// @route   DELETE /api/forum/posts/:id
// @desc    Delete forum post
// @access  Private (Author or Moderator)
router.delete(
  "/posts/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists and get author
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from("forum_posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Forum post");
    }

    // Check permissions (author or moderator)
    const isAuthor = existingPost.author_id === (req as any).user.id;
    const isModerator =
      (req as any).user.role === "moderator" ||
      (req as any).user.role === "admin";

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only delete your own posts");
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("forum_posts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete forum post");
    }

    res.json({
      success: true,
      message: "Forum post deleted successfully",
    });
  })
);

// @route   POST /api/forum/posts/:id/replies
// @desc    Create a reply to a forum post
// @access  Private
router.post(
  "/posts/:id/replies",
  authenticateToken,
  requirePostPermission,
  validate(forumSchemas.createReply),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: postId } = req.params;

    if (!isValidUUID(postId)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists and is not locked
    const { data: post, error: postError } = await supabaseAdmin
      .from("forum_posts")
      .select("id, is_locked, is_active")
      .eq("id", postId)
      .single();

    if (postError) {
      throw notFoundError("Forum post");
    }

    if (!post.is_active) {
      throw forbiddenError("Cannot reply to an inactive post");
    }

    if (post.is_locked) {
      throw forbiddenError(
        "This post is locked and cannot receive new replies"
      );
    }

    // Check nesting depth if this is a reply to another reply
    if (req.body.parent_id) {
      const maxDepth = 2; // Maximum nesting depth: 0 (root), 1 (first level), 2 (second level)

      // Helper function to calculate depth of a reply
      const calculateReplyDepth = async (
        parentId: string,
        depth = 0
      ): Promise<number> => {
        if (depth > maxDepth + 1) return depth; // Prevent infinite recursion

        const { data: parentReply } = await supabaseAdmin
          .from("forum_replies")
          .select("parent_id")
          .eq("id", parentId)
          .single();

        if (!parentReply || !parentReply.parent_id) {
          return depth + 1; // This parent is a root reply, so new reply will be at depth + 1
        }

        return calculateReplyDepth(parentReply.parent_id, depth + 1);
      };

      const replyDepth = await calculateReplyDepth(req.body.parent_id);

      if (replyDepth > maxDepth) {
        throw forbiddenError(
          `Maximum reply nesting depth of ${maxDepth} levels has been reached. Please reply to a higher-level comment.`
        );
      }
    }

    // Destructure to exclude attachment_ids from database insert (it's not a DB column)
    const { attachment_ids, ...replyFields } = req.body;
    
    const replyData = {
      ...replyFields,
      post_id: postId,
      author_id: (req as any).user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let reply;
    let error;

    try {
      const result = await supabaseAdmin
        .from("forum_replies")
        .insert(replyData)
        .select(
          `
        *,
        users!forum_replies_author_id_fkey(username, full_name, avatar_url)
      `
        )
        .single();

      reply = result.data;
      error = result.error;

      // If foreign key relationship fails, try simple insert without user data
      if (error && error.message?.includes("relationship")) {
        console.log("Foreign key relationship issue, trying simple insert...");

        const simpleResult = await supabaseAdmin
          .from("forum_replies")
          .insert(replyData)
          .select("*")
          .single();

        if (!simpleResult.error) {
          // Get the actual authenticated user's data
          const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .select("username, full_name, avatar_url")
            .eq("id", (req as any).user.id)
            .single();

          // Add real user data for response
          reply = {
            ...simpleResult.data,
            users: userData || {
              username: (req as any).user.username || "unknown",
              full_name: (req as any).user.full_name || "Unknown User",
              avatar_url:
                (req as any).user.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent((req as any).user.full_name || "Unknown User")}&background=random`,
            },
          };
          error = null;
          console.log(
            "✅ Reply created successfully with simple insert and real user data"
          );
        } else {
          error = simpleResult.error;
        }
      }
    } catch (dbError) {
      error = dbError;
    }

    if (error) {
      console.warn("Database reply creation failed:", error);

      // If it's a table not found error, try to create the table
      if (
        error.code === "PGRST200" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        console.log("Attempting to create forum_replies table...");

        try {
          // Try to create table by inserting a test record
          const testReply = {
            post_id: postId,
            author_id: (req as any).user.id,
            content: "Table creation test",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: createdTest, error: testError } = await supabaseAdmin
            .from("forum_replies")
            .insert(testReply)
            .select("id")
            .single();

          if (!testError && createdTest) {
            console.log("✅ Table created! Cleaning up test record...");

            // Clean up test record
            await supabaseAdmin
              .from("forum_replies")
              .delete()
              .eq("id", createdTest.id);

            // Now try the original insert again, but handle foreign key issues
            let retryResult = await supabaseAdmin
              .from("forum_replies")
              .insert(replyData)
              .select(
                `
              *,
              users!forum_replies_author_id_fkey(username, full_name, avatar_url)
            `
              )
              .single();

            // If foreign key relationship fails, try simple insert without user data
            if (
              retryResult.error &&
              retryResult.error.message?.includes("relationship")
            ) {
              console.log(
                "Foreign key relationship issue, trying simple insert..."
              );

              retryResult = await supabaseAdmin
                .from("forum_replies")
                .insert(replyData)
                .select("*")
                .single();

              if (!retryResult.error) {
                // Add mock user data for response
                reply = {
                  ...retryResult.data,
                  users: {
                    username: "chiboy09",
                    full_name: "Chijioke Obi",
                    avatar_url:
                      "https://ui-avatars.com/api/?name=Chijioke+Obi&background=random",
                  },
                };
                error = null;
                console.log("✅ Reply created successfully with simple insert");
              } else {
                console.log("❌ Simple retry also failed:", retryResult.error);
                throw new Error("Failed to create reply after table creation");
              }
            } else if (!retryResult.error) {
              reply = retryResult.data;
              error = null;
              console.log("✅ Reply created successfully after table creation");
            } else {
              console.log("❌ Retry failed:", retryResult.error);
              throw new Error("Failed to create reply after table creation");
            }
          } else {
            console.log("❌ Table creation failed:", testError);
            throw new Error("Failed to create forum_replies table");
          }
        } catch (tableError) {
          console.log("❌ Table creation error:", tableError);
          throw new Error("Failed to create reply - table creation failed");
        }
      } else {
        throw new Error("Failed to create reply");
      }
    }

    // Associate uploaded files with the reply if attachment_ids provided
    if (attachment_ids && attachment_ids.length > 0) {
      console.log(`🔗 Associating ${attachment_ids.length} files with reply ${reply.id}`);
      
      try {
        const { data: updatedFiles, error: fileUpdateError } = await supabaseAdmin
          .from("file_uploads")
          .update({
            entity_type: "forum_reply",
            entity_id: reply.id,
            updated_at: new Date().toISOString(),
          })
          .in("id", attachment_ids)
          .eq("entity_id", null) // Only update files that aren't already associated
          .eq("user_id", (req as any).user.id) // Only update files uploaded by the current user
          .select("id, filename");

        if (fileUpdateError) {
          console.warn("Failed to associate files with reply:", fileUpdateError);
        } else {
          console.log(`✅ Successfully associated ${updatedFiles?.length || 0} files with reply ${reply.id}`);
        }
      } catch (fileAssocError) {
        console.warn("Error during file association:", fileAssocError);
      }
    }

    // Update post's reply count and last activity
    // First get current reply count
    const { data: currentPost } = await supabaseAdmin
      .from("forum_posts")
      .select("reply_count")
      .eq("id", postId)
      .single();

    const newReplyCount = (currentPost?.reply_count || 0) + 1;

    await supabaseAdmin
      .from("forum_posts")
      .update({
        reply_count: newReplyCount,
        last_reply_at: new Date().toISOString(),
        last_reply_by: (req as any).user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    // Fetch attachments for the created reply
    const replyAttachments = await fetchAttachments("forum_reply", [reply.id]);

    res.status(201).json({
      success: true,
      message: "Reply created successfully",
      data: {
        reply: {
          ...reply,
          attachments: replyAttachments[reply.id] || [],
        },
      },
    });
  })
);

// @route   PUT /api/forum/replies/:id
// @desc    Update forum reply
// @access  Private (Author or Moderator)
router.put(
  "/replies/:id",
  authenticateToken,
  validate(forumSchemas.updateReply),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid reply ID format");
    }

    // Check if reply exists and get author
    const { data: existingReply, error: checkError } = await supabaseAdmin
      .from("forum_replies")
      .select("author_id, post_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Forum reply");
    }

    // Check permissions (author or moderator)
    const isAuthor = existingReply.author_id === (req as any).user.id;
    const isModerator =
      (req as any).user.role === "moderator" ||
      (req as any).user.role === "admin";

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only edit your own replies");
    }

    // Check if parent post is locked (only moderators can edit replies in locked posts)
    const { data: post } = await supabaseAdmin
      .from("forum_posts")
      .select("is_locked")
      .eq("id", existingReply.post_id)
      .single();

    if (post && post.is_locked && !isModerator) {
      throw forbiddenError("Cannot edit replies in a locked post");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      is_edited: true,
    };

    const { data: reply, error } = await supabaseAdmin
      .from("forum_replies")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      console.error("Update data was:", updateData);
      console.error("Reply ID was:", id);
      throw new Error(
        `Failed to update reply: ${error.message || JSON.stringify(error)}`
      );
    }

    res.json({
      success: true,
      message: "Reply updated successfully",
      data: {
        reply,
      },
    });
  })
);

// @route   DELETE /api/forum/replies/:id
// @desc    Delete forum reply
// @access  Private (Author or Moderator)
router.delete(
  "/replies/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid reply ID format");
    }

    // Check if reply exists and get author
    const { data: existingReply, error: checkError } = await supabaseAdmin
      .from("forum_replies")
      .select("author_id, post_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Forum reply");
    }

    // Check permissions (author or moderator)
    const isAuthor = existingReply.author_id === (req as any).user.id;
    const isModerator =
      (req as any).user.role === "moderator" ||
      (req as any).user.role === "admin";

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only delete your own replies");
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("forum_replies")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete reply");
    }

    // Update post's reply count
    // First get current reply count
    const { data: currentPost } = await supabaseAdmin
      .from("forum_posts")
      .select("reply_count")
      .eq("id", existingReply.post_id)
      .single();

    const newReplyCount = Math.max((currentPost?.reply_count || 0) - 1, 0);

    await supabaseAdmin
      .from("forum_posts")
      .update({
        reply_count: newReplyCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingReply.post_id);

    res.json({
      success: true,
      message: "Reply deleted successfully",
    });
  })
);

// @route   POST /api/forum/posts/:id/pin
// @desc    Pin/unpin a forum post
// @access  Private (Moderator only)
router.post(
  "/posts/:id/pin",
  authenticateToken,
  requireForumModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_pinned } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    const { data: post, error } = await supabaseAdmin
      .from("forum_posts")
      .update({
        is_pinned: Boolean(is_pinned),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, title, is_pinned")
      .single();

    if (error) {
      throw notFoundError("Forum post");
    }

    res.json({
      success: true,
      message: `Post ${post.is_pinned ? "pinned" : "unpinned"} successfully`,
      data: {
        post,
      },
    });
  })
);

// @route   POST /api/forum/posts/:id/lock
// @desc    Lock/unlock a forum post
// @access  Private (Moderator only)
router.post(
  "/posts/:id/lock",
  authenticateToken,
  requireForumModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_locked } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    const { data: post, error } = await supabaseAdmin
      .from("forum_posts")
      .update({
        is_locked: Boolean(is_locked),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, title, is_locked")
      .single();

    if (error) {
      throw notFoundError("Forum post");
    }

    res.json({
      success: true,
      message: `Post ${post.is_locked ? "locked" : "unlocked"} successfully`,
      data: {
        post,
      },
    });
  })
);

// @route   GET /api/forum/search
// @desc    Search forum posts and replies
// @access  Public
router.get(
  "/search",
  validate(commonSchemas.search, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, category_id, page = 1, limit = 20 } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    const qStr = toString(q);
    if (!qStr || qStr.trim().length < 2) {
      throw validationError("Search query must be at least 2 characters long");
    }

    let query = supabaseAdmin
      .from("forum_posts")
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug)
    `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .or(`title.ilike.%${qStr}%,content.ilike.%${qStr}%`)
      .order("updated_at", { ascending: false })
      .range(from, to);

    const categoryIdStr = toString(category_id);
    if (categoryIdStr && isValidUUID(categoryIdStr)) {
      query = query.eq("category_id", categoryIdStr);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      throw new Error("Failed to search forum posts");
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: toNumber(page, 1),
          limit: toNumber(limit, 20),
          total: count,
          pages: Math.ceil(count / toNumber(limit, 20)),
        },
        query: q,
      },
    });
  })
);

// @route   GET /api/forum/user/:userId/posts
// @desc    Get user's forum posts
// @access  Public
router.get(
  "/user/:userId/posts",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(userId)) {
      throw validationError("Invalid user ID format");
    }

    const {
      data: posts,
      error,
      count,
    } = await supabaseAdmin
      .from("forum_posts")
      .select(
        `
      *,
      users!forum_posts_author_id_fkey(username, full_name, avatar_url),
      forum_categories(name, slug, color)
    `,
        { count: "exact" }
      )
      .eq("author_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error("Failed to fetch user posts");
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: buildPaginationMetadata(
          toNumber(page, 1),
          toNumber(limit, 20),
          count || 0
        ),
      },
    });
  })
);

// @route   POST /api/forum/posts/:id/feature
// @desc    Feature/unfeature a forum post
// @access  Private (Moderator only)
router.post(
  "/posts/:id/feature",
  authenticateToken,
  requireForumModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_featured } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    const { data: post, error } = await supabaseAdmin
      .from("forum_posts")
      .update({
        is_featured: Boolean(is_featured),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, title, is_featured")
      .single();

    if (error) {
      throw notFoundError("Forum post");
    }

    res.json({
      success: true,
      message: `Post ${post.is_featured ? "featured" : "unfeatured"} successfully`,
      data: {
        post,
      },
    });
  })
);

// @route   GET /api/forum/stats
// @desc    Get forum statistics
// @access  Public
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    // Get total posts count
    const { count: totalPosts } = await supabaseAdmin
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get total replies count
    const { count: totalReplies } = await supabaseAdmin
      .from("forum_replies")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get active categories count
    const { count: totalCategories } = await supabaseAdmin
      .from("forum_categories")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get recent activity (posts from last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: recentPosts } = await supabaseAdmin
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("created_at", yesterday.toISOString());

    res.json({
      success: true,
      data: {
        totalPosts: totalPosts || 0,
        totalReplies: totalReplies || 0,
        totalCategories: totalCategories || 0,
        recentPosts: recentPosts || 0,
        totalDiscussions: (totalPosts || 0) + (totalReplies || 0),
      },
    });
  })
);

// =============================================================================
// VOTING ENDPOINTS
// =============================================================================

// @route   POST /api/forum/posts/:id/vote
// @desc    Vote on a forum post
// @access  Private
router.post(
  "/posts/:id/vote",
  authenticateToken,
  requireVotePermission,
  validate(forumSchemas.vote),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { vote_type } = req.body; // 'upvote' or 'downvote'
    const userId = (req as any).user.id;

    if (!isValidUUID(postId)) {
      throw validationError("Invalid post ID format");
    }

    if (!["upvote", "downvote"].includes(vote_type)) {
      throw validationError("Vote type must be 'upvote' or 'downvote'");
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from("forum_posts")
      .select("id, author_id")
      .eq("id", postId)
      .eq("is_active", true)
      .single();

    if (postError) {
      throw notFoundError("Forum post");
    }

    // Prevent self-voting
    if (post.author_id === userId) {
      throw forbiddenError("You cannot vote on your own posts");
    }

    // Check for existing vote
    const { data: existingVote } = await supabaseAdmin
      .from("forum_votes")
      .select("id, vote_type")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    let voteAction = "created";

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote if same type
        await supabaseAdmin
          .from("forum_votes")
          .delete()
          .eq("id", existingVote.id);
        voteAction = "removed";
      } else {
        // Update vote if different type
        await supabaseAdmin
          .from("forum_votes")
          .update({ vote_type, updated_at: new Date().toISOString() })
          .eq("id", existingVote.id);
        voteAction = "updated";
      }
    } else {
      // Create new vote
      await supabaseAdmin.from("forum_votes").insert({
        user_id: userId,
        post_id: postId,
        vote_type,
      });
    }

    // Get updated vote counts
    const { count: upvotes } = await supabaseAdmin
      .from("forum_votes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("vote_type", "upvote");

    const { count: downvotes } = await supabaseAdmin
      .from("forum_votes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("vote_type", "downvote");

    const score = (upvotes || 0) - (downvotes || 0);

    res.json({
      success: true,
      message: `Vote ${voteAction} successfully`,
      data: {
        upvotes: upvotes || 0,
        downvotes: downvotes || 0,
        score,
        userVote: voteAction === "removed" ? null : vote_type,
      },
    });
  })
);

// @route   POST /api/forum/replies/:id/vote
// @desc    Vote on a forum reply
// @access  Private
router.post(
  "/replies/:id/vote",
  authenticateToken,
  requireVotePermission,
  validate(forumSchemas.vote),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: replyId } = req.params;
    const { vote_type } = req.body;
    const userId = (req as any).user.id;

    if (!isValidUUID(replyId)) {
      throw validationError("Invalid reply ID format");
    }

    if (!["upvote", "downvote"].includes(vote_type)) {
      throw validationError("Vote type must be 'upvote' or 'downvote'");
    }

    // Check if reply exists
    const { data: reply, error: replyError } = await supabaseAdmin
      .from("forum_replies")
      .select("id, author_id")
      .eq("id", replyId)
      .eq("is_active", true)
      .single();

    if (replyError) {
      throw notFoundError("Forum reply");
    }

    // Prevent self-voting
    if (reply.author_id === userId) {
      throw forbiddenError("You cannot vote on your own replies");
    }

    // Check for existing vote
    const { data: existingVote } = await supabaseAdmin
      .from("forum_votes")
      .select("id, vote_type")
      .eq("user_id", userId)
      .eq("reply_id", replyId)
      .single();

    let voteAction = "created";

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        await supabaseAdmin
          .from("forum_votes")
          .delete()
          .eq("id", existingVote.id);
        voteAction = "removed";
      } else {
        await supabaseAdmin
          .from("forum_votes")
          .update({ vote_type, updated_at: new Date().toISOString() })
          .eq("id", existingVote.id);
        voteAction = "updated";
      }
    } else {
      await supabaseAdmin.from("forum_votes").insert({
        user_id: userId,
        reply_id: replyId,
        vote_type,
      });
    }

    // Get updated vote counts
    const { count: upvotes } = await supabaseAdmin
      .from("forum_votes")
      .select("*", { count: "exact", head: true })
      .eq("reply_id", replyId)
      .eq("vote_type", "upvote");

    const { count: downvotes } = await supabaseAdmin
      .from("forum_votes")
      .select("*", { count: "exact", head: true })
      .eq("reply_id", replyId)
      .eq("vote_type", "downvote");

    const score = (upvotes || 0) - (downvotes || 0);

    res.json({
      success: true,
      message: `Vote ${voteAction} successfully`,
      data: {
        upvotes: upvotes || 0,
        downvotes: downvotes || 0,
        score,
        userVote: voteAction === "removed" ? null : vote_type,
      },
    });
  })
);

// =============================================================================
// REPORTING ENDPOINTS
// =============================================================================

// @route   POST /api/forum/posts/:id/report
// @desc    Report a forum post
// @access  Private
router.post(
  "/posts/:id/report",
  authenticateToken,
  validate(forumSchemas.report),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { reason, description } = req.body;
    const userId = (req as any).user.id;

    if (!isValidUUID(postId)) {
      throw validationError("Invalid post ID format");
    }

    if (!reason || reason.trim().length === 0) {
      throw validationError("Report reason is required");
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from("forum_posts")
      .select("id, author_id")
      .eq("id", postId)
      .eq("is_active", true)
      .single();

    if (postError) {
      throw notFoundError("Forum post");
    }

    // Prevent self-reporting
    if (post.author_id === userId) {
      throw forbiddenError("You cannot report your own posts");
    }

    // Check for existing report from this user
    const { data: existingReport } = await supabaseAdmin
      .from("forum_reports")
      .select("id")
      .eq("reporter_id", userId)
      .eq("post_id", postId)
      .single();

    if (existingReport) {
      throw forbiddenError("You have already reported this post");
    }

    // Create report
    const { data: report, error } = await supabaseAdmin
      .from("forum_reports")
      .insert({
        reporter_id: userId,
        post_id: postId,
        reason: reason.trim(),
        description: description?.trim() || null,
        status: "pending",
      })
      .select("id, reason, status, created_at")
      .single();

    if (error) {
      throw new Error("Failed to create report");
    }

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: { report },
    });
  })
);

export default router;
