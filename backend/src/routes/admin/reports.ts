import express, { Request, Response } from "express";
import { supabaseAdmin } from "../../services/supabaseClient";
import { authenticateToken, requireModerator } from "../../middleware/auth";
import { asyncHandler, createError } from "../../middleware/errorHandler";
import Joi from "joi";
import { validate } from "../../middleware/validation";

const router = express.Router();
router.use(authenticateToken);

const adminSchemas = {
  resolveReport: Joi.object({
    action_taken: Joi.string().required(),
    notes: Joi.string().max(1000),
  }),
};

// GET /api/admin/reports
router.get(
  "/reports",
  requireModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "20",
      status = "",
      type = "",
      priority = "",
    } = req.query as any;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from("reports").select("*", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("content_type", type);
    if (priority) query = query.eq("priority", priority);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);
    const { data: reports, error, count } = await query;
    if (error) throw createError("Failed to fetch reports", 500);

    res.json({
      success: true,
      data: {
        reports,
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

// PUT /api/admin/reports/:id/resolve
router.put(
  "/reports/:id/resolve",
  requireModerator,
  validate(adminSchemas.resolveReport),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const { action_taken, notes } = req.body as any;

    const { data: updated, error } = await supabaseAdmin
      .from("reports")
      .update({ status: "resolved", action_taken, notes })
      .eq("id", id)
      .select()
      .single();

    if (error) throw createError("Failed to resolve report", 500);

    res.json({ success: true, data: updated });
  })
);

export default router;
