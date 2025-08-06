import {
  VehicleListing,
  VehicleManufacturer,
  VehicleModel,
} from "@/types/vehicle";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface CreateVehicleListingRequest {
  // Basic Information
  name: string;
  model_id: string;
  year: number;
  trim?: string;
  variant?: string;
  description?: string;
  msrp_base?: number;
  msrp_max?: number;
  availability_status: "available" | "coming_soon" | "discontinued";

  // Images
  primary_image_url?: string;
  image_urls?: string[];

  // Specifications
  performanceSpecs?: {
    range_epa?: number;
    range_wltp?: number;
    range_real_world?: number;
    efficiency_epa?: number;
    efficiency_real_world?: number;
    acceleration_0_60?: number;
    acceleration_0_100?: number;
    top_speed?: number;
    quarter_mile_time?: number;
    motor_power_hp?: number;
    motor_power_kw?: number;
    motor_torque_lb_ft?: number;
    motor_torque_nm?: number;
    motor_count?: number;
    drivetrain?: string;
  };

  batterySpecs?: {
    battery_capacity_kwh?: number;
    battery_usable_kwh?: number;
    battery_type?: string;
    battery_chemistry?: string;
    battery_warranty_years?: number;
    battery_warranty_miles?: number;
    charging_speed_dc_max?: number;
    charging_speed_ac_max?: number;
    charging_time_10_80_dc?: number;
    charging_time_0_100_ac?: number;
    charging_port_type?: string;
  };

  dimensionSpecs?: {
    length_in?: number;
    width_in?: number;
    height_in?: number;
    wheelbase_in?: number;
    ground_clearance_in?: number;
    curb_weight_lbs?: number;
    gross_weight_lbs?: number;
    payload_capacity_lbs?: number;
    towing_capacity_lbs?: number;
    seating_capacity?: number;
    cargo_space_cu_ft?: number;
    cargo_space_seats_down_cu_ft?: number;
    front_headroom_in?: number;
    rear_headroom_in?: number;
    front_legroom_in?: number;
    rear_legroom_in?: number;
  };

  safetySpecs?: {
    nhtsa_overall_rating?: number;
    nhtsa_frontal_rating?: number;
    nhtsa_side_rating?: number;
    nhtsa_rollover_rating?: number;
    iihs_overall_award?: string;
    iihs_moderate_overlap_front?: string;
    iihs_side_impact?: string;
    iihs_roof_strength?: string;
    iihs_head_restraints?: string;
    airbag_count?: number;
    has_automatic_emergency_braking?: boolean;
    has_blind_spot_monitoring?: boolean;
    has_lane_keep_assist?: boolean;
    has_adaptive_cruise_control?: boolean;
    has_forward_collision_warning?: boolean;
    has_rear_cross_traffic_alert?: boolean;
    has_driver_attention_monitoring?: boolean;
  };

  environmentalSpecs?: {
    co2_emissions_g_km?: number;
    co2_emissions_g_mi?: number;
    mpge_combined?: number;
    mpge_city?: number;
    mpge_highway?: number;
    annual_fuel_cost?: number;
    fuel_savings_vs_gas?: number;
    green_score?: number;
  };

  // Features
  features?: string[];

  // Status
  is_featured?: boolean;
  is_active?: boolean;
}

export interface UpdateVehicleListingRequest
  extends Partial<CreateVehicleListingRequest> {}

export interface AdminVehicleListingsQuery {
  page?: number;
  limit?: number;
  search?: string;
  manufacturer?: string;
  year?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminVehicleListingsResponse {
  success: boolean;
  data: VehicleListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface VehicleListingResponse {
  success: boolean;
  message: string;
  data: {
    listing: VehicleListing;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: {
    status: number;
    code?: string;
  };
}

// =============================================================================
// API UTILITY FUNCTIONS
// =============================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;

  let accessToken = null;
  if (token) {
    try {
      const authData = JSON.parse(token);
      accessToken = authData?.state?.session?.accessToken;
    } catch (error) {
      console.error("Error parsing auth token:", error);
    }
  }

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      success: false,
      message: errorData.message || `HTTP error! status: ${response.status}`,
      error: {
        status: response.status,
        code: errorData.code,
      },
    } as ApiError;
  }

  return response.json();
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

// =============================================================================
// ADMIN VEHICLE LISTING API FUNCTIONS
// =============================================================================

/**
 * Create a new vehicle listing (Admin only)
 */
export async function createVehicleListing(
  data: CreateVehicleListingRequest
): Promise<VehicleListingResponse> {
  return apiRequest<VehicleListingResponse>("/admin/vehicle-listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing vehicle listing (Admin only)
 */
export async function updateVehicleListing(
  id: string,
  data: UpdateVehicleListingRequest
): Promise<VehicleListingResponse> {
  return apiRequest<VehicleListingResponse>(`/admin/vehicle-listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a vehicle listing (Admin only)
 */
export async function deleteVehicleListing(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/admin/vehicle-listings/${id}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Get all vehicle listings for admin management
 */
export async function getAdminVehicleListings(
  query: AdminVehicleListingsQuery = {}
): Promise<AdminVehicleListingsResponse> {
  const queryString = buildQueryString(query);
  const endpoint = `/admin/vehicle-listings${
    queryString ? `?${queryString}` : ""
  }`;

  return apiRequest<AdminVehicleListingsResponse>(endpoint);
}

/**
 * Get all manufacturers for dropdown selection
 */
export async function getManufacturers(): Promise<{
  success: boolean;
  data: VehicleManufacturer[];
}> {
  return apiRequest<{ success: boolean; data: VehicleManufacturer[] }>(
    "/vehicle-listings/manufacturers"
  );
}

/**
 * Get models for a specific manufacturer
 */
export async function getModelsByManufacturer(
  manufacturerId: string
): Promise<{ success: boolean; data: VehicleModel[] }> {
  return apiRequest<{ success: boolean; data: VehicleModel[] }>(
    `/vehicle-listings/manufacturers/${manufacturerId}/models`
  );
}

/**
 * Get all available features for selection
 */
export async function getAvailableFeatures(): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}> {
  return apiRequest<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  }>("/vehicle-listings/features");
}
