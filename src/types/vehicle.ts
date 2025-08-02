// =============================================================================
// Vehicle Type Definitions - Enhanced for API Integration
// =============================================================================

// Basic manufacturer information - Updated to match API response
export interface VehicleManufacturer {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  country?: string;
  founded_year?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vehicle model information - Updated to match API response
export interface VehicleModel {
  id: string;
  manufacturer_id: string;
  manufacturer?: VehicleManufacturer;
  name: string;
  slug: string;
  body_type: string;
  category: string;
  first_year?: number;
  last_year?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Performance specifications - Updated to match API response
export interface VehiclePerformanceSpecs {
  id: string;
  listing_id: string;
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
  created_at: string;
  updated_at: string;
}

// Battery and charging specifications - Updated to match API response
export interface VehicleBatterySpecs {
  id: string;
  listing_id: string;
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
  created_at: string;
  updated_at: string;
}

// Physical dimensions and weight - Updated to match API response
export interface VehicleDimensionSpecs {
  id: string;
  listing_id: string;
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
  created_at: string;
  updated_at: string;
}

// Safety ratings and features - Updated to match API response
export interface VehicleSafetySpecs {
  id: string;
  listing_id: string;
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
  created_at: string;
  updated_at: string;
}

// Environmental impact data - Updated to match API response
export interface VehicleEnvironmentalSpecs {
  id: string;
  listing_id: string;
  co2_emissions_g_km?: number;
  co2_emissions_g_mi?: number;
  mpge_combined?: number;
  mpge_city?: number;
  mpge_highway?: number;
  annual_fuel_cost?: number;
  fuel_savings_vs_gas?: number;
  green_score?: number;
  created_at: string;
  updated_at: string;
}

// Feature category
export interface FeatureCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

// Individual feature
export interface Feature {
  id: string;
  categoryId: string;
  category?: FeatureCategory;
  name: string;
  slug: string;
  description?: string;
  isStandard: boolean;
}

// Vehicle feature relationship
export interface VehicleFeature {
  id: string;
  listingId: string;
  featureId: string;
  feature?: Feature;
  isStandard: boolean;
  additionalCost?: number;
  notes?: string;
}

// User rating/review
export interface VehicleRating {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  title?: string;
  reviewText?: string;
  pros?: string[];
  cons?: string[];
  ownershipDurationMonths?: number;
  wouldRecommend?: boolean;
  isVerifiedOwner: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// MAIN VEHICLE LISTING INTERFACE
// =============================================================================

// Complete vehicle listing with all specifications
export interface VehicleListing {
  id: string;
  model_id: string;
  model?: VehicleModel;
  year: number;
  trim?: string;
  variant?: string;

  // Basic Information
  name: string;
  description?: string;
  msrp_base?: number;
  msrp_max?: number;
  availability_status: string;

  // Images
  primary_image_url?: string;
  image_urls?: string[];

  // Specifications (populated via joins) - Updated to match API response
  performanceSpecs?: VehiclePerformanceSpecs[];
  batterySpecs?: VehicleBatterySpecs[];
  dimensionSpecs?: VehicleDimensionSpecs[];
  safetySpecs?: VehicleSafetySpecs[];
  environmentalSpecs?: VehicleEnvironmentalSpecs[];

  // Features (grouped by category)
  features?: {
    [categorySlug: string]: VehicleFeature[];
  };

  // User Engagement - Updated to match API response
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  like_count: number;
  rating_average?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
  likeCount: number;
  ratingAverage: number;
  ratingCount: number;

  // Recent ratings/reviews
  recentRatings?: VehicleRating[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// LEGACY INTERFACE (for backward compatibility)
// =============================================================================

// Legacy EV interface for existing components
export interface EV {
  id: string; // Changed to string to support UUIDs
  name: string;
  brand: string;
  year: number;
  range: number;
  chargingSpeed: string;
  bodyType: string;
  batteryCapacity: string;
  motorPower: string;
  acceleration: string;
  topSpeed: string;
  efficiency: string;
  availability: string;
  image: string;
  views: number;
  likes: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

// API response for vehicle listings
export interface VehicleListingsResponse {
  data: VehicleListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    manufacturers?: string[];
    bodyTypes?: string[];
    years?: number[];
    priceRange?: [number, number];
    rangeMin?: number;
    features?: string[];
  };
}

// API response for single vehicle
export interface VehicleDetailsResponse {
  data: VehicleListing;
}

// API error response
export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

// =============================================================================
// QUERY PARAMETERS
// =============================================================================

// Query parameters for vehicle listings API
export interface VehicleListingsQuery {
  page?: number;
  limit?: number;
  search?: string;
  manufacturer?: string[];
  bodyType?: string[];
  year?: number[];
  minPrice?: number;
  maxPrice?: number;
  minRange?: number;
  maxRange?: number;
  features?: string[];
  sortBy?:
    | "name"
    | "year"
    | "range"
    | "price"
    | "rating"
    | "views"
    | "created_at";
  sortOrder?: "asc" | "desc";
  featured?: boolean;
}
