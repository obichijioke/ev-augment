// =============================================================================
// Vehicle Listings API Routes - Manufacturer Vehicle Specifications
// =============================================================================

import express, { Router } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { validate, commonSchemas } from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  createError,
} from "../middleware/errorHandler";
import { optionalAuth } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { ApiResponse, PaginatedResponse } from "../types/database";

const router: Router = express.Router();

// =============================================================================
// VEHICLE LISTINGS ENDPOINTS
// =============================================================================

// @route   GET /api/vehicle-listings
// @desc    Get vehicle listings with comprehensive specifications
// @access  Public
router.get(
  "/",
  optionalAuth,
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      page = "1",
      limit = "20",
      search,
      manufacturer,
      bodyType,
      year,
      minPrice,
      maxPrice,
      minRange,
      maxRange,
      features,
      sortBy = "created_at",
      sortOrder = "desc",
      featured,
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    // Build the main query with all joins
    let query = supabaseAdmin
      .from("vehicle_listings")
      .select(
        `
        *,
        model:vehicle_models(
          *,
          manufacturer:vehicle_manufacturers(*)
        ),
        performanceSpecs:vehicle_performance_specs(*),
        batterySpecs:vehicle_battery_specs(*),
        dimensionSpecs:vehicle_dimension_specs(*),
        safetySpecs:vehicle_safety_specs(*),
        environmentalSpecs:vehicle_environmental_specs(*),
        features:vehicle_features(
          *,
          feature:features(
            *,
            category:feature_categories(*)
          )
        ),
        recentRatings:vehicle_ratings(*)
      `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .range(from, to);

    // Apply filters
    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (manufacturer) {
      // Filter by manufacturer through the model relationship
      query = query.eq("model.manufacturer.slug", manufacturer);
    }

    if (bodyType) {
      query = query.eq("model.body_type", bodyType);
    }

    if (year) {
      const yearInt = parseInt(year);
      if (!isNaN(yearInt)) {
        query = query.eq("year", yearInt);
      }
    }

    if (minPrice) {
      const price = parseFloat(minPrice);
      if (!isNaN(price)) {
        query = query.gte("msrp_base", price);
      }
    }

    if (maxPrice) {
      const price = parseFloat(maxPrice);
      if (!isNaN(price)) {
        query = query.lte("msrp_max", price);
      }
    }

    if (minRange) {
      const range = parseInt(minRange);
      if (!isNaN(range)) {
        query = query.gte("performanceSpecs.range_epa", range);
      }
    }

    if (maxRange) {
      const range = parseInt(maxRange);
      if (!isNaN(range)) {
        query = query.lte("performanceSpecs.range_epa", range);
      }
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "name",
      "year",
      "msrp_base",
      "rating_average",
      "view_count",
    ];
    const validSortOrders = ["asc", "desc"];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortOrderValue = validSortOrders.includes(sortOrder)
      ? sortOrder
      : "desc";

    query = query.order(sortField, { ascending: sortOrderValue === "asc" });

    const { data: listings, error, count } = await query;

    if (error) {
      console.error("Vehicle listings fetch error:", error);
      throw createError(
        "Failed to fetch vehicle listings",
        500,
        "FETCH_LISTINGS_FAILED"
      );
    }

    // Transform the data to group features by category and sort recent ratings
    const transformedListings =
      listings?.map((listing) => ({
        ...(listing as any),
        features: groupFeaturesByCategory((listing as any).features || []),
        recentRatings: ((listing as any).recentRatings || [])
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5),
      })) || [];

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: transformedListings,
      pagination,
    } as PaginatedResponse<any>);
  })
);

// @route   GET /api/vehicle-listings/:id
// @desc    Get detailed vehicle listing by ID
// @access  Public
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle listing");
    }

    // Record view if user is present
    if (req.user) {
      await recordVehicleView(id, req.user.id);
    } else {
      await recordVehicleView(id);
    }

    const { data: listing, error } = await supabaseAdmin
      .from("vehicle_listings")
      .select(
        `
        *,
        model:vehicle_models(
          *,
          manufacturer:vehicle_manufacturers(*)
        ),
        performanceSpecs:vehicle_performance_specs(*),
        batterySpecs:vehicle_battery_specs(*),
        dimensionSpecs:vehicle_dimension_specs(*),
        safetySpecs:vehicle_safety_specs(*),
        environmentalSpecs:vehicle_environmental_specs(*),
        features:vehicle_features(
          *,
          feature:features(
            *,
            category:feature_categories(*)
          )
        ),
        recentRatings:vehicle_ratings(*)
      `
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !listing) {
      throw notFoundError("Vehicle listing");
    }

    // Transform features to be grouped by category and sort recent ratings
    const transformedListing = {
      ...(listing as any),
      features: groupFeaturesByCategory((listing as any).features || []),
      recentRatings: ((listing as any).recentRatings || [])
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10),
    };

    res.json({
      success: true,
      data: transformedListing,
    } as ApiResponse<any>);
  })
);

// @route   POST /api/vehicle-listings/:id/view
// @desc    Record a vehicle view
// @access  Public
router.post(
  "/:id/view",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle listing");
    }

    await recordVehicleView(id, userId || req.user?.id);

    res.json({
      success: true,
      message: "View recorded",
    } as ApiResponse);
  })
);

// @route   POST /api/vehicle-listings/:id/like
// @desc    Toggle vehicle like status
// @access  Private
router.post(
  "/:id/like",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const actualUserId = userId || req.user?.id;

    if (!actualUserId) {
      throw createError("Authentication required", 401, "AUTH_REQUIRED");
    }

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle listing");
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from("vehicle_likes")
      .select("id")
      .eq("listing_id", id)
      .eq("user_id", actualUserId)
      .single();

    let liked = false;
    if (existingLike) {
      // Unlike
      await supabaseAdmin
        .from("vehicle_likes")
        .delete()
        .eq("listing_id", id)
        .eq("user_id", actualUserId);
    } else {
      // Like
      await supabaseAdmin.from("vehicle_likes").insert({
        listing_id: id,
        user_id: actualUserId,
      });
      liked = true;
    }

    // Get updated like count
    const { data: listing } = await supabaseAdmin
      .from("vehicle_listings")
      .select("like_count")
      .eq("id", id)
      .single();

    res.json({
      success: true,
      data: {
        liked,
        likeCount: listing?.like_count || 0,
      },
    } as ApiResponse<{ liked: boolean; likeCount: number }>);
  })
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Record a vehicle view
async function recordVehicleView(listingId: string, userId?: string) {
  await supabaseAdmin.from("vehicle_views").insert({
    listing_id: listingId,
    user_id: userId || null,
    viewed_at: new Date().toISOString(),
  });
}

// Group features by category
function groupFeaturesByCategory(features: any[]): {
  [categorySlug: string]: any[];
} {
  const grouped: { [categorySlug: string]: any[] } = {};

  features.forEach((vehicleFeature) => {
    const categorySlug = vehicleFeature.feature?.category?.slug;
    if (categorySlug) {
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = [];
      }
      grouped[categorySlug].push(vehicleFeature);
    }
  });

  return grouped;
}

export default router;
