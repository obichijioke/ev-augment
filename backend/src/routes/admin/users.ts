import express, { Request, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { supabaseAdmin } from "../../services/supabaseClient";
import { asyncHandler, createError } from "../../middleware/errorHandler";
import {
  authenticateToken,
  requireAdmin,
  requireModerator,
} from "../../middleware/auth";
import { validate } from "../../middleware/validation";
import Joi from "joi";

const router = express.Router();
router.use(authenticateToken);

const adminSchemas = {
  updateUser: Joi.object({
    role: Joi.string().valid("user", "moderator", "admin"),
    is_active: Joi.boolean(),
    is_verified: Joi.boolean(),
    is_banned: Joi.boolean(),
    notes: Joi.string().max(500),
  }),
  bulkUpdateUsers: Joi.object({
    user_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
    action: Joi.string()
      .valid("activate", "deactivate", "verify", "change_role", "ban", "unban")
      .required(),
    role: Joi.string().valid("user", "moderator", "admin").when("action", {
      is: "change_role",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    notes: Joi.string().max(500),
  }),
};

// GET /api/admin/users
router.get(
  "/users",
  requireModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "20",
      search = "",
      role = "",
      status = "",
      verified = "",
      banned = "",
      business = "",
      date_from = "",
      date_to = "",
      last_active_from = "",
      last_active_to = "",
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query as any;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from("users").select(
      `
        id,
        username,
        email,
        full_name,
        is_verified,
        is_business,
        business_name,
        avatar_url,
        created_at,
        updated_at,
        user_profiles!inner(
          role,
          is_active,
          is_banned
        )
      `,
      { count: "exact" }
    );

    // Filters
    if (search) {
      query = query.or(
        `username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }
    if (role) query = query.eq("user_profiles.role", role);
    if (status)
      query = query.eq("user_profiles.is_active", status === "active");
    if (verified) query = query.eq("is_verified", verified === "verified");
    if (banned)
      query = query.eq("user_profiles.is_banned", banned === "banned");
    if (business) query = query.eq("is_business", business === "business");

    // Date ranges (last_sign_in_at not available in users table here)
    if (date_from) query = query.gte("created_at", String(date_from));
    if (date_to) query = query.lte("created_at", String(date_to));

    // Sorting
    const ascending = String(sort_order) === "asc";
    const sortColumn = [
      "created_at",
      "updated_at",
      "username",
      "email",
    ].includes(String(sort_by))
      ? String(sort_by)
      : "created_at";
    query = query.order(sortColumn, { ascending });

    query = query.range(offset, offset + limitNum - 1);

    const { data: users, error, count } = await query;
    if (error) {
      console.error("[admin] users list query error:", error);
      throw createError(
        `Failed to fetch users: ${error.message || (error as any).details || (error as any).hint || "Unknown error"}`,
        500
      );
    }

    // Flatten profile fields
    const flattened = (users || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      is_verified: u.is_verified,
      is_business: u.is_business,
      business_name: u.business_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_sign_in_at: null,
      role: u.user_profiles?.role || null,
      is_active: u.user_profiles?.is_active ?? null,
      is_banned: u.user_profiles?.is_banned ?? null,
    }));

    res.json({
      success: true,
      data: {
        users: flattened,
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

// GET /api/admin/users/:id
router.get(
  "/users/:id",
  requireModerator,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as any;

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        username,
        email,
        full_name,
        is_verified,
        is_business,
        business_name,
        avatar_url,
        created_at,
        updated_at,
        user_profiles!inner(
          role,
          is_active,
          is_banned
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !user) throw createError("User not found", 404);

    res.json({ success: true, data: { user } });
  })
);

// GET /api/admin/users/stats (Admin only)
router.get(
  "/users/stats",
  requireAdmin,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // Example aggregated stats (replace with real views if available)
    const { data: totals } = await supabaseAdmin
      .from("user_profiles")
      .select("role, count: id", { head: false, count: "exact" });

    res.json({ success: true, data: { totals: totals || [] } });
  })
);

// PUT /api/admin/users/:id (Admin only)
router.put(
  "/users/:id",
  requireAdmin,
  validate(adminSchemas.updateUser),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as any;
    const { role, is_active, is_verified, is_banned } = req.body as any;

    // Only admins can change roles; ensure role updates write to user_profiles.role
    const profileUpdates: any = {};
    const userUpdates: any = {};
    if (typeof is_active === "boolean") profileUpdates.is_active = is_active;
    if (typeof is_banned === "boolean") profileUpdates.is_banned = is_banned;
    if (typeof is_verified === "boolean") userUpdates.is_verified = is_verified;

    if (role) {
      // Update role in user_profiles only
      const { error: roleErr } = await supabaseAdmin
        .from("user_profiles")
        .update({ role })
        .eq("id", id);
      if (roleErr) throw createError("Failed to update role", 500);
    }

    if (Object.keys(profileUpdates).length) {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update(profileUpdates)
        .eq("id", id);
      if (error) throw createError("Failed to update user", 500);
    }

    if (Object.keys(userUpdates).length) {
      const { error } = await supabaseAdmin
        .from("users")
        .update(userUpdates)
        .eq("id", id);
      if (error) throw createError("Failed to update user data", 500);
    }

    res.json({
      success: true,
      data: { id, ...profileUpdates, ...userUpdates, role },
    });
  })
);

// POST /api/admin/users/bulk (Admin only)
router.post(
  "/users/bulk",
  requireAdmin,
  validate(adminSchemas.bulkUpdateUsers),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_ids, action, role } = req.body as any;

    const ids = user_ids as string[];
    if (!Array.isArray(ids) || ids.length === 0)
      throw createError("No users selected", 400);

    if (action === "change_role") {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ role })
        .in("id", ids);
      if (error) throw createError("Failed to change roles", 500);
    }
    if (action === "activate" || action === "deactivate") {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ is_active: action === "activate" })
        .in("id", ids);
      if (error) throw createError("Failed to update active state", 500);
    }
    if (action === "verify") {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ is_verified: true })
        .in("id", ids);
      if (error) throw createError("Failed to verify users", 500);
    }
    if (action === "ban" || action === "unban") {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ is_banned: action === "ban" })
        .in("id", ids);
      if (error) throw createError("Failed to update ban state", 500);
    }

    res.json({ success: true, data: { updated: ids.length } });
  })
);

// GET /api/admin/users/export (Admin only)
router.get(
  "/users/export",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { format = "csv", search = "" } = req.query as any;

    let query = supabaseAdmin.from("users").select(
      `
        id,
        username,
        email,
        full_name,
        is_verified,
        is_business,
        business_name,
        avatar_url,
        created_at,
        updated_at,
        user_profiles!inner(
          role,
          is_active,
          is_banned
        )
      `
    );
    if (search)
      query = query.or(
        `username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`
      );

    const { data: users, error } = await query;
    if (error) throw createError("Failed to export users", 500);

    // Flatten before export to include profile fields
    const flattened = (users || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      is_verified: u.is_verified,
      is_business: u.is_business,
      business_name: u.business_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      updated_at: u.updated_at,
      role: u.user_profiles?.role || null,
      is_active: u.user_profiles?.is_active ?? null,
      is_banned: u.user_profiles?.is_banned ?? null,
    }));

    if (format === "csv") {
      const header = Object.keys(flattened?.[0] || {}).join(",");
      const rows = (flattened || []).map((u: any) =>
        Object.values(u)
          .map((v) =>
            v === null || v === undefined ? "" : String(v).replace(/\n/g, " ")
          )
          .join(",")
      );
      const csvContent = [header, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`
      );
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: {
          users: flattened,
          exported_at: new Date().toISOString(),
          total_count: flattened?.length || 0,
        },
      });
    }
  })
);

export default router;
