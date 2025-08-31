# Data Models

Core data models for the EV Community Platform API.

## User Models

### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Valid email address
  username: string;              // 3-30 characters, alphanumeric + underscore
  full_name?: string;            // Optional display name
  avatar_url?: string;           // Profile image URL
  bio?: string;                  // User biography
  location?: string;             // User location
  website?: string;              // Personal website URL
  phone?: string;                // Phone number
  is_verified: boolean;          // Account verification status
  is_business: boolean;          // Business account flag
  business_name?: string;        // Business name (if business account)
  business_type?: string;        // Type of business
  join_date: Date;               // Account creation date
  last_active: Date;             // Last activity timestamp
  privacy_settings: object;     // Privacy preferences
  notification_settings: object; // Notification preferences
  created_at: Date;
  updated_at: Date;
}
```

### UserProfile
```typescript
interface UserProfile {
  id: string;                    // UUID (matches User.id)
  username: string;              // Username
  email: string;                 // Email address
  role: "user" | "moderator" | "admin"; // System role
  is_active: boolean;            // Account active status
  email_verified: boolean;       // Email verification status
  email_verified_at?: Date;      // Email verification timestamp
  password_changed_at?: Date;    // Last password change
  last_login_at?: Date;          // Last login timestamp
  login_count: number;           // Total login count
  preferences: object;           // User preferences
  created_at: Date;
  updated_at: Date;
}
```

## Vehicle Models

### Vehicle
```typescript
interface Vehicle {
  id: string;                    // UUID
  owner_id: string;              // User UUID
  make: string;                  // Vehicle manufacturer
  model: string;                 // Vehicle model
  year: number;                  // Model year (1900-2030)
  trim?: string;                 // Trim level
  color?: string;                // Vehicle color
  vin?: string;                  // Vehicle identification number
  nickname?: string;             // User-defined nickname
  purchase_date?: Date;          // Purchase date
  purchase_price?: number;       // Purchase price
  current_mileage?: number;      // Current odometer reading
  battery_capacity?: number;     // Battery capacity in kWh
  estimated_range?: number;      // Estimated range in miles
  charging_speed?: string;       // Charging speed description
  modifications?: string[];      // List of modifications
  notes?: string;                // User notes
  images?: string[];             // Array of image URLs
  is_public: boolean;            // Public visibility
  created_at: Date;
  updated_at: Date;
}
```

### EVListing
```typescript
interface EVListing {
  id: string;                    // UUID
  make: string;                  // Manufacturer (required, max 50 chars)
  model: string;                 // Model name (required, max 50 chars)
  year: number;                  // Model year (2010 to current+2)
  trim?: string;                 // Trim level
  body_type?: string;            // Body type (sedan, suv, truck, etc.)
  drivetrain?: string;           // Drivetrain type (FWD, RWD, AWD)
  battery_capacity?: number;     // Battery capacity in kWh
  range_epa?: number;            // EPA range in miles
  range_wltp?: number;           // WLTP range in km
  acceleration_0_60?: number;    // 0-60 mph time in seconds
  top_speed?: number;            // Top speed in mph
  charging_speed_dc?: number;    // DC fast charging speed in kW
  charging_speed_ac?: number;    // AC charging speed in kW
  starting_price?: number;       // Starting MSRP
  max_price?: number;            // Maximum configured price
  availability_status?: "available" | "coming_soon" | "discontinued";
  images?: string[];             // Array of image URLs (max 10)
  specifications?: object;       // Additional specifications
  features?: string[];           // List of features
  description?: string;          // Description (max 2000 chars)
  manufacturer_website?: string; // Official website URL
  created_at: Date;
  updated_at: Date;
}
```

## Content Models

### BlogPost
```typescript
interface BlogPost {
  id: string;                    // UUID
  author_id: string;             // Author UUID
  title: string;                 // Post title (5-200 chars)
  slug: string;                  // URL-friendly slug
  excerpt?: string;              // Short description (max 500 chars)
  content: string;               // Post content (min 50 chars)
  featured_image?: string;       // Featured image URL
  category?: string;             // Post category
  tags?: string[];               // Array of tags
  status: "draft" | "published" | "archived"; // Publication status
  is_featured: boolean;          // Featured post flag
  view_count: number;            // View count
  like_count: number;            // Like count
  comment_count: number;         // Comment count
  published_at?: Date;           // Publication date
  created_at: Date;
  updated_at: Date;
}
```

### ForumThread
```typescript
interface ForumThread {
  id: string;                    // UUID
  title: string;                 // Thread title (5-200 chars)
  content: string;               // Thread content (10-50000 chars)
  author_id: string;             // Author UUID
  category_id: string;           // Category UUID
  slug: string;                  // URL-friendly slug
  is_pinned: boolean;            // Pinned status
  is_locked: boolean;            // Locked status
  is_deleted: boolean;           // Deleted status
  view_count: number;            // View count
  reply_count: number;           // Reply count
  like_count: number;            // Like count
  last_post_at: Date;            // Last activity timestamp
  created_at: Date;
  updated_at: Date;
}
```

### Review
```typescript
interface Review {
  id: string;                    // UUID
  entity_type: string;           // Type of entity being reviewed
  entity_id: string;             // Entity UUID
  reviewer_id?: string;          // Reviewer UUID (null for guest reviews)
  rating: number;                // Rating (1-5)
  title?: string;                // Review title (max 200 chars)
  content?: string;              // Review content (max 2000 chars)
  pros?: string[];               // Positive aspects
  cons?: string[];               // Negative aspects
  reviewer_name: string;         // Reviewer name (for guest reviews)
  reviewer_email: string;        // Reviewer email (for guest reviews)
  is_verified_purchase: boolean; // Verified purchase flag
  helpful_count: number;         // Helpful votes count
  is_active: boolean;            // Active status
  created_at: Date;
  updated_at: Date;
}
```