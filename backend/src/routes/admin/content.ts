import express, { Response } from "express";
import { authenticateToken, requireModerator } from "../../middleware/auth";
import { asyncHandler, createError } from "../../middleware/errorHandler";
import { supabaseAdmin } from "../../services/supabaseClient";
import { AuthenticatedRequest } from "../../types";

const router = express.Router();
router.use(authenticateToken);

// GET /api/admin/content/pending
router.get(
  "/content/pending",
  requireModerator,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, page = "1", limit = "20" } = req.query as any;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const result: any = { pending_content: {} };

    if (!type || type === "marketplace") {
      const { data: listings } = await supabaseAdmin
        .from("marketplace_listings")
        .select("*, seller:users(id, username)", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(from, to);

      result.pending_content.marketplace_listings = {
        total: listings?.length || 0,
        page: Number(page),
        limit: Number(limit),
        items: listings || [],
      };
    }

    if (!type || type === "directory") {
      const { data: directory } = await supabaseAdmin
        .from("directory_businesses")
        .select("*, owner:users(id, username)", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(from, to);

      result.pending_content.directory_listings = {
        total: directory?.length || 0,
        page: Number(page),
        limit: Number(limit),
        items: directory || [],
      };
    }

    res.json({ success: true, data: result });
  })
);

// PUT /api/admin/content/:type/:id/approve
router.put(
  "/content/:type/:id/approve",
  requireModerator,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, id } = req.params as any;
    const { notes } = req.body as any;

    let table: string;
    switch (type) {
      case "marketplace":
        table = "marketplace_listings";
        break;
      case "directory":
        table = "directory_businesses";
        break;
      default:
        throw createError("Invalid content type", 400);
    }

    const { data: content, error } = await supabaseAdmin
      .from(table)
      .update({ status: "active", admin_notes: notes || null })
      .eq("id", id)
      .select()
      .single();

    if (error) throw createError("Failed to approve content", 500);

    res.json({ success: true, data: content });
  })
);

// PUT /api/admin/content/:type/:id/reject
router.put(
  "/content/:type/:id/reject",
  requireModerator,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, id } = req.params as any;
    const { reason, notes } = req.body as any;

    let table: string;
    switch (type) {
      case "marketplace":
        table = "marketplace_listings";
        break;
      case "directory":
        table = "directory_businesses";
        break;
      default:
        throw createError("Invalid content type", 400);
    }

    const { data: content, error } = await supabaseAdmin
      .from(table)
      .update({
        status: "rejected",
        rejection_reason: reason || null,
        admin_notes: notes || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw createError("Failed to reject content", 500);

    res.json({ success: true, data: content });
  })
);

export default router;
