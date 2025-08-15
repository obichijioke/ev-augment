import express, { Request, Response } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../../services/supabaseClient";
import {
  asyncHandler,
  createError,
  validationError,
} from "../../middleware/errorHandler";
import {
  authenticateToken,
  requireModerator,
  requireAdmin,
} from "../../middleware/auth";
import Joi from "joi";

const router = express.Router();
router.use(authenticateToken);
router.use(requireModerator);

// Schemas
const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(""),
  status: Joi.string().valid("draft", "published", "archived"),
  category: Joi.string().allow(""),
  author: Joi.string().uuid().allow(""),
  sort_by: Joi.string().valid(
    "created_at",
    "updated_at",
    "published_at",
    "title",
    "views"
  ),
  sort_order: Joi.string().valid("asc", "desc").default("desc"),
});

const updateSchema = Joi.object({
  title: Joi.string().max(200),
  slug: Joi.string().max(255),
  excerpt: Joi.string().allow(""),
  content: Joi.string(),
  featured_image: Joi.string().allow(""),
  category: Joi.string().allow(""),
  tags: Joi.array().items(Joi.string()),
  status: Joi.string().valid("draft", "published", "archived"),
  is_featured: Joi.boolean(),
  published_at: Joi.date().iso().allow(null),
});

const bulkSchema = Joi.object({
  post_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action: Joi.string()
    .valid("publish", "unpublish", "archive", "feature", "unfeature", "delete")
    .required(),
});

// GET /api/admin/blog/posts
router.get(
  "/blog/posts",
  asyncHandler(async (req: Request, res: Response) => {
    const { value, error } = listSchema.validate(req.query);
    if (error) throw validationError(error.message);

    const {
      page,
      limit,
      search,
      status,
      category,
      author,
      sort_by,
      sort_order,
    } = value as any;
    const { from, to } = buildPagination(page, limit);

    let query = supabaseAdmin
      .from("blog_posts")
      .select(
        `
        *,
        users:users!blog_posts_author_id_fkey(id, username, full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .range(from, to);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`
      );
    }
    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (author) query = query.eq("author_id", author);

    // Map friendly sort keys to actual columns
    const sortField =
      (sort_by === "views" ? "view_count" : sort_by) || "updated_at";
    const ascending = (sort_order || "desc") === "asc";
    query = query.order(sortField, { ascending });

    const { data: posts, error: qErr, count } = await query;
    if (qErr) {
      throw createError(`Failed to fetch posts: ${qErr.message}`, 500);
    }

    res.json({
      success: true,
      data: {
        posts: posts || [],
        pagination: buildPaginationMetadata(page, limit, count || 0),
      },
    });
  })
);

// PUT /api/admin/blog/posts/:id
router.put(
  "/blog/posts/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as any;
    if (!isValidUUID(id)) throw validationError("Invalid post ID format");

    const { value, error } = updateSchema.validate(req.body);
    if (error) throw validationError(error.message);

    const updateData: any = { ...value, updated_at: new Date().toISOString() };

    if (updateData.status === "published" && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    if (updateData.slug) {
      const { data: slugExists } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", updateData.slug)
        .neq("id", id)
        .single();
      if (slugExists) throw validationError("Slug already exists");
    }

    const { data: post, error: uErr } = await supabaseAdmin
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        users:users!blog_posts_author_id_fkey(id, username, full_name, avatar_url)
      `
      )
      .single();

    if (uErr) throw createError("Failed to update post", 500);

    res.json({ success: true, data: { post } });
  })
);

// DELETE /api/admin/blog/posts/:id
router.delete(
  "/blog/posts/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as any;
    if (!isValidUUID(id)) throw validationError("Invalid post ID format");

    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", id);
    if (error) throw createError("Failed to delete post", 500);

    res.json({ success: true, message: "Post deleted" });
  })
);

// POST /api/admin/blog/posts/bulk
router.post(
  "/blog/posts/bulk",
  asyncHandler(async (req: Request, res: Response) => {
    const { value, error } = bulkSchema.validate(req.body);
    if (error) throw validationError(error.message);

    const { post_ids, action } = value as {
      post_ids: string[];
      action: string;
    };

    if (action === "delete") {
      const { error: dErr } = await supabaseAdmin
        .from("blog_posts")
        .delete()
        .in("id", post_ids);
      if (dErr) throw createError("Failed to delete posts", 500);
      return res.json({ success: true, data: { updated: post_ids.length } });
    }

    const updates: any = {};
    if (action === "publish") {
      updates.status = "published";
      updates.published_at = new Date().toISOString();
    }
    if (action === "unpublish") {
      updates.status = "draft";
      updates.published_at = null;
    }
    if (action === "archive") updates.status = "archived";
    if (action === "feature") updates.is_featured = true;
    if (action === "unfeature") updates.is_featured = false;

    const { error: bErr } = await supabaseAdmin
      .from("blog_posts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in("id", post_ids);
    if (bErr) throw createError("Failed to update posts", 500);

    res.json({ success: true, data: { updated: post_ids.length } });
  })
);

export default router;
