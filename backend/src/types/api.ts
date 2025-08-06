import { User } from "./database";

// Auth related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Vehicle related types
export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  trim?: string;
  color?: string;
  vin?: string;
  nickname?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_mileage?: number;
  battery_capacity?: number;
  estimated_range?: number;
  charging_speed?: string;
  modifications?: string[];
  notes?: string;
  is_public?: boolean;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

// Marketplace related types
export interface CreateMarketplaceListingRequest {
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  condition?: "new" | "like_new" | "good" | "fair" | "poor";
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  location?: string;
  specifications?: Record<string, any>;
  features?: string[];
  is_negotiable?: boolean;
}

export interface UpdateMarketplaceListingRequest
  extends Partial<CreateMarketplaceListingRequest> {
  status?: "active" | "sold" | "pending" | "inactive";
}

// Forum related types
export interface CreateForumPostRequest {
  title: string;
  content: string;
  category_id: string;
}

// Blog related types
export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  featured_image?: string;
  status?: "draft" | "published";
}

export interface UpdateBlogPostRequest extends Partial<CreateBlogPostRequest> {}

// Charging related types
export interface CreateChargingSessionRequest {
  vehicle_id: string;
  station_id: string;
  start_time: string;
  start_battery_level?: number;
}

export interface UpdateChargingSessionRequest {
  end_time?: string;
  end_battery_level?: number;
  energy_consumed?: number;
  cost?: number;
  payment_method?: string;
  notes?: string;
  status?: "active" | "completed" | "interrupted" | "failed";
}

export interface CreateChargingReviewRequest {
  station_id: string;
  rating: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  visit_date?: string;
  would_recommend?: boolean;
}

// Review related types
export interface CreateReviewRequest {
  business_id?: string;
  vehicle_id?: string;
  rating: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  is_verified_purchase?: boolean;
}

export interface UpdateReviewRequest extends Partial<CreateReviewRequest> {}

// Directory related types
export interface CreateDirectoryBusinessRequest {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: Record<string, any>;
  services?: string[];
  certifications?: string[];
}

export interface UpdateDirectoryBusinessRequest
  extends Partial<CreateDirectoryBusinessRequest> {}

// Notification related types
export interface CreateNotificationRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high" | "urgent";
  expires_at?: string;
}

export interface UpdateNotificationPreferencesRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  email_frequency?: "immediate" | "daily" | "weekly" | "never";
  notification_types?: Record<string, any>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

// User related types
export interface UpdateUserProfileRequest {
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  avatar_url?: string;
  privacy_settings?: Record<string, any>;
  notification_settings?: Record<string, any>;
}

// Search and filter types
export interface SearchFilters {
  category?: string;
  subcategory?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  make?: string;
  model?: string;
  year?: number;
  rating?: number;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// JWT payload type
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Database query options
export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: Record<string, "asc" | "desc">;
  limit?: number;
  offset?: number;
  include?: string[];
}

// Email types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}

// Push notification types
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
}

// Report types
export interface CreateReportRequest {
  reported_user_id?: string;
  content_type: string;
  content_id: string;
  reason: string;
  description?: string;
}

export interface UpdateReportRequest {
  status?: "pending" | "reviewing" | "resolved" | "dismissed";
  moderator_notes?: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalVehicles: number;
  totalListings: number;
  totalPosts: number;
  totalReviews: number;
  recentActivity: any[];
}

export interface ModeratorAction {
  action: "approve" | "reject" | "ban" | "warn" | "delete";
  reason?: string;
  duration?: number; // in days for bans
}
