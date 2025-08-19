import express, { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { asyncHandler, createError } from "../../middleware/errorHandler";
import { requireModerator, authenticateToken } from "../../middleware/auth";
import { supabaseAdmin } from "../../services/supabaseClient";
import { validate } from "../../middleware/validation";
import Joi from "joi";

const router = express.Router();
router.use(authenticateToken);

const adminSchemas = {
  updateThread: Joi.object({
    title: Joi.string().min(1).max(200),
    content: Joi.string().min(1),
    category_id: Joi.string().uuid(),
    is_pinned: Joi.boolean(),
    is_locked: Joi.boolean(),
    is_deleted: Joi.boolean(),
    admin_notes: Joi.string().max(500),
  }),
  bulkUpdateThreads: Joi.object({
    thread_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
    action: Joi.string()
      .valid("pin", "unpin", "lock", "unlock", "delete", "restore", "move_category")
      .required(),
    category_id: Joi.string().uuid().when("action", {
      is: "move_category",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    admin_notes: Joi.string().max(500),
  }),
};

// GET /api/admin/forum/threads
router.get(
  "/forum/threads",
  requireModerator,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "20",
      search = "",
      category = "",
      status = "",
      author = "",
      sort = "created_at",
      order = "desc",
    } = req.query as any;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Use denormalized view
    let query = supabaseAdmin.from("forum_thread_list").select("*", { count: "exact" });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (category) query = query.eq("category_id", category);
    if (status) {
      switch (status) {
        case "active":
          query = query.eq("is_deleted", false);
          break;
        case "deleted":
          query = query.eq("is_deleted", true);
          break;
        case "pinned":
          query = query.eq("is_pinned", true);
          break;
        case "locked":
          query = query.eq("is_locked", true);
          break;
      }
    }
    if (author) query = query.eq("author_id", author);

    const ascending = order === "asc";
    const sortColumn = [
      "created_at",
      "updated_at",
      "view_count",
      "reply_count",
      "like_count",
      "last_reply_at",
    ].includes(String(sort))
      ? String(sort)
      : "created_at";
    query = query.order(sortColumn, { ascending });

    query = query.range(offset, offset + limitNum - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      console.error("[admin] forum/threads query error:", error);
      throw createError(`Failed to fetch threads: ${error.message || (error as any).details || (error as any).hint || "Unknown error"}`, 500);
    }

    const transformedThreads = threads?.map((thread: any) => ({
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      content: thread.content,
      is_pinned: thread.is_pinned,
      is_locked: thread.is_locked,
      is_deleted: thread.is_deleted,
      view_count: thread.view_count,
      reply_count: thread.reply_count,
      like_count: thread.like_count,
      last_reply_at: thread.last_reply_at,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      author: {
        id: thread.author_id,
        username: thread.author_username,
        full_name: thread.author_name,
        avatar_url: thread.author_avatar,
      },
      category: {
        id: thread.category_id,
        name: thread.category_name,
        slug: thread.category_slug,
        color: thread.category_color,
        icon: thread.category_icon,
      },
    }));

    res.json({
      success: true,
      data: {
        threads: transformedThreads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitNum),
        },
      },
    });
  })
);

// PUT /api/admin/forum/threads/:id
router.put(
  "/forum/threads/:id",
  requireModerator,
  validate(adminSchemas.updateThread),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as any;
    const updateData = req.body;

    // Ensure valid fields
    const allowed = [
      "title",
      "content",
      "category_id",
      "is_pinned",
      "is_locked",
      "is_deleted",
    ];
    const payload: any = {};
    for (const k of allowed) if (k in updateData) payload[k] = (updateData as any)[k];

    const { data: updatedThread, error } = await supabaseAdmin
      .from("forum_threads")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw createError("Failed to update thread", 500);

    res.json({ success: true, data: updatedThread });
  })
);

// POST /api/admin/forum/threads/bulk
router.post(
  "/forum/threads/bulk",
  requireModerator,
  validate(adminSchemas.bulkUpdateThreads),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { thread_ids, action, category_id } = req.body as any;

    let update: any = {};
    switch (action) {
      case "pin":
        update.is_pinned = true;
        break;
      case "unpin":
        update.is_pinned = false;
        break;
      case "lock":
        update.is_locked = true;
        break;
      case "unlock":
        update.is_locked = false;
        break;
      case "delete":
        update.is_deleted = true;
        break;
      case "restore":
        update.is_deleted = false;
        break;
      case "move_category":
        update.category_id = category_id;
        break;
    }

    const { error } = await supabaseAdmin
      .from("forum_threads")
      .update(update)
      .in("id", thread_ids);

    if (error) throw createError("Failed to perform bulk action", 500);

    res.json({ success: true, data: { updated: thread_ids.length } });
  })
);

export default router;

