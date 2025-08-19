import express, { Router } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { validate, blogSchemas, commonSchemas } from "../middleware/validation";
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
} from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  BlogPost,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";
import { toString, toNumber } from "../utils/typeUtils";
import { reqIsModerator, reqIsOwner } from "../utils/roleUtils";

// TypeScript interfaces removed to fix compilation errors

const router: Router = express.Router();

// @route   GET /api/blog
// @desc    Get blog API information
// @access  Public
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "Blog API is running",
      endpoints: {
        posts: "/api/blog/posts",
        categories: "/api/blog/categories",
        tags: "/api/blog/tags",
        search: "/api/blog/search",
        author: "/api/blog/author/:authorId",
      },
    });
  })
);

// @route   GET /api/blog/posts
// @desc    Get all blog posts
// @access  Public
router.get(
  "/posts",
  optionalAuth,
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { page, limit, category, tag, author, sort, sortBy, q, status } =
      req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    let query = supabaseAdmin
      .from("blog_posts")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .range(from, to);

    // Only show published posts for non-moderators (cached role)
    const isModerator = reqIsModerator(req as any);
    if (!isModerator) {
      query = query.eq("status", "published");
    } else if (status) {
      query = query.eq("status", status);
    }

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }
    if (author && isValidUUID(author)) {
      query = query.eq("author_id", author);
    }
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`
      );
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "published_at",
      "updated_at",
      "views",
      "title",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "published_at";
    const sortOrder =
      sort === "asc" ? { ascending: true } : { ascending: false };

    query = query.order(sortField, sortOrder);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
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
      },
    });
  })
);

// @route   POST /api/blog/posts
// @desc    Create a new blog post
// @access  Private (Moderator only)
router.post(
  "/posts",
  authenticateToken,
  requireModerator,
  validate(blogSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const postData = {
      ...req.body,
      author_id: (req.user as any).id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set published_at if status is published
    if (postData.status === "published" && !postData.published_at) {
      postData.published_at = new Date().toISOString();
    }

    // Generate slug if not provided
    if (!postData.slug) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Check if slug is unique
    const { data: existingPost } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", postData.slug)
      .single();

    if (existingPost) {
      postData.slug = `${postData.slug}-${Date.now()}`;
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert(postData)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to create blog post");
    }

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: {
        post,
      },
    });
  })
);

// @route   GET /api/blog/posts/:slug
// @desc    Get blog post by slug
// @access  Public
router.get(
  "/posts/:slug",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { slug } = req.params;

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified, bio)
    `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      throw notFoundError("Blog post");
    }

    // Check if user can view this post (cached role)
    const isModerator = reqIsModerator(req as any);
    const isAuthor = req.user && (req.user as any).id === post.author_id;

    if (post.status !== "published" && !isModerator && !isAuthor) {
      throw notFoundError("Blog post");
    }

    // Increment view count (only for published posts and if not the author)
    if (
      post.status === "published" &&
      (!req.user || (req.user as any).id !== post.author_id)
    ) {
      await supabaseAdmin
        .from("blog_posts")
        .update({ views: (post.views || 0) + 1 })
        .eq("slug", slug);

      post.views = (post.views || 0) + 1;
    }

    // Get related posts (same category, excluding current post)
    const { data: relatedPosts } = await supabaseAdmin
      .from("blog_posts")
      .select("id, title, slug, excerpt, featured_image, published_at")
      .eq("category", post.category)
      .eq("status", "published")
      .neq("id", post.id)
      .limit(3)
      .order("published_at", { ascending: false });

    // Get author's other posts
    const { data: authorPosts } = await supabaseAdmin
      .from("blog_posts")
      .select("id, title, slug, excerpt, featured_image, published_at")
      .eq("author_id", post.author_id)
      .eq("status", "published")
      .neq("id", post.id)
      .limit(3)
      .order("published_at", { ascending: false });

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          author: {
            ...post.users,
            other_posts: authorPosts || [],
          },
        },
        related_posts: relatedPosts || [],
      },
    });
  })
);

// @route   PUT /api/blog/posts/:id
// @desc    Update blog post
// @access  Private (Author or Moderator)
router.put(
  "/posts/:id",
  authenticateToken,
  validate(blogSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists and get author
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from("blog_posts")
      .select("author_id, slug")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Blog post");
    }

    // Check permissions (author or moderator)
    const isAuthor = reqIsOwner(req as any, existingPost.author_id);

    // Use cached user role
    const userRole = ((req as any).userRole as string) || "user";
    const isModerator = reqIsModerator(req as any);

    // Debug logging
    console.log("Blog edit permission check:", {
      userId: (req.user as any).id,
      postAuthorId: existingPost.author_id,
      isAuthor,
      userRole,
      isModerator,
      canEdit: isAuthor || isModerator,
    });

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only edit your own posts");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // Set published_at if status is being changed to published
    if (updateData.status === "published" && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    // Handle slug update
    if (updateData.slug && updateData.slug !== existingPost.slug) {
      // Check if new slug is unique
      const { data: slugExists } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", updateData.slug)
        .neq("id", id)
        .single();

      if (slugExists) {
        throw validationError("Slug already exists");
      }
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to update blog post");
    }

    res.json({
      success: true,
      message: "Blog post updated successfully",
      data: {
        post,
      },
    });
  })
);

// @route   DELETE /api/blog/posts/:id
// @desc    Delete blog post
// @access  Private (Author or Moderator)
router.delete(
  "/posts/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists and get author
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from("blog_posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Blog post");
    }

    // Check permissions (author or moderator)
    const isAuthor = reqIsOwner(req as any, existingPost.author_id);

    // Use cached user role
    const userRole = ((req as any).userRole as string) || "user";
    const isModerator = reqIsModerator(req as any);

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only delete your own posts");
    }

    // Hard delete the post and its comments
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete blog post");
    }

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  })
);

// @route   GET /api/blog/posts/by-id/:id
// @desc    Get a single blog post by ID (for editing)
// @access  Private (Author or Moderator)
router.get(
  "/posts/by-id/:id",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .eq("id", id)
      .single();

    if (error || !post) {
      throw notFoundError("Blog post");
    }

    // Check if user can view this post (cached role)
    const isModerator = reqIsModerator(req as any);
    const isAuthor = req.user && (req.user as any).id === post.author_id;

    if (post.status !== "published" && !isModerator && !isAuthor) {
      throw notFoundError("Blog post");
    }

    // Transform the post data
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      category: post.category,
      tags: post.tags || [],
      status: post.status,
      is_featured: post.is_featured,
      view_count: post.view_count || 0,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.users.id || post.author_id,
        username: post.users.username,
        full_name: post.users.full_name,
        avatar_url: post.users.avatar_url,
        is_verified: post.users.is_verified,
      },
    };

    res.json({
      success: true,
      data: { post: transformedPost },
    });
  })
);

// @route   GET /api/blog/posts/:id/comments
// @desc    Get comments for a blog post
// @access  Public
router.get(
  "/posts/:id/comments",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(id)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from("blog_posts")
      .select("id, status")
      .eq("id", id)
      .single();

    if (postError) {
      throw notFoundError("Blog post");
    }

    // Only show comments for published posts
    if (post.status !== "published") {
      throw notFoundError("Blog post");
    }

    const {
      data: comments,
      error,
      count,
    } = await supabaseAdmin
      .from("blog_comments")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("post_id", id)
      .eq("is_approved", true)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error("Failed to fetch comments");
    }

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: toNumber(page, 1),
          limit: toNumber(limit, 20),
          total: count,
          pages: Math.ceil(count / toNumber(limit, 20)),
        },
      },
    });
  })
);

// @route   POST /api/blog/posts/:id/comments
// @desc    Create a comment on a blog post
// @access  Private
router.post(
  "/posts/:id/comments",
  authenticateToken,
  validate(blogSchemas.createComment),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id: postId } = req.params;

    if (!isValidUUID(postId)) {
      throw validationError("Invalid post ID format");
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from("blog_posts")
      .select("id, status")
      .eq("id", postId)
      .single();

    if (postError) {
      throw notFoundError("Blog post");
    }

    if (post.status !== "published") {
      throw forbiddenError("Cannot comment on unpublished posts");
    }

    // For now, allow comments on all published posts
    // TODO: Add allow_comments column to blog_posts table if needed

    const commentData = {
      ...req.body,
      post_id: postId,
      author_id: (req.user as any).id,
      is_approved: true, // Auto-approve for now, can be changed to require moderation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: comment, error } = await supabaseAdmin
      .from("blog_comments")
      .insert(commentData)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to create comment");
    }

    // Update post's comment count
    await supabaseAdmin.rpc("increment_blog_comment_count", {
      post_id: postId,
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: {
        comment,
      },
    });
  })
);

// @route   PUT /api/blog/comments/:id
// @desc    Update blog comment
// @access  Private (Author or Moderator)
router.put(
  "/comments/:id",
  authenticateToken,
  validate(blogSchemas.updateComment),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid comment ID format");
    }

    // Check if comment exists and get author
    const { data: existingComment, error: checkError } = await supabaseAdmin
      .from("blog_comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Blog comment");
    }

    // Check permissions (author or moderator) using cached role
    const isAuthor = reqIsOwner(req as any, existingComment.author_id);
    const isModerator = reqIsModerator(req as any);

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only edit your own comments");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // Only moderators can change approval status
    if (!isModerator) {
      delete updateData.is_approved;
    }

    const { data: comment, error } = await supabaseAdmin
      .from("blog_comments")
      .update(updateData)
      .eq("id", id)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to update comment");
    }

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment,
      },
    });
  })
);

// @route   DELETE /api/blog/comments/:id
// @desc    Delete blog comment
// @access  Private (Author or Moderator)
router.delete(
  "/comments/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid comment ID format");
    }

    // Check if comment exists and get author
    const { data: existingComment, error: checkError } = await supabaseAdmin
      .from("blog_comments")
      .select("author_id, post_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Blog comment");
    }

    // Check permissions (author or moderator)
    const isAuthor = reqIsOwner(req as any, existingComment.author_id);

    // Use cached user role
    const userRole = ((req as any).userRole as string) || "user";
    const isModerator = reqIsModerator(req as any);

    if (!isAuthor && !isModerator) {
      throw forbiddenError("You can only delete your own comments");
    }

    const { error } = await supabaseAdmin
      .from("blog_comments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete comment");
    }

    // Update post's comment count
    await supabaseAdmin.rpc("decrement_blog_comment_count", {
      post_id: existingComment.post_id,
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  })
);

// @route   GET /api/blog/categories
// @desc    Get all blog categories
// @access  Public
router.get(
  "/categories",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { data: categories, error } = await supabaseAdmin
      .from("blog_posts")
      .select("category")
      .eq("status", "published");

    if (error) {
      throw new Error("Failed to fetch categories");
    }

    // Get unique categories with post counts
    const categoryMap = {};
    categories.forEach((item) => {
      if (item.category) {
        categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
      }
    });

    const categoriesArray = Object.keys(categoryMap)
      .map((category) => ({
        name: category,
        post_count: categoryMap[category],
      }))
      .sort((a, b) => b.post_count - a.post_count);

    res.json({
      success: true,
      data: {
        categories: categoriesArray,
      },
    });
  })
);

// @route   GET /api/blog/tags
// @desc    Get all blog tags
// @access  Public
router.get(
  "/tags",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { data: posts, error } = await supabaseAdmin
      .from("blog_posts")
      .select("tags")
      .eq("status", "published")
      .not("tags", "is", null);

    if (error) {
      throw new Error("Failed to fetch tags");
    }

    // Flatten and count tags
    const tagMap = {};
    posts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        });
      }
    });

    const tagsArray = Object.keys(tagMap)
      .map((tag) => ({
        name: tag,
        post_count: tagMap[tag],
      }))
      .sort((a, b) => b.post_count - a.post_count);

    res.json({
      success: true,
      data: {
        tags: tagsArray,
      },
    });
  })
);

// @route   GET /api/blog/search
// @desc    Search blog posts
// @access  Public
router.get(
  "/search",
  validate(commonSchemas.search, "query"),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { q, category, tag, page = "1", limit = "20" } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!q || (q as string).trim().length < 2) {
      throw validationError("Search query must be at least 2 characters long");
    }

    let query = supabaseAdmin
      .from("blog_posts")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("status", "published")
      .or(`title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq("category", category);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      throw new Error("Failed to search blog posts");
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

// @route   GET /api/blog/author/:authorId
// @desc    Get posts by author
// @access  Public
router.get(
  "/author/:authorId",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { authorId } = req.params;
    const { page, limit } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(authorId)) {
      throw validationError("Invalid author ID format");
    }

    const {
      data: posts,
      error,
      count,
    } = await supabaseAdmin
      .from("blog_posts")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified, bio)
    `,
        { count: "exact" }
      )
      .eq("author_id", authorId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error("Failed to fetch author posts");
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
      },
    });
  })
);

export default router;
