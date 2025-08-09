import express, { Router, Response } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import {
  validate,
  reviewSchemas,
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
  requireModerator,
} from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { User, ApiResponse, PaginatedResponse } from "../types/database";
import { toString, toNumber } from "../utils/typeUtils";

const router: Router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews (with filtering)
// @access  Public
router.get(
  "/",
  optionalAuth,
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page,
      limit,
      entity_type,
      entity_id,
      reviewer_id,
      rating_min,
      rating_max,
      sort,
      sortBy,
    } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    let query = supabaseAdmin
      .from("reviews")
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .range(from, to);

    // Apply filters
    if (entity_type) {
      query = query.eq("entity_type", entity_type);
    }
    if (entity_id && isValidUUID(toString(entity_id))) {
      query = query.eq("entity_id", entity_id);
    }
    if (reviewer_id && isValidUUID(toString(reviewer_id))) {
      query = query.eq("reviewer_id", reviewer_id);
    }
    if (rating_min) {
      const minRating = parseInt(toString(rating_min));
      if (minRating >= 1 && minRating <= 5) {
        query = query.gte("rating", minRating);
      }
    }
    if (rating_max) {
      const maxRating = parseInt(toString(rating_max));
      if (maxRating >= 1 && maxRating <= 5) {
        query = query.lte("rating", maxRating);
      }
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "rating",
      "helpful_count",
    ];
    const sortField = validSortFields.includes(toString(sortBy))
      ? toString(sortBy)
      : "created_at";
    const sortOrder =
      sort === "asc" ? { ascending: true } : { ascending: false };

    query = query.order(sortField, sortOrder);

    const { data: reviews, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch reviews");
    }

    res.json({
      success: true,
      data: {
        reviews,
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

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post(
  "/",
  optionalAuth,
  validate(reviewSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      entity_type,
      entity_id,
      rating,
      title,
      content,
      pros,
      cons,
      reviewer_name,
      reviewer_email,
    } = req.body;

    // Validate entity_id format
    if (!isValidUUID(toString(entity_id))) {
      throw validationError("Invalid entity ID format");
    }

    // Check if the entity exists based on entity_type
    let entityExists = false;
    let entityOwner = null;

    switch (entity_type) {
      case "charging_station":
        const { data: station } = await supabaseAdmin
          .from("charging_stations")
          .select("id")
          .eq("id", entity_id)
          .single();
        entityExists = !!station;
        break;

      case "marketplace_listing":
        const { data: listing } = await supabaseAdmin
          .from("marketplace_listings")
          .select("id, seller_id")
          .eq("id", entity_id)
          .single();
        entityExists = !!listing;
        entityOwner = listing?.seller_id;
        break;

      case "directory_listing":
        const { data: directory } = await supabaseAdmin
          .from("directory_listings")
          .select("id, owner_id")
          .eq("id", entity_id)
          .single();
        entityExists = !!directory;
        entityOwner = directory?.owner_id;
        break;

      case "vehicle":
        const { data: vehicle } = await supabaseAdmin
          .from("vehicles")
          .select("id, owner_id, is_public")
          .eq("id", entity_id)
          .single();
        entityExists = !!vehicle && vehicle.is_public;
        entityOwner = vehicle?.owner_id;
        break;

      case "vehicle_listing":
        const { data: vehicleListing } = await supabaseAdmin
          .from("vehicle_listings")
          .select("id, is_active")
          .eq("id", entity_id)
          .single();
        entityExists = !!vehicleListing && vehicleListing.is_active;
        entityOwner = null; // Vehicle listings don't have owners
        break;

      default:
        throw validationError("Invalid entity type");
    }

    if (!entityExists) {
      throw notFoundError("Entity to review");
    }

    // For authenticated users, prevent reviewing own content and duplicate reviews
    if (req.user) {
      // Prevent users from reviewing their own content
      if (entityOwner && entityOwner === req.user.id) {
        throw forbiddenError("You cannot review your own content");
      }

      // Check if user has already reviewed this entity
      const { data: existingReview } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .eq("reviewer_id", req.user.id)
        .single();

      if (existingReview) {
        throw validationError("You have already reviewed this item");
      }
    } else {
      // For anonymous reviews, require reviewer_name
      if (!reviewer_name || !reviewer_name.trim()) {
        throw validationError(
          "Reviewer name is required for anonymous reviews"
        );
      }
    }

    const reviewData = {
      entity_type,
      entity_id,
      reviewer_id: req.user?.id || null,
      rating,
      title,
      content,
      pros: pros || null,
      cons: cons || null,
      reviewer_name: reviewer_name || null,
      reviewer_email: reviewer_email || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert(reviewData)
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to create review");
    }

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: {
        review,
      },
    });
  })
);

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid review ID format");
    }

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified, join_date)
    `
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      throw notFoundError("Review");
    }

    // Get review likes/dislikes if user is authenticated
    let userInteraction = null;
    if (req.user) {
      const { data: interaction } = await supabaseAdmin
        .from("review_likes")
        .select("is_helpful")
        .eq("review_id", id)
        .eq("user_id", req.user.id)
        .single();

      userInteraction = interaction;
    }

    res.json({
      success: true,
      data: {
        review: {
          ...review,
          user_interaction: userInteraction,
        },
      },
    });
  })
);

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Owner only)
router.put(
  "/:id",
  authenticateToken,
  requireOwnership("id", "reviewer_id"),
  validate(reviewSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid review ID format");
    }

    // Check ownership
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from("reviews")
      .select("reviewer_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Review");
    }

    if (existingReview.reviewer_id !== req.user.id) {
      throw forbiddenError("You can only update your own reviews");
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .update(updateData)
      .eq("id", id)
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw new Error("Failed to update review");
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      data: {
        review,
      },
    });
  })
);

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Owner or Moderator)
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw validationError("Invalid review ID format");
    }

    // Check ownership or moderator status
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from("reviews")
      .select("reviewer_id")
      .eq("id", id)
      .single();

    if (checkError) {
      throw notFoundError("Review");
    }

    const isModerator =
      req.user.role === "moderator" || req.user.role === "admin";
    const isOwner = existingReview.reviewer_id === req.user.id;

    if (!isOwner && !isModerator) {
      throw forbiddenError("You can only delete your own reviews");
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error("Failed to delete review");
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  })
);

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful or not helpful
// @access  Private
router.post(
  "/:id/helpful",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { is_helpful } = req.body;

    if (!isValidUUID(id)) {
      throw validationError("Invalid review ID format");
    }

    if (typeof is_helpful !== "boolean") {
      throw validationError("is_helpful must be a boolean value");
    }

    // Check if review exists
    const { data: review, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .select("id, reviewer_id")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (reviewError) {
      throw notFoundError("Review");
    }

    // Prevent users from rating their own reviews
    if (review.reviewer_id === req.user.id) {
      throw forbiddenError("You cannot rate your own review");
    }

    // Check if user has already rated this review
    const { data: existingLike, error: likeCheckError } = await supabaseAdmin
      .from("review_likes")
      .select("id, is_helpful")
      .eq("review_id", id)
      .eq("user_id", req.user.id)
      .single();

    let result;

    if (existingLike) {
      // Update existing rating
      if (existingLike.is_helpful === is_helpful) {
        // Remove the rating if it's the same
        const { error: deleteError } = await supabaseAdmin
          .from("review_likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          throw new Error("Failed to remove rating");
        }

        result = { action: "removed" };
      } else {
        // Update the rating
        const { data: updatedLike, error: updateError } = await supabaseAdmin
          .from("review_likes")
          .update({
            is_helpful,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLike.id)
          .select("*")
          .single();

        if (updateError) {
          throw new Error("Failed to update rating");
        }

        result = { action: "updated", like: updatedLike };
      }
    } else {
      // Create new rating
      const { data: newLike, error: createError } = await supabaseAdmin
        .from("review_likes")
        .insert({
          review_id: id,
          user_id: req.user.id,
          is_helpful,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (createError) {
        throw new Error("Failed to create rating");
      }

      result = { action: "created", like: newLike };
    }

    // Update helpful count on the review
    const { data: helpfulCounts } = await supabaseAdmin
      .from("review_likes")
      .select("is_helpful")
      .eq("review_id", id);

    const helpfulCount =
      helpfulCounts?.filter((like) => like.is_helpful === true).length || 0;
    const notHelpfulCount =
      helpfulCounts?.filter((like) => like.is_helpful === false).length || 0;

    await supabaseAdmin
      .from("reviews")
      .update({
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    res.json({
      success: true,
      message: `Review rating ${result.action} successfully`,
      data: {
        action: result.action,
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount,
      },
    });
  })
);

// @route   GET /api/reviews/entity/:entityType/:entityId
// @desc    Get reviews for a specific entity
// @access  Public
router.get(
  "/entity/:entityType/:entityId",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { entityType, entityId } = req.params;
    const { page, limit, rating_filter, sort, sortBy } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(entityId)) {
      throw validationError("Invalid entity ID format");
    }

    const validEntityTypes = [
      "charging_station",
      "marketplace_listing",
      "directory_listing",
      "vehicle",
      "vehicle_listing",
    ];
    if (!validEntityTypes.includes(entityType)) {
      throw validationError("Invalid entity type");
    }

    let query = supabaseAdmin
      .from("reviews")
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_active", true)
      .range(from, to);

    // Apply rating filter
    if (rating_filter) {
      const rating = parseInt(toString(rating_filter));
      if (rating >= 1 && rating <= 5) {
        query = query.eq("rating", rating);
      }
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "rating",
      "helpful_count",
    ];
    const sortField = validSortFields.includes(toString(sortBy))
      ? toString(sortBy)
      : "created_at";
    const sortOrder =
      sort === "asc" ? { ascending: true } : { ascending: false };

    query = query.order(sortField, sortOrder);

    const { data: reviews, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch entity reviews");
    }

    // Calculate rating statistics
    const { data: allReviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_active", true);

    const ratingStats = {
      total_reviews: allReviews?.length || 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (allReviews && allReviews.length > 0) {
      ratingStats.average_rating =
        allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length;

      allReviews.forEach((review) => {
        ratingStats.rating_distribution[review.rating]++;
      });
    }

    res.json({
      success: true,
      data: {
        reviews,
        rating_stats: ratingStats,
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

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by a specific user
// @access  Public
router.get(
  "/user/:userId",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { page, limit, entity_type } = req.query;
    const { from, to } = buildPagination(
      toNumber(page, 1),
      toNumber(limit, 20)
    );

    if (!isValidUUID(userId)) {
      throw validationError("Invalid user ID format");
    }

    let query = supabaseAdmin
      .from("reviews")
      .select(
        `
      *,
      users!reviews_reviewer_id_fkey(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("reviewer_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (entity_type) {
      const validEntityTypes = [
        "charging_station",
        "marketplace_listing",
        "directory_listing",
        "vehicle",
        "vehicle_listing",
      ];
      if (validEntityTypes.includes(toString(entity_type))) {
        query = query.eq("entity_type", entity_type);
      }
    }

    const { data: reviews, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch user reviews");
    }

    res.json({
      success: true,
      data: {
        reviews,
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

// @route   GET /api/reviews/stats/:entityType/:entityId
// @desc    Get review statistics for an entity
// @access  Public
router.get(
  "/stats/:entityType/:entityId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { entityType, entityId } = req.params;

    if (!isValidUUID(entityId)) {
      throw validationError("Invalid entity ID format");
    }

    const validEntityTypes = [
      "charging_station",
      "marketplace_listing",
      "directory_listing",
      "vehicle",
      "vehicle_listing",
    ];
    if (!validEntityTypes.includes(entityType)) {
      throw validationError("Invalid entity type");
    }

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("rating, helpful_count")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_active", true);

    if (error) {
      throw new Error("Failed to fetch review statistics");
    }

    const stats = {
      total_reviews: reviews.length,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      total_helpful_votes: 0,
    };

    if (reviews.length > 0) {
      stats.average_rating =
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;
      stats.total_helpful_votes = reviews.reduce(
        (sum, review) => sum + (review.helpful_count || 0),
        0
      );

      reviews.forEach((review) => {
        stats.rating_distribution[review.rating]++;
      });
    }

    res.json({
      success: true,
      data: {
        stats,
      },
    });
  })
);

export default router;
