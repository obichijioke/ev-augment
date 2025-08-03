// =============================================================================
// Vehicle API Service - Frontend API Integration
// =============================================================================

import {
  VehicleListing,
  VehicleListingsResponse,
  VehicleDetailsResponse,
  VehicleListingsQuery,
  ApiErrorResponse,
} from "@/types/vehicle";

// Base API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          "HTTP_ERROR"
        );
      }

      throw new ApiError(
        errorData.error.message,
        response.status,
        errorData.error.code,
        errorData.error.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      "Network error or server unavailable",
      0,
      "NETWORK_ERROR",
      error
    );
  }
}

// Build query string from parameters
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
}

// =============================================================================
// VEHICLE API FUNCTIONS
// =============================================================================

/**
 * Fetch vehicle listings with optional filtering and pagination
 */
export async function fetchVehicleListings(
  query: VehicleListingsQuery = {}
): Promise<VehicleListingsResponse> {
  const queryString = buildQueryString(query);
  const endpoint = `/vehicle-listings${queryString ? `?${queryString}` : ""}`;

  return apiRequest<VehicleListingsResponse>(endpoint);
}

/**
 * Fetch detailed information for a specific vehicle
 */
export async function fetchVehicleDetails(
  vehicleId: string
): Promise<VehicleDetailsResponse> {
  return apiRequest<VehicleDetailsResponse>(`/vehicle-listings/${vehicleId}`);
}

/**
 * Record a vehicle view (for analytics)
 */
export async function recordVehicleView(
  vehicleId: string,
  userId?: string
): Promise<void> {
  await apiRequest(`/vehicle-listings/${vehicleId}/view`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/**
 * Toggle vehicle like/favorite status
 */
export async function toggleVehicleLike(
  vehicleId: string,
  userId: string
): Promise<{ liked: boolean; likeCount: number }> {
  return apiRequest(`/vehicle-listings/${vehicleId}/like`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/**
 * Submit a vehicle rating/review
 */
export async function submitVehicleRating(
  vehicleId: string,
  userId: string,
  ratingData: {
    rating: number;
    title?: string;
    reviewText?: string;
    pros?: string[];
    cons?: string[];
    ownershipDurationMonths?: number;
    wouldRecommend?: boolean;
  }
): Promise<void> {
  await apiRequest(`/vehicle-listings/${vehicleId}/ratings`, {
    method: "POST",
    body: JSON.stringify({ userId, ...ratingData }),
  });
}

/**
 * Fetch vehicle ratings/reviews
 */
export async function fetchVehicleRatings(
  vehicleId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const queryString = buildQueryString({ page, limit });
  return apiRequest(`/vehicle-listings/${vehicleId}/ratings?${queryString}`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert VehicleListing to legacy EV format for backward compatibility
 */
export function vehicleListingToEV(listing: VehicleListing): any {
  // Get first specs from arrays (API returns arrays)
  const performanceSpec = listing.performanceSpecs?.[0];
  const batterySpec = listing.batterySpecs?.[0];

  return {
    id: listing.id, // Keep UUID as string for unique identification
    name: listing.name,
    brand: listing.model?.manufacturer?.name || "Unknown",
    year: listing.year,
    range: performanceSpec?.range_epa || 0,
    chargingSpeed: batterySpec?.charging_speed_dc_max
      ? `${batterySpec.charging_speed_dc_max}kW`
      : "Unknown",
    bodyType: listing.model?.body_type || "Unknown",
    batteryCapacity: batterySpec?.battery_capacity_kwh
      ? `${batterySpec.battery_capacity_kwh}kWh`
      : "Unknown",
    motorPower: performanceSpec?.motor_power_hp
      ? `${performanceSpec.motor_power_hp}hp`
      : "Unknown",
    acceleration: performanceSpec?.acceleration_0_60
      ? `${performanceSpec.acceleration_0_60}s`
      : "Unknown",
    topSpeed: performanceSpec?.top_speed
      ? `${performanceSpec.top_speed}mph`
      : "Unknown",
    efficiency: performanceSpec?.efficiency_epa
      ? `${performanceSpec.efficiency_epa} mi/kWh`
      : "Unknown",
    availability: listing.availability_status,
    image: listing.primary_image_url || listing.image_urls?.[0] || "",
    views: listing.view_count,
    likes: listing.like_count,
  };
}

/**
 * Format specifications for display
 */
export function formatSpecification(
  value: number | string | undefined,
  unit: string,
  fallback: string = "N/A"
): string {
  if (value === undefined || value === null) return fallback;
  return `${value}${unit}`;
}

/**
 * Get availability status color class
 */
export function getAvailabilityColor(status: string): string {
  switch (status.toLowerCase()) {
    case "available":
      return "bg-green-100 text-green-800";
    case "limited":
      return "bg-yellow-100 text-yellow-800";
    case "pre-order":
      return "bg-blue-100 text-blue-800";
    case "discontinued":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// =============================================================================
// MOCK DATA FALLBACK (for development)
// =============================================================================

/**
 * Generate mock vehicle listings for development/testing
 * This should be removed in production
 */
export function generateMockVehicleListings(): VehicleListingsResponse {
  // This would be replaced with actual API calls in production
  // For now, return empty data to force proper API integration
  return {
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}
