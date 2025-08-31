# Supabase Database Tables Overview

Generated on: $(date)

## Summary

Total Tables: 46 tables in the `public` schema
Platform: EV-focused community platform with marketplace, forums, and vehicle catalog

---

## User & Authentication Tables

### users (9 rows)

Main user profiles with basic info, business details, and notification settings

- **Primary Key:** id (uuid)
- **Key Fields:** email, username, full_name, avatar_url, bio, location, website, phone
- **Features:** is_verified, is_business, business_name, privacy_settings, notification_settings
- **RLS Enabled:** Yes

### user_profiles (9 rows)

Extended user profiles with forum data, permissions, and social links

- **Primary Key:** id (uuid)
- **Key Fields:** username, email, role, account_status, reputation_score
- **Forum Stats:** total_posts, total_replies, total_likes_received, forum_reputation
- **Social:** twitter_handle, linkedin_url, github_username
- **RLS Enabled:** Yes

---

## Vehicle & EV Listings Tables

### ev_listings (0 rows)

Electric vehicle catalog/database

- **Primary Key:** id (uuid)
- **Key Fields:** make, model, year, trim, body_type, drivetrain
- **Specs:** battery_capacity, range_epa, range_wltp, acceleration_0_60, top_speed
- **Pricing:** starting_price, max_price, availability_status
- **RLS Enabled:** No

### vehicle_manufacturers (12 rows)

Car manufacturers (Tesla, Ford, etc.)

- **Primary Key:** id (uuid)
- **Key Fields:** name, slug, logo_url, website, country, founded_year
- **RLS Enabled:** No

### vehicle_models (24 rows)

Vehicle models per manufacturer

- **Primary Key:** id (uuid)
- **Key Fields:** manufacturer_id, name, slug, body_type, category
- **Years:** first_year, last_year
- **RLS Enabled:** No

### vehicle_listings (13 rows)

Main vehicle catalog with pricing and availability

- **Primary Key:** id (uuid)
- **Key Fields:** model_id, year, trim, variant, name, description
- **Pricing:** msrp_base, msrp_max, availability_status
- **Engagement:** view_count, like_count, rating_average, rating_count
- **RLS Enabled:** No

### vehicle_performance_specs (10 rows)

Performance data (range, acceleration, etc.)

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, range_epa, range_wltp, acceleration_0_60, top_speed
- **Power:** motor_power_hp, motor_power_kw, motor_torque_lb_ft, drivetrain
- **RLS Enabled:** No

### vehicle_battery_specs (10 rows)

Battery capacity, charging specs

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, battery_capacity_kwh, battery_usable_kwh, battery_type
- **Charging:** charging_speed_dc_max, charging_speed_ac_max, charging_time_10_80_dc
- **Warranty:** battery_warranty_years, battery_warranty_miles
- **RLS Enabled:** No

### vehicle_dimension_specs (10 rows)

Size, weight, cargo space

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, length_in, width_in, height_in, wheelbase_in
- **Weight:** curb_weight_lbs, gross_weight_lbs, payload_capacity_lbs
- **Interior:** seating_capacity, cargo_space_cu_ft, front_legroom_in
- **RLS Enabled:** No

### vehicle_safety_specs (20 rows)

Safety ratings and features

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, nhtsa_overall_rating, iihs_overall_award
- **Features:** has_automatic_emergency_braking, has_blind_spot_monitoring, has_lane_keep_assist
- **RLS Enabled:** No

### vehicle_environmental_specs (10 rows)

Emissions, efficiency data

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, co2_emissions_g_km, mpge_combined, annual_fuel_cost
- **Savings:** fuel_savings_vs_gas, green_score
- **RLS Enabled:** No

### vehicles (0 rows)

User-owned vehicles in garage

- **Primary Key:** id (uuid)
- **Key Fields:** owner_id, make, model, year, trim, color, vin, nickname
- **Details:** purchase_date, purchase_price, current_mileage, battery_capacity
- **RLS Enabled:** Yes

---

## Feature Management Tables

### feature_categories (6 rows)

Categories for vehicle features

- **Primary Key:** id (uuid)
- **Key Fields:** name, slug, description, icon, sort_order
- **RLS Enabled:** No

### features (37 rows)

Individual vehicle features

- **Primary Key:** id (uuid)
- **Key Fields:** category_id, name, slug, description, is_standard
- **RLS Enabled:** No

### vehicle_features (29 rows)

Features linked to specific vehicles

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, feature_id, is_standard, additional_cost
- **RLS Enabled:** No

---

## Marketplace Tables

### marketplace_listings (0 rows)

Items for sale

- **Primary Key:** id (uuid)
- **Key Fields:** seller_id, title, description, category, price, condition
- **Details:** brand, model, year, mileage, location, is_negotiable
- **Status:** status, views, is_active
- **RLS Enabled:** Yes

### marketplace_categories (5 rows)

Categories for marketplace items

- **Primary Key:** id (uuid)
- **Key Fields:** name, description, slug, parent_id, icon
- **RLS Enabled:** No

### marketplace_images (0 rows)

Images for marketplace listings

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, image_url, alt_text, sort_order, is_primary
- **RLS Enabled:** No

### wanted_ads (0 rows)

Wanted/looking-for ads

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, title, description, category, budget_min, budget_max
- **Details:** preferred_location, requirements, contact_preferences
- **RLS Enabled:** No

---

## Charging & Directory Tables

### charging_stations (0 rows)

EV charging station locations

- **Primary Key:** id (uuid)
- **Key Fields:** name, address, city, state, latitude, longitude
- **Details:** network, connector_types, power_levels, pricing_info, amenities
- **Status:** is_operational, last_verified
- **RLS Enabled:** No

### charging_sessions (0 rows)

User charging history

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, vehicle_id, station_id, start_time, end_time
- **Battery:** start_battery_level, end_battery_level, energy_consumed
- **Payment:** cost, payment_method
- **RLS Enabled:** Yes

### charging_reviews (0 rows)

Reviews of charging stations

- **Primary Key:** id (uuid)
- **Key Fields:** station_id, user_id, rating, title, content
- **Details:** pros, cons, visit_date, would_recommend
- **RLS Enabled:** No

### directory_businesses (0 rows)

Business directory listings

- **Primary Key:** id (uuid)
- **Key Fields:** owner_id, name, category, description, address
- **Contact:** phone, email, website, business_hours
- **Features:** services, certifications, is_verified, is_featured
- **RLS Enabled:** No

---

## Forum Tables

### forum_categories (6 rows)

Forum discussion categories

- **Primary Key:** id (uuid)
- **Key Fields:** name, description, icon, color, slug
- **Stats:** thread_count, post_count, last_activity_at
- **RLS Enabled:** Yes

### forum_threads (13 rows)

Forum discussion threads

- **Primary Key:** id (uuid)
- **Key Fields:** category_id, author_id, title, content, slug
- **Status:** is_pinned, is_locked, is_deleted
- **Stats:** view_count, reply_count, last_reply_at, last_reply_by
- **RLS Enabled:** Yes

### forum_replies (7 rows)

Replies to forum threads

- **Primary Key:** id (uuid)
- **Key Fields:** thread_id, author_id, parent_id, content
- **Structure:** nesting_level (max 1), is_deleted
- **RLS Enabled:** Yes

### forum_images (6 rows)

Images uploaded to forum posts

- **Primary Key:** id (uuid)
- **Key Fields:** thread_id, reply_id, author_id, filename, storage_path
- **Details:** file_size, mime_type, width, height, alt_text
- **RLS Enabled:** Yes

---

## Content & Engagement Tables

### blog_posts (7 rows)

Blog articles

- **Primary Key:** id (uuid)
- **Key Fields:** author_id, title, slug, excerpt, content
- **Media:** featured_image, category, tags
- **Status:** status (draft/published/archived), is_featured
- **Stats:** view_count, like_count, comment_count
- **RLS Enabled:** No

### blog_comments (6 rows)

Comments on blog posts

- **Primary Key:** id (uuid)
- **Key Fields:** post_id, author_id, parent_id, content
- **Moderation:** is_approved, like_count
- **RLS Enabled:** No

### reviews (9 rows)

General reviews system

- **Primary Key:** id (uuid)
- **Key Fields:** reviewer_id, business_id, vehicle_id, rating, title, content
- **Details:** pros, cons, is_verified_purchase, helpful_count
- **Polymorphic:** entity_type, entity_id
- **RLS Enabled:** No

### vehicle_reviews (5 rows)

Specific vehicle reviews

- **Primary Key:** id (uuid)
- **Key Fields:** vehicle_listing_id, user_id, reviewer_name, rating, title
- **Content:** review_text
- **RLS Enabled:** No

### vehicle_views (628 rows)

Vehicle page view tracking

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, user_id, ip_address, user_agent, viewed_at
- **RLS Enabled:** No

### vehicle_likes (0 rows)

Vehicle likes/favorites

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, user_id
- **RLS Enabled:** No

### vehicle_ratings (0 rows)

Vehicle ratings

- **Primary Key:** id (uuid)
- **Key Fields:** listing_id, user_id, rating, title, review_text
- **Details:** pros, cons, ownership_duration_months, would_recommend
- **Verification:** is_verified_owner, helpful_count
- **RLS Enabled:** No

### likes (5 rows)

General likes system

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, entity_type, entity_id
- **RLS Enabled:** No

---

## System & Admin Tables

### notifications (0 rows)

User notifications

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, type, title, message, data
- **Status:** priority, is_read, read_at, expires_at
- **RLS Enabled:** Yes

### notification_preferences (0 rows)

User notification settings

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, email_notifications, push_notifications, sms_notifications
- **Timing:** email_frequency, quiet_hours_start, quiet_hours_end, timezone
- **Types:** notification_types (JSON)
- **RLS Enabled:** Yes

### file_uploads (24 rows)

File upload tracking

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, filename, original_name, file_path
- **Details:** file_size, mime_type, upload_type, entity_type, entity_id
- **Metadata:** alt_text, caption, is_active
- **RLS Enabled:** Yes

### audit_logs (0 rows)

System audit trail

- **Primary Key:** id (uuid)
- **Key Fields:** user_id, action, resource_type, resource_id
- **Changes:** old_values, new_values
- **Context:** ip_address, user_agent
- **RLS Enabled:** No

### system_settings (6 rows)

Application configuration

- **Primary Key:** id (uuid)
- **Key Fields:** key, value (JSON), description, is_public
- **RLS Enabled:** No

### reports (0 rows)

Content moderation reports

- **Primary Key:** id (uuid)
- **Key Fields:** reporter_id, reported_user_id, content_type, content_id
- **Details:** reason, description, status
- **Moderation:** moderator_id, moderator_notes, resolved_at
- **RLS Enabled:** Yes

---

## Key Relationships

### User Ecosystem

- `users` ↔ `user_profiles` (1:1)
- `users` → `vehicles` (1:many)
- `users` → `marketplace_listings` (1:many)
- `users` → `forum_threads` (1:many)
- `users` → `forum_replies` (1:many)

### Vehicle Catalog

- `vehicle_manufacturers` → `vehicle_models` (1:many)
- `vehicle_models` → `vehicle_listings` (1:many)
- `vehicle_listings` → `vehicle_*_specs` (1:1 each)
- `vehicle_listings` → `vehicle_features` (1:many)
- `features` ← `feature_categories` (many:1)

### Engagement Systems

- `vehicle_listings` → `vehicle_views` (1:many)
- `vehicle_listings` → `vehicle_likes` (1:many)
- `vehicle_listings` → `vehicle_reviews` (1:many)
- Generic `likes` system for any entity

### Content Management

- `blog_posts` → `blog_comments` (1:many)
- `forum_threads` → `forum_replies` (1:many)
- `forum_threads` ↔ `forum_images` (1:many)
- `forum_replies` ↔ `forum_images` (1:many)

---

## Security & Permissions

### Row Level Security (RLS) Enabled Tables:

- All user-related tables
- Forum tables
- Vehicle ownership (user vehicles)
- Marketplace listings
- Charging sessions
- Notifications
- File uploads
- Reports

### Public Tables (No RLS):

- Vehicle catalog and specifications
- Manufacturers and models
- Feature definitions
- System settings
- Blog content
- Reviews and ratings

---

## Platform Features Summary

✅ **User Management** - Complete user profiles with business accounts
✅ **Vehicle Catalog** - Comprehensive EV database with detailed specs
✅ **Marketplace** - Buy/sell platform with categories and images
✅ **Forums** - Discussion system with categories, threads, and replies
✅ **Charging Infrastructure** - Station locations, sessions, and reviews
✅ **Content Management** - Blog system with comments
✅ **Engagement** - Likes, reviews, ratings, and view tracking
✅ **File Management** - Upload system with metadata
✅ **Notifications** - User notification system with preferences
✅ **Moderation** - Reporting system and audit logs
✅ **Business Directory** - EV-related business listings

The platform is well-structured for a comprehensive EV community with marketplace, educational content, and social features.
