# EV Community Platform - Backend Architecture

## Overview

This document outlines the complete backend architecture for the EV Community Platform, including database schema, API routes, and implementation guidelines using Express.js and Supabase.

## Technology Stack

- **Backend Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Database Schema

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(20),
  is_verified BOOLEAN DEFAULT false,
  is_business BOOLEAN DEFAULT false,
  business_name VARCHAR(100),
  business_type VARCHAR(50),
  join_date TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  privacy_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Vehicles Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  trim VARCHAR(50),
  color VARCHAR(30),
  vin VARCHAR(17) UNIQUE,
  nickname VARCHAR(50),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_mileage INTEGER,
  battery_capacity DECIMAL(5,2),
  estimated_range INTEGER,
  charging_speed VARCHAR(20),
  modifications TEXT[],
  notes TEXT,
  images TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. EV Listings Table

```sql
CREATE TABLE ev_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  trim VARCHAR(50),
  body_type VARCHAR(30),
  drivetrain VARCHAR(20),
  battery_capacity DECIMAL(5,2),
  range_epa INTEGER,
  range_wltp INTEGER,
  acceleration_0_60 DECIMAL(3,1),
  top_speed INTEGER,
  charging_speed_dc DECIMAL(5,1),
  charging_speed_ac DECIMAL(5,1),
  starting_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  availability_status VARCHAR(20),
  images TEXT[],
  specifications JSONB,
  features TEXT[],
  description TEXT,
  manufacturer_website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Marketplace Listings Table

```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  price DECIMAL(10,2),
  condition VARCHAR(20),
  brand VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  mileage INTEGER,
  location VARCHAR(100),
  images TEXT[],
  specifications JSONB,
  features TEXT[],
  is_negotiable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Wanted Ads Table

```sql
CREATE TABLE wanted_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_location VARCHAR(100),
  requirements JSONB,
  contact_preferences JSONB,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Forum Categories Table

```sql
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  parent_id UUID REFERENCES forum_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Forum Posts Table

```sql
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP,
  last_reply_by UUID REFERENCES users(id),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 8. Forum Replies Table

```sql
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id),
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9. Blog Posts Table

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category VARCHAR(50),
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  reading_time INTEGER,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 10. Blog Comments Table

```sql
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES blog_comments(id),
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11. Charging Stations Table

```sql
CREATE TABLE charging_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address VARCHAR(300) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  network VARCHAR(100),
  station_type VARCHAR(50),
  connector_types TEXT[],
  power_levels TEXT[],
  pricing_info JSONB,
  amenities TEXT[],
  hours_of_operation JSONB,
  phone VARCHAR(20),
  website VARCHAR(255),
  is_operational BOOLEAN DEFAULT true,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 12. Directory Businesses Table

```sql
CREATE TABLE directory_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  address VARCHAR(300),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  business_hours JSONB,
  services TEXT[],
  certifications TEXT[],
  images TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 13. Reviews Table

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_type VARCHAR(50) NOT NULL, -- 'user', 'business', 'charging_station'
  reviewee_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  pros TEXT[],
  cons TEXT[],
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 14. Likes/Favorites Table

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL, -- 'post', 'reply', 'listing', 'vehicle', 'blog_post'
  target_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);
```

### 15. Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Routes Structure

### Authentication Routes

```javascript
// Auth routes
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email/:token
```

### User Routes

```javascript
// User management
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/:username
GET    /api/users/:username/vehicles
GET    /api/users/:username/posts
GET    /api/users/:username/reviews
POST   /api/users/upload-avatar
DELETE /api/users/account
```

### Vehicle Routes

```javascript
// Vehicle management
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
POST   /api/vehicles/:id/images
DELETE /api/vehicles/:id/images/:imageId
GET    /api/vehicles/user/:userId
```

### EV Listings Routes

```javascript
// EV listings
GET    /api/ev-listings
GET    /api/ev-listings/:id
GET    /api/ev-listings/search
GET    /api/ev-listings/compare
GET    /api/ev-listings/filters
```

### Marketplace Routes

```javascript
// Marketplace
GET    /api/marketplace
POST   /api/marketplace
GET    /api/marketplace/:id
PUT    /api/marketplace/:id
DELETE /api/marketplace/:id
POST   /api/marketplace/:id/images
GET    /api/marketplace/categories
GET    /api/marketplace/search
POST   /api/marketplace/:id/contact
```

### Wanted Ads Routes

```javascript
// Wanted ads
GET    /api/wanted
POST   /api/wanted
GET    /api/wanted/:id
PUT    /api/wanted/:id
DELETE /api/wanted/:id
GET    /api/wanted/search
```

### Forum Routes

```javascript
// Forums
GET    /api/forums/categories
GET    /api/forums/categories/:slug
GET    /api/forums/posts
POST   /api/forums/posts
GET    /api/forums/posts/:id
PUT    /api/forums/posts/:id
DELETE /api/forums/posts/:id
POST   /api/forums/posts/:id/replies
GET    /api/forums/posts/:id/replies
PUT    /api/forums/replies/:id
DELETE /api/forums/replies/:id
GET    /api/forums/search
```

### Blog Routes

```javascript
// Blog
GET    /api/blog/posts
POST   /api/blog/posts
GET    /api/blog/posts/:id
PUT    /api/blog/posts/:id
DELETE /api/blog/posts/:id
GET    /api/blog/posts/slug/:slug
GET    /api/blog/categories
GET    /api/blog/tags
POST   /api/blog/posts/:id/comments
GET    /api/blog/posts/:id/comments
PUT    /api/blog/comments/:id
DELETE /api/blog/comments/:id
```

### Charging Station Routes

```javascript
// Charging stations
GET    /api/charging-stations
GET    /api/charging-stations/:id
GET    /api/charging-stations/search
GET    /api/charging-stations/nearby
POST   /api/charging-stations/:id/reviews
GET    /api/charging-stations/:id/reviews
```

### Directory Routes

```javascript
// Business directory
GET    /api/directory
POST   /api/directory
GET    /api/directory/:id
PUT    /api/directory/:id
DELETE /api/directory/:id
GET    /api/directory/categories
GET    /api/directory/search
POST   /api/directory/:id/reviews
GET    /api/directory/:id/reviews
```

### General Routes

```javascript
// Reviews
POST   /api/reviews
GET    /api/reviews/:id
PUT    /api/reviews/:id
DELETE /api/reviews/:id
POST   /api/reviews/:id/helpful

// Likes/Favorites
POST   /api/likes
DELETE /api/likes
GET    /api/users/:userId/favorites

// Messages
GET    /api/messages
POST   /api/messages
GET    /api/messages/:id
PUT    /api/messages/:id/read
DELETE /api/messages/:id

// File uploads
POST   /api/upload/image
POST   /api/upload/document
DELETE /api/upload/:fileId

// Search
GET    /api/search/global
GET    /api/search/suggestions
```

## Implementation Guidelines

### 1. Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── vehicleController.js
│   │   ├── marketplaceController.js
│   │   ├── forumController.js
│   │   ├── blogController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── MarketplaceListing.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── vehicles.js
│   │   ├── marketplace.js
│   │   └── ...
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── emailService.js
│   │   ├── uploadService.js
│   │   └── ...
│   ├── utils/
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── constants.js
│   └── app.js
├── migrations/
├── seeds/
├── tests/
├── .env.example
├── package.json
└── README.md
```

### 2. Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### 4. Validation Schemas

```javascript
const Joi = require('joi');

const vehicleSchema = Joi.object({
  make: Joi.string().required().max(50),
  model: Joi.string().required().max(50),
  year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 2),
  trim: Joi.string().max(50),
  color: Joi.string().max(30),
  vin: Joi.string().length(17).pattern(/^[A-HJ-NPR-Z0-9]+$/),
  nickname: Joi.string().max(50),
  purchase_date: Joi.date(),
  purchase_price: Joi.number().positive(),
  current_mileage: Joi.number().integer().min(0),
  battery_capacity: Joi.number().positive(),
  estimated_range: Joi.number().integer().positive(),
  charging_speed: Joi.string().max(20),
  modifications: Joi.array().items(Joi.string()),
  notes: Joi.string(),
  is_public: Joi.boolean()
});
```

### 5. Error Handling

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
```

### 6. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const generalLimiter = createRateLimit(15 * 60 * 1000, 100, 'Too many requests');
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many auth attempts');
```

## Security Considerations

1. **Input Validation**: Validate all inputs using Joi or similar
2. **SQL Injection**: Use parameterized queries
3. **Authentication**: Implement JWT with refresh tokens
4. **Authorization**: Role-based access control
5. **Rate Limiting**: Prevent abuse and DoS attacks
6. **CORS**: Configure properly for frontend domain
7. **Helmet**: Use security headers
8. **File Uploads**: Validate file types and sizes
9. **Environment Variables**: Never commit secrets
10. **Logging**: Implement comprehensive logging

## Deployment Checklist

- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Set up file storage buckets
- [ ] Configure CORS policies
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline
- [ ] Performance testing
- [ ] Security audit

## Next Steps

1. Initialize Express.js project
2. Set up Supabase connection
3. Create database tables and relationships
4. Implement authentication system
5. Build core API endpoints
6. Add validation and error handling
7. Implement file upload functionality
8. Add real-time features
9. Write comprehensive tests
10. Deploy and monitor

This architecture provides a solid foundation for the EV Community Platform backend, ensuring scalability, security, and maintainability.