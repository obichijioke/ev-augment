import express, { Request, Response, Router } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { authenticateToken, optionalAuth } from "../middleware/auth";
import { validate, commonSchemas } from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  forbiddenError,
  createError,
} from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";
import { reqIsAdmin, reqIsOwner, reqIsModerator } from "../utils/roleUtils";
import {
  EVListing,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";
import { toString, toNumber } from "../utils/typeUtils";
import Joi from "joi";

const router: Router = express.Router();

// Using supabaseAdminAdmin from services

// TypeScript interfaces
interface EVListingsQuery {
  page?: number;
  limit?: number;
  make?: string;
  year?: number;
  min_price?: number;
  max_price?: number;
  min_range?: number;
  max_range?: number;
  body_type?: string;
  availability_status?: "available" | "coming_soon" | "discontinued";
  sort?: "year" | "price" | "range" | "created_at";
  order?: "asc" | "desc";
  search?: string;
}

interface CreateEVListingRequest {
  make: string;
  model: string;
  year: number;
  trim?: string;
  body_type?: string;
  drivetrain?: string;
  battery_capacity?: number;
  range_epa?: number;
  range_wltp?: number;
  acceleration_0_60?: number;
  top_speed?: number;
  charging_speed_dc?: number;
  charging_speed_ac?: number;
  starting_price?: number;
  max_price?: number;
  availability_status?: "available" | "coming_soon" | "discontinued";
  images?: string[];
  specifications?: object;
  features?: string[];
  description?: string;
  manufacturer_website?: string;
}

interface UpdateEVListingRequest extends CreateEVListingRequest {}

// Validation schemas - using local definition since not in validation middleware
const evListingSchema = Joi.object({
  make: Joi.string().required().max(50),
  model: Joi.string().required().max(50),
  year: Joi.number()
    .integer()
    .min(2010)
    .max(new Date().getFullYear() + 2)
    .required(),
  trim: Joi.string().max(50).allow(""),
  body_type: Joi.string().max(30).allow(""),
  drivetrain: Joi.string().max(20).allow(""),
  battery_capacity: Joi.number().positive().allow(null),
  range_epa: Joi.number().integer().positive().allow(null),
  range_wltp: Joi.number().integer().positive().allow(null),
  acceleration_0_60: Joi.number().positive().allow(null),
  top_speed: Joi.number().integer().positive().allow(null),
  charging_speed_dc: Joi.number().positive().allow(null),
  charging_speed_ac: Joi.number().positive().allow(null),
  starting_price: Joi.number().positive().allow(null),
  max_price: Joi.number().positive().allow(null),
  availability_status: Joi.string()
    .valid("available", "coming_soon", "discontinued")
    .default("available"),
  images: Joi.array().items(Joi.string().uri()).max(10),
  specifications: Joi.object(),
  features: Joi.array().items(Joi.string().max(100)),
  description: Joi.string().max(2000).allow(""),
  manufacturer_website: Joi.string().uri().allow(""),
});

const evListingSchemas = {
  create: evListingSchema,
  update: evListingSchema.fork(
    Object.keys(evListingSchema.describe().keys),
    (schema) => schema.optional()
  ),
};

// Using imported commonSchemas instead of local definition
// const querySchema = Joi.object({
//   page: Joi.number().integer().min(1).default(1),
//   limit: Joi.number().integer().min(1).max(50).default(20),
//   make: Joi.string().max(50),
//   year: Joi.number().integer().min(2010).max(new Date().getFullYear() + 2),
//   min_price: Joi.number().positive(),
//   max_price: Joi.number().positive(),
//   min_range: Joi.number().integer().positive(),
//   max_range: Joi.number().integer().positive(),
//   body_type: Joi.string().max(30),
//   availability_status: Joi.string().valid('available', 'coming_soon', 'discontinued'),
//   sort: Joi.string().valid('year', 'price', 'range', 'created_at').default('created_at'),
//   order: Joi.string().valid('asc', 'desc').default('desc'),
//   search: Joi.string().max(100)
// });

// @route   GET /api/ev-listings
// @desc    Get all EV listings with filtering and pagination
// @access  Public
router.get(
  "/",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      page,
      limit,
      make,
      year,
      min_price,
      max_price,
      min_range,
      max_range,
      body_type,
      availability_status,
      sort,
      order,
      search,
    } = req.query;

    const offset = (toNumber(page, 1) - 1) * toNumber(limit, 20);

    // Build query
    let query = supabaseAdmin
      .from("ev_listings")
      .select("*", { count: "exact" });

    // Apply filters
    if (make) {
      query = query.ilike("make", `%${make}%`);
    }

    if (year) {
      query = query.eq("year", year);
    }

    if (min_price) {
      query = query.gte("starting_price", min_price);
    }

    if (max_price) {
      query = query.lte("starting_price", max_price);
    }

    if (min_range) {
      query = query.gte("range_epa", min_range);
    }

    if (max_range) {
      query = query.lte("range_epa", max_range);
    }

    if (body_type) {
      query = query.eq("body_type", body_type);
    }

    if (availability_status) {
      query = query.eq("availability_status", availability_status);
    }

    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      console.error("Error fetching EV listings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch EV listings",
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  })
);

// @route   GET /api/ev-listings/:id
// @desc    Get EV listing by ID
// @access  Public
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const { data: listing, error } = await supabaseAdmin
      .from("ev_listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "EV listing not found",
        });
      }
      console.error("Error fetching EV listing:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch EV listing",
      });
    }

    res.json({
      success: true,
      data: listing,
    });
  })
);

// @route   POST /api/ev-listings
// @desc    Create new EV listing (Admin only)
// @access  Private (Admin)
router.post(
  "/",
  authenticateToken,
  validate(evListingSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user is admin (cached role)
    if (!reqIsAdmin(req as any)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { data: listing, error } = await supabaseAdmin
      .from("ev_listings")
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error("Error creating EV listing:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create EV listing",
      });
    }

    res.status(201).json({
      success: true,
      data: listing,
      message: "EV listing created successfully",
    });
  })
);

// @route   PUT /api/ev-listings/:id
// @desc    Update EV listing (Admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  authenticateToken,
  validate(evListingSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Check if user is admin (cached role)
    if (!reqIsAdmin(req as any)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { data: listing, error } = await supabaseAdmin
      .from("ev_listings")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "EV listing not found",
        });
      }
      console.error("Error updating EV listing:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update EV listing",
      });
    }

    res.json({
      success: true,
      data: listing,
      message: "EV listing updated successfully",
    });
  })
);

// @route   DELETE /api/ev-listings/:id
// @desc    Delete EV listing (Admin only)
// @access  Private (Admin)
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Check if user is admin (cached role)
    if (!reqIsAdmin(req as any)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { error } = await supabaseAdmin
      .from("ev_listings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting EV listing:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete EV listing",
      });
    }

    res.json({
      success: true,
      message: "EV listing deleted successfully",
    });
  })
);

// @route   GET /api/ev-listings/makes
// @desc    Get all available makes
// @access  Public
router.get(
  "/meta/makes",
  asyncHandler(async (req: Request, res: Response) => {
    const { data: makes, error } = await supabaseAdmin
      .from("ev_listings")
      .select("make")
      .order("make");

    if (error) {
      console.error("Error fetching makes:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch makes",
      });
    }

    // Get unique makes
    const uniqueMakes = [...new Set(makes.map((item) => item.make))];

    res.json({
      success: true,
      data: uniqueMakes,
    });
  })
);

// @route   GET /api/ev-listings/models/:make
// @desc    Get models for a specific make
// @access  Public
router.get(
  "/meta/models/:make",
  asyncHandler(async (req: Request<{ make: string }>, res: Response) => {
    const { make } = req.params;

    const { data: models, error } = await supabaseAdmin
      .from("ev_listings")
      .select("model")
      .eq("make", make)
      .order("model");

    if (error) {
      console.error("Error fetching models:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch models",
      });
    }

    // Get unique models
    const uniqueModels = [...new Set(models.map((item) => item.model))];

    res.json({
      success: true,
      data: uniqueModels,
    });
  })
);

export default router;
