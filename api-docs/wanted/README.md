# Wanted Ads API

Wanted advertisements for users looking to buy specific EV-related items.

## Base URL
```
/api/wanted
```

**Note:** The wanted ads routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get All Wanted Ads
```
GET /api/wanted
```

Get all active wanted ads with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `subcategory` (string, optional): Filter by subcategory
- `min_budget` (number, optional): Minimum budget filter
- `max_budget` (number, optional): Maximum budget filter
- `location` (string, optional): Filter by preferred location
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `budget_max`, `expires_at` (default: `created_at`)
- `search` (string, optional): Search in title and description

**Example:**
```
GET /api/wanted?category=vehicles&min_budget=30000&max_budget=60000&location=California
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "wanted-uuid",
      "user_id": "user-uuid",
      "title": "Looking for Used Tesla Model 3",
      "description": "Seeking a well-maintained Tesla Model 3, preferably 2020 or newer. Must have autopilot and good battery health.",
      "category": "vehicles",
      "subcategory": "sedans",
      "budget_min": 35000,
      "budget_max": 50000,
      "preferred_location": "California",
      "requirements": {
        "year_min": 2020,
        "mileage_max": 50000,
        "features": ["Autopilot", "Premium Interior"],
        "condition": "good"
      },
      "contact_preferences": {
        "email": true,
        "phone": false,
        "in_app": true,
        "preferred_time": "evenings"
      },
      "is_active": true,
      "expires_at": "2024-02-15T00:00:00Z",
      "created_at": "2024-01-15T12:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z",
      "user": {
        "username": "evbuyer",
        "full_name": "EV Buyer",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": false,
        "location": "San Francisco, CA"
      },
      "stats": {
        "view_count": 45,
        "contact_count": 8,
        "days_remaining": 31
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Wanted Ad
```
POST /api/wanted
```

Create a new wanted ad.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Looking for Rivian R1T Accessories",
  "description": "Seeking bed cover, floor mats, and charging accessories for 2023 Rivian R1T.",
  "category": "accessories",
  "subcategory": "truck_accessories",
  "budget_min": 200,
  "budget_max": 1500,
  "preferred_location": "Pacific Northwest",
  "requirements": {
    "compatibility": "2023 Rivian R1T",
    "condition": "new or like_new",
    "items": ["bed cover", "floor mats", "charging cable"]
  },
  "contact_preferences": {
    "email": true,
    "phone": true,
    "in_app": true,
    "preferred_time": "weekends"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Wanted ad created successfully",
  "data": {
    "ad": {
      "id": "new-wanted-uuid",
      "user_id": "user-uuid",
      "title": "Looking for Rivian R1T Accessories",
      "description": "Seeking bed cover, floor mats, and charging accessories for 2023 Rivian R1T.",
      "category": "accessories",
      "subcategory": "truck_accessories",
      "budget_min": 200,
      "budget_max": 1500,
      "preferred_location": "Pacific Northwest",
      "requirements": {
        "compatibility": "2023 Rivian R1T",
        "condition": "new or like_new",
        "items": ["bed cover", "floor mats", "charging cable"]
      },
      "contact_preferences": {
        "email": true,
        "phone": true,
        "in_app": true,
        "preferred_time": "weekends"
      },
      "is_active": true,
      "expires_at": "2024-02-15T18:00:00Z",
      "created_at": "2024-01-15T18:00:00Z",
      "updated_at": "2024-01-15T18:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `title`: Required string, 5-200 characters
- `description`: Optional string, max 2000 characters
- `category`: Required string
- `budget_min`: Optional positive number
- `budget_max`: Optional positive number (must be >= budget_min)
- `preferred_location`: Optional string, max 100 characters

---

### Get Wanted Ad by ID
```
GET /api/wanted/:id
```

Get detailed information about a specific wanted ad.

**Parameters:**
- `id` (string): Wanted ad UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ad": {
      "id": "wanted-uuid",
      "user_id": "user-uuid",
      "title": "Looking for Used Tesla Model 3",
      "description": "Seeking a well-maintained Tesla Model 3, preferably 2020 or newer.",
      "category": "vehicles",
      "subcategory": "sedans",
      "budget_min": 35000,
      "budget_max": 50000,
      "preferred_location": "California",
      "requirements": {
        "year_min": 2020,
        "mileage_max": 50000,
        "features": ["Autopilot", "Premium Interior"]
      },
      "contact_preferences": {
        "email": true,
        "phone": false,
        "in_app": true
      },
      "is_active": true,
      "expires_at": "2024-02-15T00:00:00Z",
      "created_at": "2024-01-15T12:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z",
      "user": {
        "username": "evbuyer",
        "full_name": "EV Buyer",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": false,
        "location": "San Francisco, CA",
        "member_since": "2023-12-01T00:00:00Z"
      },
      "stats": {
        "view_count": 46,
        "contact_count": 8,
        "days_remaining": 31
      }
    }
  }
}
```

---

### Update Wanted Ad
```
PUT /api/wanted/:id
```

Update a wanted ad (creator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Wanted ad UUID

**Request Body:**
```json
{
  "budget_max": 55000,
  "description": "Updated description with more specific requirements...",
  "requirements": {
    "year_min": 2021,
    "mileage_max": 40000,
    "features": ["Autopilot", "Premium Interior", "Full Self-Driving"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wanted ad updated successfully",
  "data": {
    "ad": {
      // Updated ad object
    }
  }
}
```

---

### Delete Wanted Ad
```
DELETE /api/wanted/:id
```

Delete a wanted ad (creator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Wanted ad UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Wanted ad deleted successfully"
}
```

---

### Fulfill Wanted Ad
```
POST /api/wanted/:id/fulfill
```

Mark a wanted ad as fulfilled.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Wanted ad UUID

**Request Body:**
```json
{
  "fulfillment_notes": "Found exactly what I was looking for through a community member!",
  "seller_id": "seller-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wanted ad marked as fulfilled",
  "data": {
    "ad": {
      "id": "wanted-uuid",
      "is_active": false,
      "status": "fulfilled",
      "fulfillment_notes": "Found exactly what I was looking for through a community member!",
      "fulfilled_at": "2024-01-15T19:00:00Z"
    }
  }
}
```

---

### Get Categories
```
GET /api/wanted/meta/categories
```

Get all wanted ad categories.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "vehicles",
        "description": "Electric vehicles and hybrids",
        "subcategories": ["sedans", "suvs", "trucks", "motorcycles"],
        "ad_count": 35
      },
      {
        "name": "accessories",
        "description": "EV accessories and parts",
        "subcategories": ["interior", "exterior", "charging", "performance"],
        "ad_count": 28
      },
      {
        "name": "services",
        "description": "EV-related services",
        "subcategories": ["installation", "maintenance", "consultation"],
        "ad_count": 12
      }
    ]
  }
}
```

---

### Search Wanted Ads
```
GET /api/wanted/search
```

Search wanted ads by title, description, and requirements.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `location` (string, optional): Filter by location

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ads": [
      {
        // Same structure as GET /wanted
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Contact Ad Creator
```
POST /api/wanted/:id/contact
```

Contact the creator of a wanted ad.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Wanted ad UUID

**Request Body:**
```json
{
  "message": "Hi! I have a 2021 Tesla Model 3 that matches your requirements. Would you like to discuss?",
  "item_details": {
    "year": 2021,
    "mileage": 25000,
    "price": 45000,
    "condition": "excellent"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "contact": {
      "id": "contact-uuid",
      "ad_id": "wanted-uuid",
      "seller_id": "user-uuid",
      "buyer_id": "ad-creator-uuid",
      "message": "Hi! I have a 2021 Tesla Model 3 that matches your requirements...",
      "item_details": {
        "year": 2021,
        "mileage": 25000,
        "price": 45000,
        "condition": "excellent"
      },
      "status": "sent",
      "created_at": "2024-01-15T19:30:00Z"
    }
  }
}
```

---

### Get User's Wanted Ads
```
GET /api/wanted/user/:userId
```

Get all wanted ads created by a specific user.

**Parameters:**
- `userId` (string): User UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status - `active`, `fulfilled`, `expired`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ads": [
      {
        // Same structure as GET /wanted
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Extend Ad Expiration
```
POST /api/wanted/:id/extend
```

Extend the expiration date of a wanted ad (creator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Wanted ad UUID

**Request Body:**
```json
{
  "extension_days": 30,
  "reason": "Still looking for the right vehicle"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wanted ad extended successfully",
  "data": {
    "ad": {
      "id": "wanted-uuid",
      "expires_at": "2024-03-15T12:00:00Z",
      "extension_count": 1,
      "updated_at": "2024-01-15T20:00:00Z"
    }
  }
}
```

## Error Responses

### Wanted Ad Not Found
```json
{
  "success": false,
  "error": "Wanted ad not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only modify your own wanted ads."
}
```

### Ad Expired
```json
{
  "success": false,
  "error": "Cannot contact creator. This wanted ad has expired."
}
```

### Ad Already Fulfilled
```json
{
  "success": false,
  "error": "This wanted ad has already been fulfilled"
}
```

### Self Contact Error
```json
{
  "success": false,
  "error": "Cannot contact yourself about your own wanted ad"
}
```

### Extension Limit Exceeded
```json
{
  "success": false,
  "error": "Maximum number of extensions reached for this ad"
}
```

### Invalid Budget Range
```json
{
  "success": false,
  "error": "Maximum budget must be greater than minimum budget"
}
```