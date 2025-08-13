import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/errorHandler";

const router = express.Router();
router.use(authenticateToken);

// GET /api/admin/analytics
router.get(
  "/analytics",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { timeframe = "30d", metric } = req.query as any;
    // Placeholder analytics; plug into real service later
    res.json({ success: true, data: { analytics: { timeframe, metric, series: [] } } });
  })
);

export default router;

