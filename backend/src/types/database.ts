// Database type definitions based on schema.sql

import { Request } from 'express';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  is_verified: boolean;
  is_business: boolean;
  business_name?: string;
  business_type?: string;
  join_date: Date;
  last_active: Date;
  privacy_settings: Record<string, any>;
  notification_settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  email_verified_at?: Date;
  password_changed_at?: Date;
  last_login_at?: Date;
  login_count: number;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  color?: string;
  vin?: string;
  nickname?: string;
  purchase_date?: Date;
  purchase_price?: number;
  current_mileage?: number;
  battery_capacity?: number;
  estimated_range?: number;
  charging_speed?: string;
  modifications?: string[];
  notes?: string;
  images?: string[];
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EVListing {
  id: string;
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
  availability_status?: string;
  images?: string[];
  specifications?: Record<string, any>;
  features?: string[];
  description?: string;
  manufacturer_website?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  location?: string;
  images?: string[];
  specifications?: Record<string, any>;
  features?: string[];
  is_negotiable: boolean;
  is_active: boolean;
  status: 'active' | 'sold' | 'pending' | 'inactive';
  views: number;
  created_at: Date;
  updated_at: Date;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface MarketplaceImage {
  id: string;
  listing_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: Date;
}

export interface WantedAd {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  requirements?: Record<string, any>;
  contact_preferences?: Record<string, any>;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  post_count: number;
  last_post_id?: string;
  last_post_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ForumPost {
  id: string;
  author_id: string;
  category_id: string;
  title: string;
  content: string;
  slug: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  last_activity_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  edited_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ForumLike {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: Date;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  network?: string;
  station_type?: string;
  connector_types?: string[];
  power_levels?: string[];
  pricing_info?: Record<string, any>;
  amenities?: string[];
  hours_of_operation?: Record<string, any>;
  phone?: string;
  website?: string;
  is_operational: boolean;
  last_verified?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ChargingSession {
  id: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  start_time: Date;
  end_time?: Date;
  start_battery_level?: number;
  end_battery_level?: number;
  energy_consumed?: number;
  cost?: number;
  payment_method?: string;
  notes?: string;
  status: 'active' | 'completed' | 'interrupted' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface ChargingReview {
  id: string;
  station_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  visit_date?: Date;
  would_recommend?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DirectoryBusiness {
  id: string;
  owner_id?: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: Record<string, any>;
  services?: string[];
  certifications?: string[];
  images?: string[];
  is_verified: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  reviewer_id: string;
  business_id?: string;
  vehicle_id?: string;
  rating: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  notification_types: Record<string, any>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  is_approved: boolean;
  like_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  content_type: string;
  content_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  moderator_id?: string;
  moderator_notes?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request types
export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: SupabaseUser;
  userId?: string;
  token?: string;
  ownershipCheck?: {
    resourceId: string;
    userId: string;
    userIdField: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
}