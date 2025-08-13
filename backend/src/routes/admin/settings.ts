import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth";
import { supabaseAdmin } from "../../services/supabaseClient";
import { asyncHandler, createError } from "../../middleware/errorHandler";

const router = express.Router();
router.use(authenticateToken);

// GET /api/admin/system/settings
router.get(
  "/system/settings",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { data: settings, error } = await supabaseAdmin.from("system_settings").select("*");
    if (error) throw createError("Failed to fetch settings", 500);
    res.json({ success: true, data: settings });
  })
);

// PUT /api/admin/system/settings
router.put(
  "/system/settings",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { settings } = req.body as any;
    if (!Array.isArray(settings)) {
      throw createError("Invalid settings payload", 400);
    }
    for (const s of settings) {
      await supabaseAdmin.from("system_settings").upsert({ key: s.key, value: s.value });
    }
    res.json({ success: true, data: { updated: settings.length } });
  })
);

export default router;

