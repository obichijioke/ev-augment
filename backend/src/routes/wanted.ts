import express, { Router, Request, Response } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import {
  validate,
  wantedSchemas,
  commonSchemas,
} from "../middleware/validation";
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
} from "../middleware/auth";
import { reqIsOwner } from "../utils/roleUtils";

import { AuthenticatedRequest } from "../types";
import { toString, toNumber } from "../utils/typeUtils";
import {
  WantedAd,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";

const router: Router = express.Router();

// @route   GET /api/wanted
// @desc    Get all wanted ads
// @access  Public
router.get(
  "/",
  optionalAuth,
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page,
      limit,
      category,
      subcategory,
      min_budget,
      max_budget,
      location,
      sort,
      sortBy,
      q,
    } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    let query = supabaseAdmin
      .from("wanted_ads")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified, join_date)
    `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .range(from, to);

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }
    if (subcategory) {
      query = query.eq("subcategory", subcategory);
    }
    if (min_budget) {
      query = query.gte("budget_max", parseFloat(toString(min_budget)));
    }
    if (max_budget) {
      query = query.lte("budget_min", parseFloat(toString(max_budget)));
    }
    if (location) {
      query = query.ilike("location", `%${location}%`);
    }
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`
      );
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "budget_max",
      "views",
      "title",
      "expires_at",
    ];
    const sortField = validSortFields.includes(toString(sortBy))
      ? toString(sortBy)
      : "created_at";
    const sortOrder =
      sort === "asc" ? { ascending: true } : { ascending: false };

    query = query.order(sortField, sortOrder);

    const { data: wantedAds, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch wanted ads");
    }

    res.json({
      success: true,
      data: {
        wanted_ads: wantedAds,
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

// @route   POST /api/wanted
// @desc    Create a new wanted ad
// @access  Private
router.post(
  "/",
  authenticateToken,
  validate(wantedSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const wantedAdData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set expiration date if not provided (default 30 days)
    if (!wantedAdData.expires_at) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      wantedAdData.expires_at = expirationDate.toISOString();
    }

    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
      .insert(wantedAdData)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to create wanted ad");
    }

    res.status(201).json({
      success: true,
      message: "Wanted ad created successfully",
      data: {
        wanted_ad: wantedAd,
      },
    });
  })
);

// @route   GET /api/wanted/:id
// @desc    Get wanted ad by ID
// @access  Public
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified, join_date, location)
    `
      )
      .eq("id", id)
      .single();

    if (error) {
      throw notFoundError("Wanted ad");
    }

    // Check if ad is expired
    const isExpired = new Date(wantedAd.expires_at) < new Date();
    if (isExpired && !wantedAd.is_fulfilled) {
      // Mark as inactive if expired
      await supabaseAdmin
        .from("wanted_ads")
        .update({ is_active: false })
        .eq("id", id);
    }

    // Increment view count (only if not the owner)
    if (!req.user || req.user.id !== wantedAd.user_id) {
      await supabaseAdmin
        .from("wanted_ads")
        .update({ views: (wantedAd.views || 0) + 1 })
        .eq("id", id);

      wantedAd.views = (wantedAd.views || 0) + 1;
    }

    // Get user's other wanted ads
    const { data: otherWantedAds } = await supabaseAdmin
      .from("wanted_ads")
      .select("id, title, budget_min, budget_max, created_at")
      .eq("user_id", wantedAd.user_id)
      .eq("is_active", true)
      .neq("id", id)
      .limit(4)
      .order("created_at", { ascending: false });

    // Get user's rating (average from reviews)
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("reviewee_type", "user")
      .eq("reviewee_id", wantedAd.user_id);

    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : null;

    res.json({
      success: true,
      data: {
        wanted_ad: {
          ...wantedAd,
          is_expired: isExpired,
          user: {
            ...wantedAd.users,
            rating: averageRating,
            review_count: reviews ? reviews.length : 0,
            other_wanted_ads: otherWantedAds || [],
          },
        },
      },
    });
  })
);

// @route   PUT /api/wanted/:id
// @desc    Update wanted ad
// @access  Private (Owner only)
router.put(
  "/:id",
  authenticateToken,
  requireOwnership("id", "user_id"),
  validate(wantedSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    // Check ownership
    const { data: existingWantedAd, error: checkError } = await supabaseAdmin
      .from("wanted_ads")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Wanted ad");
    }

    if (!reqIsOwner(req as any, existingWantedAd.user_id)) {
      throw forbiddenError("You can only update your own wanted ads");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
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
      throw new Error("Failed to update wanted ad");
    }

    res.json({
      success: true,
      message: "Wanted ad updated successfully",
      data: {
        wanted_ad: wantedAd,
      },
    });
  })
);

// @route   DELETE /api/wanted/:id
// @desc    Delete wanted ad
// @access  Private (Owner only)
router.delete(
  "/:id",
  authenticateToken,
  requireOwnership("id", "user_id"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    // Check ownership
    const { data: existingWantedAd, error: checkError } = await supabaseAdmin
      .from("wanted_ads")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Wanted ad");
    }

    if (!reqIsOwner(req as any, existingWantedAd.user_id)) {
      throw forbiddenError("You can only delete your own wanted ads");
    }

    const { error } = await supabaseAdmin
      .from("wanted_ads")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete wanted ad");
    }

    res.json({
      success: true,
      message: "Wanted ad deleted successfully",
    });
  })
);

// @route   POST /api/wanted/:id/fulfill
// @desc    Mark wanted ad as fulfilled
// @access  Private (Owner only)
router.post(
  "/:id/fulfill",
  authenticateToken,
  requireOwnership("id", "user_id"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { fulfilled_by_user_id, notes } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    // Check ownership
    const { data: existingWantedAd, error: checkError } = await supabaseAdmin
      .from("wanted_ads")
      .select("user_id, is_fulfilled")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Wanted ad");
    }

    if (!reqIsOwner(req as any, existingWantedAd.user_id)) {
      throw forbiddenError("You can only fulfill your own wanted ads");
    }

    if (existingWantedAd.is_fulfilled) {
      throw validationError("This wanted ad is already fulfilled");
    }

    const updateData: any = {
      is_fulfilled: true,
      fulfilled_at: new Date().toISOString(),
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    if (fulfilled_by_user_id && isValidUUID(fulfilled_by_user_id)) {
      updateData.fulfilled_by_user_id = fulfilled_by_user_id;
    }

    if (notes) {
      updateData.fulfillment_notes = notes;
    }

    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
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
      throw new Error("Failed to fulfill wanted ad");
    }

    res.json({
      success: true,
      message: "Wanted ad marked as fulfilled successfully",
      data: {
        wanted_ad: wantedAd,
      },
    });
  })
);

// @route   GET /api/wanted/categories
// @desc    Get all wanted ad categories
// @access  Public
router.get(
  "/meta/categories",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data: categories, error } = await supabaseAdmin
      .from("wanted_ads")
      .select("category, subcategory")
      .eq("is_active", true);

    if (error) {
      throw new Error("Failed to fetch categories");
    }

    // Group by category and subcategory
    const categoryMap = {};
    categories.forEach((item) => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = new Set();
      }
      if (item.subcategory) {
        categoryMap[item.category].add(item.subcategory);
      }
    });

    // Convert to array format
    const categoriesArray = Object.keys(categoryMap)
      .map((category) => ({
        name: category,
        subcategories: Array.from(categoryMap[category]).sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        categories: categoriesArray,
      },
    });
  })
);

// @route   GET /api/wanted/search
// @desc    Search wanted ads
// @access  Public
router.get(
  "/search",
  validate(commonSchemas.search, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { q, category, location, page = 1, limit = 20 } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!q || toString(q).trim().length < 2) {
      throw validationError("Search query must be at least 2 characters long");
    }

    let query = supabaseAdmin
      .from("wanted_ads")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .or(
        `title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq("category", category);
    }
    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    const { data: wantedAds, error, count } = await query;

    if (error) {
      throw new Error("Failed to search wanted ads");
    }

    res.json({
      success: true,
      data: {
        wanted_ads: wantedAds,
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

// @route   POST /api/wanted/:id/contact
// @desc    Contact user about a wanted ad
// @access  Private
router.post(
  "/:id/contact",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { message, offer_price } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    if (!message || message.trim().length < 10) {
      throw validationError("Message must be at least 10 characters long");
    }

    // Get wanted ad and user info
    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
      .select(
        `
      id,
      title,
      user_id,
      budget_min,
      budget_max,
      users(username, full_name, email)
    `
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      throw notFoundError("Wanted ad");
    }

    if (wantedAd.user_id === req.user.id) {
      throw validationError(
        "You cannot contact yourself about your own wanted ad"
      );
    }

    let messageContent = message;
    if (offer_price) {
      messageContent += `\n\nOffered Price: $${offer_price}`;
    }

    // Create message record
    const { error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: req.user.id,
        recipient_id: wantedAd.user_id,
        subject: `Response to wanted ad: ${wantedAd.title}`,
        content: messageContent,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      throw new Error("Failed to send message");
    }

    res.json({
      success: true,
      message: "Message sent to user successfully",
    });
  })
);

// @route   GET /api/wanted/user/:userId
// @desc    Get user's wanted ads
// @access  Public
router.get(
  "/user/:userId",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { page, limit, include_inactive } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(userId)) {
      throw validationError("Invalid user ID format");
    }

    let query = supabaseAdmin
      .from("wanted_ads")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    // Only include active ads unless specifically requested
    if (include_inactive !== "true") {
      query = query.eq("is_active", true);
    }

    const { data: wantedAds, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch user wanted ads");
    }

    res.json({
      success: true,
      data: {
        wanted_ads: wantedAds,
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

// @route   POST /api/wanted/:id/extend
// @desc    Extend wanted ad expiration date
// @access  Private (Owner only)
router.post(
  "/:id/extend",
  authenticateToken,
  requireOwnership("id", "user_id"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { days = 30 } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid wanted ad ID format");
    }

    if (days < 1 || days > 90) {
      throw validationError("Extension days must be between 1 and 90");
    }

    // Check ownership
    const { data: existingWantedAd, error: checkError } = await supabaseAdmin
      .from("wanted_ads")
      .select("user_id, expires_at, is_fulfilled")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Wanted ad");
    }

    if (!reqIsOwner(req as any, existingWantedAd.user_id)) {
      throw forbiddenError("You can only extend your own wanted ads");
    }

    if (existingWantedAd.is_fulfilled) {
      throw validationError("Cannot extend a fulfilled wanted ad");
    }

    // Calculate new expiration date
    const currentExpiration = new Date(existingWantedAd.expires_at);
    const newExpiration = new Date(currentExpiration);
    newExpiration.setDate(newExpiration.getDate() + parseInt(days));

    const { data: wantedAd, error } = await supabaseAdmin
      .from("wanted_ads")
      .update({
        expires_at: newExpiration.toISOString(),
        is_active: true, // Reactivate if it was expired
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to extend wanted ad");
    }

    res.json({
      success: true,
      message: `Wanted ad extended by ${days} days successfully`,
      data: {
        wanted_ad: wantedAd,
      },
    });
  })
);

export default router;
