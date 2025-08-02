import express, { Router, Response } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import { AuthenticatedRequest } from "../types";
import { validate, commonSchemas } from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  validationError,
  createError,
} from "../middleware/errorHandler";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { toString, toNumber } from "../utils/typeUtils";
import Joi from "joi";

const router: Router = express.Router();

// All admin vehicle listing routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const vehicleListingSchema = Joi.object({
  // Basic Information
  name: Joi.string().max(200).required(),
  model_id: Joi.string().uuid().required(),
  year: Joi.number()
    .integer()
    .min(1990)
    .max(new Date().getFullYear() + 5)
    .required(),
  trim: Joi.string().max(100).optional(),
  variant: Joi.string().max(100).optional(),
  description: Joi.string().max(2000).optional(),
  msrp_base: Joi.number().positive().optional(),
  msrp_max: Joi.number().positive().optional(),
  availability_status: Joi.string()
    .valid("available", "coming_soon", "discontinued")
    .default("available"),

  // Images
  primary_image_url: Joi.string().uri().optional(),
  image_urls: Joi.array().items(Joi.string().uri()).max(10).optional(),

  // Performance Specifications
  performanceSpecs: Joi.object({
    range_epa: Joi.number().positive().optional(),
    range_wltp: Joi.number().positive().optional(),
    range_real_world: Joi.number().positive().optional(),
    efficiency_epa: Joi.number().positive().optional(),
    efficiency_real_world: Joi.number().positive().optional(),
    acceleration_0_60: Joi.number().positive().optional(),
    acceleration_0_100: Joi.number().positive().optional(),
    top_speed: Joi.number().positive().optional(),
    quarter_mile_time: Joi.number().positive().optional(),
    motor_power_hp: Joi.number().positive().optional(),
    motor_power_kw: Joi.number().positive().optional(),
    motor_torque_lb_ft: Joi.number().positive().optional(),
    motor_torque_nm: Joi.number().positive().optional(),
    motor_count: Joi.number().integer().positive().optional(),
    drivetrain: Joi.string().max(50).optional(),
  }).optional(),

  // Battery Specifications
  batterySpecs: Joi.object({
    battery_capacity_kwh: Joi.number().positive().optional(),
    battery_usable_kwh: Joi.number().positive().optional(),
    battery_type: Joi.string().max(50).optional(),
    battery_chemistry: Joi.string().max(50).optional(),
    battery_warranty_years: Joi.number().integer().positive().optional(),
    battery_warranty_miles: Joi.number().integer().positive().optional(),
    charging_speed_dc_max: Joi.number().positive().optional(),
    charging_speed_ac_max: Joi.number().positive().optional(),
    charging_time_10_80_dc: Joi.number().positive().optional(),
    charging_time_0_100_ac: Joi.number().positive().optional(),
    charging_port_type: Joi.string().max(50).optional(),
  }).optional(),

  // Dimension Specifications
  dimensionSpecs: Joi.object({
    length_in: Joi.number().positive().optional(),
    width_in: Joi.number().positive().optional(),
    height_in: Joi.number().positive().optional(),
    wheelbase_in: Joi.number().positive().optional(),
    ground_clearance_in: Joi.number().positive().optional(),
    curb_weight_lbs: Joi.number().positive().optional(),
    gross_weight_lbs: Joi.number().positive().optional(),
    payload_capacity_lbs: Joi.number().positive().optional(),
    towing_capacity_lbs: Joi.number().positive().optional(),
    seating_capacity: Joi.number().integer().positive().optional(),
    cargo_space_cu_ft: Joi.number().positive().optional(),
    cargo_space_seats_down_cu_ft: Joi.number().positive().optional(),
    front_headroom_in: Joi.number().positive().optional(),
    rear_headroom_in: Joi.number().positive().optional(),
    front_legroom_in: Joi.number().positive().optional(),
    rear_legroom_in: Joi.number().positive().optional(),
  }).optional(),

  // Safety Specifications
  safetySpecs: Joi.object({
    nhtsa_overall_rating: Joi.number().integer().min(1).max(5).optional(),
    nhtsa_frontal_rating: Joi.number().integer().min(1).max(5).optional(),
    nhtsa_side_rating: Joi.number().integer().min(1).max(5).optional(),
    nhtsa_rollover_rating: Joi.number().integer().min(1).max(5).optional(),
    iihs_overall_award: Joi.string().max(50).optional(),
    iihs_moderate_overlap_front: Joi.string().max(10).optional(),
    iihs_side_impact: Joi.string().max(10).optional(),
    iihs_roof_strength: Joi.string().max(10).optional(),
    iihs_head_restraints: Joi.string().max(10).optional(),
    airbag_count: Joi.number().integer().positive().optional(),
    has_automatic_emergency_braking: Joi.boolean().optional(),
    has_blind_spot_monitoring: Joi.boolean().optional(),
    has_lane_keep_assist: Joi.boolean().optional(),
    has_adaptive_cruise_control: Joi.boolean().optional(),
    has_forward_collision_warning: Joi.boolean().optional(),
    has_rear_cross_traffic_alert: Joi.boolean().optional(),
    has_driver_attention_monitoring: Joi.boolean().optional(),
  }).optional(),

  // Environmental Specifications
  environmentalSpecs: Joi.object({
    co2_emissions_g_km: Joi.number().positive().optional(),
    co2_emissions_g_mi: Joi.number().positive().optional(),
    mpge_combined: Joi.number().positive().optional(),
    mpge_city: Joi.number().positive().optional(),
    mpge_highway: Joi.number().positive().optional(),
    annual_fuel_cost: Joi.number().positive().optional(),
    fuel_savings_vs_gas: Joi.number().optional(),
    green_score: Joi.number().min(0).max(10).optional(),
  }).optional(),

  // Features
  features: Joi.array().items(Joi.string().uuid()).optional(),

  // Status
  is_featured: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
});

const vehicleListingSchemas = {
  create: vehicleListingSchema,
  update: vehicleListingSchema.fork(
    Object.keys(vehicleListingSchema.describe().keys),
    (schema) => schema.optional()
  ),
};

// =============================================================================
// ADMIN VEHICLE LISTING ENDPOINTS
// =============================================================================

// @route   POST /api/admin/vehicle-listings
// @desc    Create a new vehicle listing (Admin only)
// @access  Private (Admin only)
router.post(
  "/",
  validate(vehicleListingSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      performanceSpecs,
      batterySpecs,
      dimensionSpecs,
      safetySpecs,
      environmentalSpecs,
      features,
      ...listingData
    } = req.body;

    // Start a transaction to create the listing and all related specs
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("vehicle_listings")
      .insert({
        ...listingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (listingError) {
      throw createError(
        "Failed to create vehicle listing",
        500,
        "CREATE_LISTING_FAILED"
      );
    }

    const listingId = listing.id;

    // Create performance specs if provided
    if (performanceSpecs) {
      const { error: perfError } = await supabaseAdmin
        .from("vehicle_performance_specs")
        .insert({
          listing_id: listingId,
          ...performanceSpecs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (perfError) {
        console.error("Performance specs error:", perfError);
      }
    }

    // Create battery specs if provided
    if (batterySpecs) {
      const { error: battError } = await supabaseAdmin
        .from("vehicle_battery_specs")
        .insert({
          listing_id: listingId,
          ...batterySpecs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (battError) {
        console.error("Battery specs error:", battError);
      }
    }

    // Create dimension specs if provided
    if (dimensionSpecs) {
      const { error: dimError } = await supabaseAdmin
        .from("vehicle_dimension_specs")
        .insert({
          listing_id: listingId,
          ...dimensionSpecs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dimError) {
        console.error("Dimension specs error:", dimError);
      }
    }

    // Create safety specs if provided
    if (safetySpecs) {
      const { error: safetyError } = await supabaseAdmin
        .from("vehicle_safety_specs")
        .insert({
          listing_id: listingId,
          ...safetySpecs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (safetyError) {
        console.error("Safety specs error:", safetyError);
      }
    }

    // Create environmental specs if provided
    if (environmentalSpecs) {
      const { error: envError } = await supabaseAdmin
        .from("vehicle_environmental_specs")
        .insert({
          listing_id: listingId,
          ...environmentalSpecs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (envError) {
        console.error("Environmental specs error:", envError);
      }
    }

    // Create feature associations if provided
    if (features && features.length > 0) {
      const featureInserts = features.map((featureId: string) => ({
        listing_id: listingId,
        feature_id: featureId,
        is_standard: true, // Default to standard, can be customized later
        created_at: new Date().toISOString(),
      }));

      const { error: featError } = await supabaseAdmin
        .from("vehicle_features")
        .insert(featureInserts);

      if (featError) {
        console.error("Features error:", featError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Vehicle listing created successfully",
      data: { listing },
    });
  })
);

// @route   PUT /api/admin/vehicle-listings/:id
// @desc    Update a vehicle listing (Admin only)
// @access  Private (Admin only)
router.put(
  "/:id",
  validate(vehicleListingSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle listing");
    }

    const {
      performanceSpecs,
      batterySpecs,
      dimensionSpecs,
      safetySpecs,
      environmentalSpecs,
      features,
      ...listingData
    } = req.body;

    // Update the main listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("vehicle_listings")
      .update({
        ...listingData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (listingError) {
      throw notFoundError("Vehicle listing");
    }

    // Update performance specs if provided
    if (performanceSpecs) {
      await supabaseAdmin.from("vehicle_performance_specs").upsert({
        listing_id: id,
        ...performanceSpecs,
        updated_at: new Date().toISOString(),
      });
    }

    // Update battery specs if provided
    if (batterySpecs) {
      await supabaseAdmin.from("vehicle_battery_specs").upsert({
        listing_id: id,
        ...batterySpecs,
        updated_at: new Date().toISOString(),
      });
    }

    // Update dimension specs if provided
    if (dimensionSpecs) {
      await supabaseAdmin.from("vehicle_dimension_specs").upsert({
        listing_id: id,
        ...dimensionSpecs,
        updated_at: new Date().toISOString(),
      });
    }

    // Update safety specs if provided
    if (safetySpecs) {
      await supabaseAdmin.from("vehicle_safety_specs").upsert({
        listing_id: id,
        ...safetySpecs,
        updated_at: new Date().toISOString(),
      });
    }

    // Update environmental specs if provided
    if (environmentalSpecs) {
      await supabaseAdmin.from("vehicle_environmental_specs").upsert({
        listing_id: id,
        ...environmentalSpecs,
        updated_at: new Date().toISOString(),
      });
    }

    // Update features if provided (including empty arrays to clear features)
    if (features !== undefined) {
      // Delete existing features
      await supabaseAdmin
        .from("vehicle_features")
        .delete()
        .eq("listing_id", id);

      // Insert new features
      if (features.length > 0) {
        const featureInserts = features.map((featureId: string) => ({
          listing_id: id,
          feature_id: featureId,
          is_standard: true,
          created_at: new Date().toISOString(),
        }));

        await supabaseAdmin.from("vehicle_features").insert(featureInserts);
      }
    }

    res.json({
      success: true,
      message: "Vehicle listing updated successfully",
      data: { listing },
    });
  })
);

// @route   DELETE /api/admin/vehicle-listings/:id
// @desc    Delete a vehicle listing (Admin only)
// @access  Private (Admin only)
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle listing");
    }

    // Delete the listing (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from("vehicle_listings")
      .delete()
      .eq("id", id);

    if (error) {
      throw createError(
        "Failed to delete vehicle listing",
        500,
        "DELETE_LISTING_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Vehicle listing deleted successfully",
    });
  })
);

// @route   GET /api/admin/vehicle-listings
// @desc    Get all vehicle listings for admin management
// @access  Private (Admin only)
router.get(
  "/",
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "20",
      search,
      manufacturer,
      year,
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    let query = supabaseAdmin
      .from("vehicle_listings")
      .select(
        `
        *,
        model:vehicle_models(
          *,
          manufacturer:vehicle_manufacturers(*)
        )
      `,
        { count: "exact" }
      )
      .range(from, to);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (manufacturer) {
      query = query.eq("model.manufacturer.slug", manufacturer);
    }

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    if (status) {
      query = query.eq("availability_status", status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data: listings, error, count } = await query;

    if (error) {
      throw createError(
        "Failed to fetch vehicle listings",
        500,
        "FETCH_LISTINGS_FAILED"
      );
    }

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: listings,
      pagination,
    });
  })
);

export default router;
