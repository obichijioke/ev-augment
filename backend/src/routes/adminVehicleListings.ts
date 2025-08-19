import express, { Router, Response, Request } from "express";
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
import multer from "multer";

const router: Router = express.Router();

// All admin vehicle listing routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const vehicleListingSchema = Joi.object({
  // Basic Information (matches schema.sql vehicle_listings)
  model_id: Joi.string().uuid().required(),
  year: Joi.number()
    .integer()
    .min(1990)
    .max(new Date().getFullYear() + 5)
    .required(),
  trim: Joi.string().max(100).optional(),
  msrp_base: Joi.number().precision(2).optional(),
  msrp_max: Joi.number().precision(2).optional(),
  availability_status: Joi.string().max(50).optional(),
  primary_image_url: Joi.string().uri().optional(),
  image_urls: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().optional(),
  key_features: Joi.array().items(Joi.string()).optional(),

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
    battery_type: Joi.string().max(50).optional(),
    battery_chemistry: Joi.string().max(50).optional(),
    charging_speed_dc_max: Joi.number().positive().optional(),
    charging_speed_ac_max: Joi.number().positive().optional(),
    charging_time_10_80_dc: Joi.number().positive().optional(),
    charging_time_0_100_ac: Joi.number().positive().optional(),
    battery_warranty_years: Joi.number().integer().positive().optional(),
    battery_warranty_miles: Joi.number().integer().positive().optional(),
  }).optional(),

  // Dimension Specifications
  dimensionSpecs: Joi.object({
    length_inches: Joi.number().positive().optional(),
    width_inches: Joi.number().positive().optional(),
    height_inches: Joi.number().positive().optional(),
    wheelbase_inches: Joi.number().positive().optional(),
    ground_clearance_inches: Joi.number().positive().optional(),
    cargo_volume_cubic_feet: Joi.number().positive().optional(),
    passenger_volume_cubic_feet: Joi.number().positive().optional(),
    seating_capacity: Joi.number().integer().positive().optional(),
    curb_weight_lbs: Joi.number().positive().optional(),
    gross_weight_lbs: Joi.number().positive().optional(),
    towing_capacity_lbs: Joi.number().positive().optional(),
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
    co2_emissions_grams_km: Joi.number().positive().optional(),
    energy_consumption_kwh_100km: Joi.number().positive().optional(),
    energy_consumption_kwh_100mi: Joi.number().positive().optional(),
    mpge_city: Joi.number().positive().optional(),
    mpge_highway: Joi.number().positive().optional(),
    mpge_combined: Joi.number().positive().optional(),
    environmental_score: Joi.number().positive().optional(),
    recyclability_percentage: Joi.number().positive().optional(),
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
    } = req.body as any;

    // Backward compatibility: map `images` -> primary_image_url + image_urls if provided
    const listingDataMapped: any = { ...listingData };
    if (Array.isArray((req.body as any).images)) {
      const arr = ((req.body as any).images as string[]).filter(
        (u) => !!u && u.trim() !== ""
      );
      if (arr.length > 0) {
        if (!listingDataMapped.primary_image_url)
          listingDataMapped.primary_image_url = arr[0];
        if (!listingDataMapped.image_urls)
          listingDataMapped.image_urls = arr.slice(1);
      }
      delete listingDataMapped.images;
    }

    // Coerce numeric MSRP if sent as strings
    if (
      listingDataMapped.msrp_base !== undefined &&
      typeof listingDataMapped.msrp_base === "string"
    ) {
      const n = parseFloat(listingDataMapped.msrp_base);
      if (!Number.isNaN(n)) listingDataMapped.msrp_base = n;
    }
    if (
      listingDataMapped.msrp_max !== undefined &&
      typeof listingDataMapped.msrp_max === "string"
    ) {
      const n = parseFloat(listingDataMapped.msrp_max);
      if (!Number.isNaN(n)) listingDataMapped.msrp_max = n;
    }

    // Start a transaction to create the listing and all related specs
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("vehicle_listings")
      .insert({
        ...listingDataMapped,
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
    } = req.body as any;

    // Backward compatibility: map `images` -> primary_image_url + image_urls if provided
    const listingDataMapped: any = { ...listingData };
    if (Array.isArray((req.body as any).images)) {
      const arr = ((req.body as any).images as string[]).filter(
        (u) => !!u && u.trim() !== ""
      );
      if (arr.length > 0) {
        if (!listingDataMapped.primary_image_url)
          listingDataMapped.primary_image_url = arr[0];
        if (!listingDataMapped.image_urls)
          listingDataMapped.image_urls = arr.slice(1);
      }
      delete listingDataMapped.images;
    }

    // Coerce numeric MSRP if sent as strings
    if (
      listingDataMapped.msrp_base !== undefined &&
      typeof listingDataMapped.msrp_base === "string"
    ) {
      const n = parseFloat(listingDataMapped.msrp_base);
      if (!Number.isNaN(n)) listingDataMapped.msrp_base = n;
    }
    if (
      listingDataMapped.msrp_max !== undefined &&
      typeof listingDataMapped.msrp_max === "string"
    ) {
      const n = parseFloat(listingDataMapped.msrp_max);
      if (!Number.isNaN(n)) listingDataMapped.msrp_max = n;
    }

    // Update the main listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("vehicle_listings")
      .update({
        ...listingDataMapped,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (listingError) {
      const code = (listingError as any)?.code;
      if (code === "PGRST116") {
        throw notFoundError("Vehicle listing");
      }
      throw createError(
        `Failed to update vehicle listing: ${listingError.message}`,
        400,
        "UPDATE_LISTING_FAILED"
      );
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
// Build a query schema that preserves filter params
const adminListingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(""),
  manufacturer: Joi.string().allow(""), // slug (back-compat)
  manufacturer_id: Joi.string().uuid().allow(""),
  model: Joi.string().uuid().allow(""), // back-compat if model_id not used
  model_id: Joi.string().uuid().allow(""),
  year: Joi.string().allow(""),
  status: Joi.string()
    .valid("available", "coming_soon", "discontinued", "")
    .allow(""),
  sortBy: Joi.string()
    .valid("created_at", "updated_at", "year")
    .default("created_at"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

router.get(
  "/",
  validate(adminListingsQuerySchema, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "20",
      search,
      manufacturer,
      manufacturer_id,
      model,
      model_id,
      year,
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    // Optional manufacturer_id filter via model lookup
    let restrictModelIds: string[] | null = null;
    const mfId =
      manufacturer_id && isValidUUID(manufacturer_id)
        ? manufacturer_id
        : undefined;
    if (mfId) {
      const { data: modelRows, error: modelErr } = await supabaseAdmin
        .from("vehicle_models")
        .select("id")
        .eq("manufacturer_id", mfId);
      if (modelErr) {
        throw createError(
          "Failed to filter by manufacturer",
          500,
          "FILTER_FAILED"
        );
      }
      restrictModelIds = (modelRows || []).map((r: any) => r.id);
      if (restrictModelIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: buildPaginationMetadata(pageNum, pageSize, 0),
        });
      }
    }

    let query = supabaseAdmin
      .from("vehicle_listings")
      .select(
        `
        *,
        model:vehicle_models(
          *,
          manufacturer:vehicle_manufacturers(*)
        ),
        features:vehicle_features(
          *,
          feature:features(
            *,
            category:feature_categories(*)
          )
        )
      `,
        { count: "exact" }
      )
      .range(from, to);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (!mfId && manufacturer) {
      // Backward-compatibility: allow filtering by manufacturer slug when id not provided
      query = query.eq("model.manufacturer.slug", manufacturer);
    }

    const modelFilter = model_id || model;
    if (modelFilter) {
      query = query.eq("model_id", modelFilter);
    }

    if (restrictModelIds) {
      query = query.in("model_id", restrictModelIds);
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

// =============================================================================
// BULK EDIT (activate/deactivate/feature/unfeature/set status)
// =============================================================================

const bulkSchema = Joi.object({
  listing_ids: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(200)
    .required(),
  action: Joi.string()
    .valid("activate", "deactivate", "feature", "unfeature", "set_status")
    .required(),
  status: Joi.string()
    .valid("available", "coming_soon", "discontinued")
    .when("action", {
      is: "set_status",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
});

router.post(
  "/bulk",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = bulkSchema.validate(req.body);
    if (error) {
      throw validationError(error.message);
    }

    const { listing_ids, action, status } = value as {
      listing_ids: string[];
      action: string;
      status?: string;
    };

    const updates: any = { updated_at: new Date().toISOString() };
    if (action === "activate") updates.is_active = true;
    if (action === "deactivate") updates.is_active = false;
    if (action === "feature") updates.is_featured = true;
    if (action === "unfeature") updates.is_featured = false;
    if (action === "set_status") updates.availability_status = status;

    const { error: updErr } = await supabaseAdmin
      .from("vehicle_listings")
      .update(updates)
      .in("id", listing_ids);

    if (updErr) {
      throw createError(
        "Failed to update vehicle listings",
        500,
        "BULK_UPDATE_FAILED"
      );
    }

    res.json({ success: true, data: { updated: listing_ids.length } });
  })
);

export default router;

// =============================================================================
// BULK UPLOAD (CSV)
// =============================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * CSV format (header row required):
 * model_id,year,trim,msrp_base,msrp_max,availability_status,description,is_featured,is_active
 */
router.post(
  "/bulk-upload",
  upload.single("file"),
  asyncHandler(async (req: AuthenticatedRequest & Request, res: Response) => {
    if (!req.file) {
      throw validationError("CSV file is required");
    }

    const csvText = req.file.buffer.toString("utf-8");
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw validationError("CSV must contain a header and at least one row");
    }

    const header = lines[0].split(",").map((h) => h.trim());
    const required = [
      "model_id",
      "year",
      "trim",
      "msrp_base",
      "msrp_max",
      "availability_status",
      "description",
      "is_featured",
      "is_active",
    ];
    for (const col of required) {
      if (!header.includes(col)) {
        throw validationError(`Missing required column: ${col}`);
      }
    }

    const idx = Object.fromEntries(header.map((h, i) => [h, i] as const));

    const rows = lines.slice(1);
    const inserts: any[] = [];
    for (const line of rows) {
      const cols = line.split(",");
      if (cols.length !== header.length) continue;

      const model_id = cols[idx.model_id]?.trim();
      const yearStr = cols[idx.year]?.trim();
      const trim = cols[idx.trim]?.trim();
      const msrp_base = cols[idx.msrp_base]?.trim();
      const msrp_max = cols[idx.msrp_max]?.trim();
      const availability_status = cols[idx.availability_status]?.trim();
      const description = cols[idx.description]?.trim();
      const is_featured =
        (cols[idx.is_featured]?.trim() || "false").toLowerCase() === "true";
      const is_active =
        (cols[idx.is_active]?.trim() || "true").toLowerCase() === "true";

      if (!model_id || !isValidUUID(model_id)) continue;
      const year = parseInt(yearStr, 10);
      if (!year || Number.isNaN(year)) continue;

      inserts.push({
        model_id,
        year,
        trim: trim || null,
        msrp_base: msrp_base ? parseFloat(msrp_base) : null,
        msrp_max: msrp_max ? parseFloat(msrp_max) : null,
        availability_status: availability_status || null,
        description: description || null,
        is_featured,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (inserts.length === 0) {
      throw validationError("No valid rows found in CSV");
    }

    const { data, error } = await supabaseAdmin
      .from("vehicle_listings")
      .insert(inserts)
      .select("id")
      .range(0, inserts.length - 1);

    if (error) {
      throw createError(
        `Failed to import CSV: ${error.message}`,
        500,
        "BULK_UPLOAD_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Bulk upload completed",
      data: { inserted: data?.length || 0 },
    });
  })
);
