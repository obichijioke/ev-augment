import express, { Router } from "express";
import {
  supabaseAdmin,
  buildPagination,
  buildPaginationMetadata,
  isValidUUID,
} from "../services/supabaseClient";
import {
  validate,
  commonSchemas,
  vehicleSchemas,
} from "../middleware/validation";
import {
  asyncHandler,
  notFoundError,
  forbiddenError,
  createError,
} from "../middleware/errorHandler";
import { reqIsOwner, reqIsModerator } from "../utils/roleUtils";

import {
  authenticateToken,
  optionalAuth,
  requireOwnership,
} from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import {
  Vehicle,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../types/database";

const router: Router = express.Router();

// @route   GET /api/vehicles
// @desc    Get all public vehicles
// @access  Public
router.get(
  "/",
  optionalAuth,
  validate(commonSchemas.pagination, "query"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      page = "1",
      limit = "20",
      make,
      model,
      year,
      sort = "desc",
      sortBy = "created_at",
    } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    let query = supabaseAdmin
      .from("vehicles")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .range(from, to);

    // Apply filters
    if (make) {
      query = query.ilike("make", `%${make}%`);
    }
    if (model) {
      query = query.ilike("model", `%${model}%`);
    }
    if (year) {
      const yearInt = parseInt(year);
      if (!isNaN(yearInt)) {
        query = query.eq("year", yearInt);
      }
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "year",
      "make",
      "model",
      "current_mileage",
    ];
    const validSortOrders = ["asc", "desc"];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortOrder = validSortOrders.includes(sort) ? sort : "desc";

    query = query.order(sortField, { ascending: sortOrder === "asc" });

    const { data: vehicles, error, count } = await query;

    if (error) {
      throw createError(
        "Failed to fetch vehicles",
        500,
        "FETCH_VEHICLES_FAILED"
      );
    }

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: vehicles || [],
      pagination,
    } as PaginatedResponse<Vehicle>);
  })
);

// @route   POST /api/vehicles
// @desc    Create a new vehicle
// @access  Private
router.post(
  "/",
  authenticateToken,
  validate(vehicleSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const vehicleData = {
      ...req.body,
      owner_id: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: vehicle, error } = await supabaseAdmin
      .from("vehicles")
      .insert(vehicleData)
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `
      )
      .single();

    if (error) {
      throw createError(
        "Failed to create vehicle",
        500,
        "CREATE_VEHICLE_FAILED"
      );
    }

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: { vehicle },
    } as ApiResponse<{ vehicle: Vehicle }>);
  })
);

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Public (if public) / Private (if owner)
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      throw notFoundError("Vehicle");
    }

    const { data: vehicle, error } = await supabaseAdmin
      .from("vehicles")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified, is_business)
    `
      )
      .eq("id", id)
      .single();

    if (error || !vehicle) {
      throw notFoundError("Vehicle");
    }

    // Check if user can view this vehicle
    const isOwner = reqIsOwner(req as any, vehicle.owner_id);
    const isAdminOrMod = reqIsModerator(req as any);

    if (!vehicle.is_public && !isOwner && !isAdminOrMod) {
      throw forbiddenError("This vehicle is private");
    }

    res.json({
      success: true,
      data: { vehicle },
    } as ApiResponse<{ vehicle: Vehicle }>);
  })
);

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (owner only)
router.put(
  "/:id",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  validate(vehicleSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data: vehicle, error } = await supabaseAdmin
      .from("vehicles")
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
      throw createError(
        "Failed to update vehicle",
        500,
        "UPDATE_VEHICLE_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: { vehicle },
    } as ApiResponse<{ vehicle: Vehicle }>);
  })
);

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (owner only)
router.delete(
  "/:id",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      throw createError(
        "Failed to delete vehicle",
        500,
        "DELETE_VEHICLE_FAILED"
      );
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    } as ApiResponse);
  })
);

// @route   GET /api/vehicles/:id/maintenance
// @desc    Get vehicle maintenance records
// @access  Private (owner only)
router.get(
  "/:id/maintenance",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    const {
      data: maintenance,
      error,
      count,
    } = await supabaseAdmin
      .from("vehicle_maintenance")
      .select("*", { count: "exact" })
      .eq("vehicle_id", id)
      .order("date", { ascending: false })
      .range(from, to);

    if (error) {
      throw createError(
        "Failed to fetch maintenance records",
        500,
        "FETCH_MAINTENANCE_FAILED"
      );
    }

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: maintenance || [],
      pagination,
    } as PaginatedResponse);
  })
);

// @route   POST /api/vehicles/:id/maintenance
// @desc    Add vehicle maintenance record
// @access  Private (owner only)
router.post(
  "/:id/maintenance",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const maintenanceData = {
      ...req.body,
      vehicle_id: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: maintenance, error } = await supabaseAdmin
      .from("vehicle_maintenance")
      .insert(maintenanceData)
      .select()
      .single();

    if (error) {
      throw createError(
        "Failed to add maintenance record",
        500,
        "ADD_MAINTENANCE_FAILED"
      );
    }

    res.status(201).json({
      success: true,
      message: "Maintenance record added successfully",
      data: { maintenance },
    } as ApiResponse<{ maintenance: any }>);
  })
);

// @route   GET /api/vehicles/:id/charging-sessions
// @desc    Get vehicle charging sessions
// @access  Private (owner only)
router.get(
  "/:id/charging-sessions",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    const {
      data: sessions,
      error,
      count,
    } = await supabaseAdmin
      .from("charging_sessions")
      .select(
        `
      *,
      charging_stations(name, address, city, state)
    `,
        { count: "exact" }
      )
      .eq("vehicle_id", id)
      .order("start_time", { ascending: false })
      .range(from, to);

    if (error) {
      throw createError(
        "Failed to fetch charging sessions",
        500,
        "FETCH_SESSIONS_FAILED"
      );
    }

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: sessions || [],
      pagination,
    } as PaginatedResponse);
  })
);

// @route   POST /api/vehicles/:id/charging-sessions
// @desc    Add vehicle charging session
// @access  Private (owner only)
router.post(
  "/:id/charging-sessions",
  authenticateToken,
  requireOwnership("vehicles", "owner_id"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const sessionData = {
      ...req.body,
      vehicle_id: id,
      user_id: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: session, error } = await supabaseAdmin
      .from("charging_sessions")
      .insert(sessionData)
      .select(
        `
      *,
      charging_stations(name, address, city, state)
    `
      )
      .single();

    if (error) {
      throw createError(
        "Failed to add charging session",
        500,
        "ADD_SESSION_FAILED"
      );
    }

    res.status(201).json({
      success: true,
      message: "Charging session added successfully",
      data: { session },
    } as ApiResponse<{ session: any }>);
  })
);

// @route   GET /api/vehicles/search
// @desc    Search vehicles
// @access  Public
router.get(
  "/search",
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      q: query = "",
      make,
      model,
      minYear,
      maxYear,
      minRange,
      maxRange,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const { from, to } = buildPagination(pageNum, pageSize);

    let searchQuery = supabaseAdmin
      .from("vehicles")
      .select(
        `
      *,
      users(username, full_name, avatar_url, is_verified)
    `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .range(from, to);

    // Text search
    if (query && query.length >= 2) {
      searchQuery = searchQuery.or(
        `make.ilike.%${query}%, model.ilike.%${query}%, nickname.ilike.%${query}%`
      );
    }

    // Filters
    if (make) {
      searchQuery = searchQuery.ilike("make", `%${make}%`);
    }
    if (model) {
      searchQuery = searchQuery.ilike("model", `%${model}%`);
    }
    if (minYear) {
      const year = parseInt(minYear);
      if (!isNaN(year)) {
        searchQuery = searchQuery.gte("year", year);
      }
    }
    if (maxYear) {
      const year = parseInt(maxYear);
      if (!isNaN(year)) {
        searchQuery = searchQuery.lte("year", year);
      }
    }
    if (minRange) {
      const range = parseInt(minRange);
      if (!isNaN(range)) {
        searchQuery = searchQuery.gte("estimated_range", range);
      }
    }
    if (maxRange) {
      const range = parseInt(maxRange);
      if (!isNaN(range)) {
        searchQuery = searchQuery.lte("estimated_range", range);
      }
    }

    searchQuery = searchQuery.order("created_at", { ascending: false });

    const { data: vehicles, error, count } = await searchQuery;

    if (error) {
      throw createError(
        "Failed to search vehicles",
        500,
        "SEARCH_VEHICLES_FAILED"
      );
    }

    const pagination = buildPaginationMetadata(pageNum, pageSize, count || 0);

    res.json({
      success: true,
      data: vehicles || [],
      pagination,
    } as PaginatedResponse<Vehicle>);
  })
);

export default router;
