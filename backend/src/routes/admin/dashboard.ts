import express from "express";
import { AuthenticatedRequest } from "../../types";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireModerator, authenticateToken } from "../../middleware/auth";
import { supabaseAdmin } from "../../services/supabaseClient";

const router = express.Router();

// All admin subroutes require auth
router.use(authenticateToken);

// GET /api/admin/dashboard
router.get(
  "/dashboard",
  requireModerator,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { timeframe = "30d" } = req.query as any;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (timeframe) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Users
    const { data: usersAgg } = await supabaseAdmin
      .from("users")
      .select("id, created_at", { count: "exact" })
      .gte("created_at", startDate.toISOString());

    const { data: activeUsers } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("is_active", true);

    // Content counts
    const { data: vehiclesAgg } = await supabaseAdmin
      .from("vehicles")
      .select("id, created_at", { count: "exact" })
      .gte("created_at", startDate.toISOString());

    const { data: listingsAgg } = await supabaseAdmin
      .from("marketplace_listings")
      .select("id, created_at", { count: "exact" })
      .gte("created_at", startDate.toISOString());

    const { data: postsAgg } = await supabaseAdmin
      .from("forum_posts")
      .select("id, created_at", { count: "exact" })
      .gte("created_at", startDate.toISOString());

    // Moderation queues
    const { data: pendingListings } = await supabaseAdmin
      .from("marketplace_listings")
      .select("id")
      .eq("status", "pending");

    const { data: pendingDirectory } = await supabaseAdmin
      .from("directory_listings")
      .select("id")
      .eq("status", "pending");

    const { data: reports } = await supabaseAdmin
      .from("reports")
      .select("id")
      .eq("status", "pending");

    // Revenue (placeholder sums)
    const { data: txs } = await supabaseAdmin
      .from("transactions")
      .select("amount, created_at")
      .gte("created_at", startDate.toISOString());

    const revenueTotal = (txs || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: usersAgg?.length || 0,
            new: usersAgg?.length || 0,
            active: activeUsers?.length || 0,
          },
          content: {
            vehicles: { total: vehiclesAgg?.length || 0, new: vehiclesAgg?.length || 0 },
            marketplace_listings: { total: listingsAgg?.length || 0, new: listingsAgg?.length || 0 },
            forum_posts: { total: postsAgg?.length || 0, new: postsAgg?.length || 0 },
          },
          moderation: {
            pending_listings: pendingListings?.length || 0,
            pending_directory: pendingDirectory?.length || 0,
            reported_content: reports?.length || 0,
          },
          revenue: { total: revenueTotal, recent: revenueTotal },
          timeframe,
        },
      },
    });
  })
);

export default router;

