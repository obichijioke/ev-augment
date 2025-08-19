import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth";
import { supabaseAdmin } from "../../services/supabaseClient";
import { asyncHandler, createError } from "../../middleware/errorHandler";

const router = express.Router();
router.use(authenticateToken);

// GET /api/admin/logs
router.get(
  "/logs",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      limit = "50",
      admin_id = "",
      action_type = "",
      target_type = "",
    } = req.query as any;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" });
    if (admin_id) query = query.eq("admin_id", admin_id);
    if (action_type) query = query.eq("action_type", action_type);
    if (target_type) query = query.eq("target_type", target_type);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);
    const { data: logs, error, count } = await query;
    if (error) throw createError("Failed to fetch logs", 500);

    res.json({
      success: true,
      data: {
        logs,
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

export default router;
