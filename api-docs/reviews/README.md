# Reviews API

User review and rating system for vehicles, businesses, and other entities.

## Base URL
```
/api/reviews
```

## Endpoints

### Get All Reviews
```
GET /api/reviews
```

Get all active reviews with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `entity_type` (string, optional): Filter by entity type - `vehicle`, `business`, `charging_station`, `ev_listing`
- `entity_id` (string, optional): Filter by specific entity UUID
- `reviewer_id` (string, optional): Filter by reviewer UUID
- `rating_min` (number, optional): Minimum rating filter (1-5)
- `rating_max` (number, optional): Maximum rating filter (1-5)
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `updated_at`, `rating`, `helpful_count` (default: `created_at`)

**Example:**
```
GET /api/reviews?entity_type=vehicle&rating_min=4&page=1&limit=10&sortBy=helpful_count&sort=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid-here",
        "entity_type": "vehicle",
        "entity_id": "vehicle-uuid",
        "reviewer_id": "user-uuid",
        "rating": 5,
        "title": "Outstanding EV experience",
        "content": "I've owned this Tesla Model 3 for over a year now and it continues to exceed expectations...",
        "pros": [
          "Incredible acceleration",
          "Excellent range",
          "Low maintenance costs",
          "Over-the-air updates"
        ],
        "cons": [
          "Initial purchase price",
          "Limited service centers in rural areas"
        ],
        "reviewer_name": "John Doe",
        "reviewer_email": "john@example.com",
        "is_verified_purchase": true,
        "helpful_count": 15,
        "is_active": true,
        "created_at": "2024-01-10T14:30:00Z",
        "updated_at": "2024-01-10T14:30:00Z",
        "users": {
          "username": "johndoe",
          "full_name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_verified": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### Create Review
```
POST /api/reviews
```

Create a new review for an entity.

**Headers (Optional for guest reviews):**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "entity_type": "vehicle",
  "entity_id": "vehicle-uuid",
  "rating": 5,
  "title": "Amazing electric vehicle",
  "content": "This Tesla Model Y has been incredible. The performance and efficiency are outstanding...",
  "pros": [
    "Fast acceleration",
    "Great range",
    "Autopilot features",
    "Supercharger network"
  ],
  "cons": [
    "Price point",
    "Build quality inconsistencies"
  ],
  "reviewer_name": "Jane Smith",
  "reviewer_email": "jane@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "id": "new-uuid-here",
      "entity_type": "vehicle",
      "entity_id": "vehicle-uuid",
      "reviewer_id": "user-uuid",
      "rating": 5,
      "title": "Amazing electric vehicle",
      "content": "This Tesla Model Y has been incredible. The performance and efficiency are outstanding...",
      "pros": [
        "Fast acceleration",
        "Great range",
        "Autopilot features",
        "Supercharger network"
      ],
      "cons": [
        "Price point",
        "Build quality inconsistencies"
      ],
      "reviewer_name": "Jane Smith",
      "reviewer_email": "jane@example.com",
      "is_verified_purchase": false,
      "helpful_count": 0,
      "is_active": true,
      "created_at": "2024-01-15T16:00:00Z",
      "updated_at": "2024-01-15T16:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `entity_type`: Required enum - `vehicle`, `business`, `charging_station`, `ev_listing`
- `entity_id`: Required valid UUID
- `rating`: Required integer, 1-5
- `title`: Optional string, max 200 characters
- `content`: Optional string, max 2000 characters
- `pros`: Optional array of strings
- `cons`: Optional array of strings
- `reviewer_name`: Required for guest reviews, max 100 characters
- `reviewer_email`: Required for guest reviews, valid email format

---

### Get Review by ID
```
GET /api/reviews/:id
```

Get detailed information about a specific review.

**Parameters:**
- `id` (string): Review UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "uuid-here",
      "entity_type": "vehicle",
      "entity_id": "vehicle-uuid",
      "reviewer_id": "user-uuid",
      "rating": 5,
      "title": "Outstanding EV experience",
      "content": "I've owned this Tesla Model 3 for over a year now...",
      "pros": ["Incredible acceleration", "Excellent range"],
      "cons": ["Initial purchase price"],
      "reviewer_name": "John Doe",
      "reviewer_email": "john@example.com",
      "is_verified_purchase": true,
      "helpful_count": 15,
      "is_active": true,
      "created_at": "2024-01-10T14:30:00Z",
      "updated_at": "2024-01-10T14:30:00Z",
      "users": {
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": false
      }
    }
  }
}
```

---

### Update Review
```
PUT /api/reviews/:id
```

Update a review (reviewer only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Review UUID

**Request Body:**
```json
{
  "rating": 4,
  "title": "Updated: Great EV with minor concerns",
  "content": "After more time with the vehicle, I've updated my thoughts...",
  "pros": ["Fast acceleration", "Great range", "Low maintenance"],
  "cons": ["Price point", "Some build quality issues", "Service wait times"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "review": {
      // Updated review object
    }
  }
}
```

---

### Delete Review
```
DELETE /api/reviews/:id
```

Delete a review (reviewer or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Review UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### Mark Review as Helpful
```
POST /api/reviews/:id/helpful
```

Mark a review as helpful or remove helpful mark.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Review UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "data": {
    "helpful": true,
    "helpful_count": 16
  }
}
```

**Response (200) - Remove helpful:**
```json
{
  "success": true,
  "message": "Helpful mark removed",
  "data": {
    "helpful": false,
    "helpful_count": 14
  }
}
```

---

### Get Entity Reviews
```
GET /api/reviews/entity/:entityType/:entityId
```

Get all reviews for a specific entity.

**Parameters:**
- `entityType` (string): Entity type - `vehicle`, `business`, `charging_station`, `ev_listing`
- `entityId` (string): Entity UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `rating` (number, optional): Filter by specific rating

**Example:**
```
GET /api/reviews/entity/vehicle/vehicle-uuid?page=1&limit=10&sort=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        // Same structure as GET /reviews
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "pages": 1
    },
    "stats": {
      "average_rating": 4.6,
      "total_reviews": 8,
      "rating_distribution": {
        "5": 5,
        "4": 2,
        "3": 1,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

---

### Get User Reviews
```
GET /api/reviews/user/:userId
```

Get all reviews by a specific user.

**Parameters:**
- `userId` (string): User UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        // Same structure as GET /reviews
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "pages": 1
    }
  }
}
```

---

### Get Review Statistics
```
GET /api/reviews/stats/:entityType/:entityId
```

Get review statistics for a specific entity.

**Parameters:**
- `entityType` (string): Entity type
- `entityId` (string): Entity UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_reviews": 25,
      "average_rating": 4.6,
      "rating_distribution": {
        "5": 15,
        "4": 7,
        "3": 2,
        "2": 1,
        "1": 0
      },
      "verified_purchases": 18,
      "recent_reviews": 5
    }
  }
}
```

## Error Responses

### Review Not Found
```json
{
  "success": false,
  "error": "Review not found"
}
```

### Entity Not Found
```json
{
  "success": false,
  "error": "Entity not found or not accessible"
}
```

### Duplicate Review
```json
{
  "success": false,
  "error": "You have already reviewed this item"
}
```

### Invalid Rating
```json
{
  "success": false,
  "error": "Rating must be between 1 and 5"
}
```