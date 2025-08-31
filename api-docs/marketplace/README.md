# Marketplace API

Buy and sell EV-related items and accessories.

## Base URL
```
/api/marketplace
```

**Note:** The marketplace routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get All Listings
```
GET /api/marketplace
```

Get all active marketplace listings with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `subcategory` (string, optional): Filter by subcategory
- `condition` (string, optional): Filter by condition - `new`, `like_new`, `good`, `fair`, `poor`
- `min_price` (number, optional): Minimum price filter
- `max_price` (number, optional): Maximum price filter
- `location` (string, optional): Filter by location
- `brand` (string, optional): Filter by brand
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `price`, `views` (default: `created_at`)
- `search` (string, optional): Search in title and description

**Example:**
```
GET /api/marketplace?category=accessories&condition=new&min_price=50&max_price=500&sort=asc&sortBy=price
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing-uuid",
      "seller_id": "user-uuid",
      "title": "Tesla Model 3 All-Weather Floor Mats",
      "description": "Brand new Tesla all-weather floor mats, never used. Perfect fit for Model 3.",
      "category": "accessories",
      "subcategory": "interior",
      "price": 150,
      "condition": "new",
      "brand": "Tesla",
      "model": "Model 3",
      "year": 2024,
      "mileage": null,
      "location": "San Francisco, CA",
      "images": [
        "https://example.com/marketplace/floor-mats-1.jpg",
        "https://example.com/marketplace/floor-mats-2.jpg"
      ],
      "specifications": {
        "material": "Thermoplastic rubber",
        "color": "Black",
        "compatibility": "2017-2024 Tesla Model 3"
      },
      "features": [
        "All-weather protection",
        "Custom fit",
        "Easy to clean",
        "Non-slip backing"
      ],
      "is_negotiable": true,
      "is_active": true,
      "status": "active",
      "views": 45,
      "created_at": "2024-01-10T14:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "seller": {
        "username": "teslaowner",
        "full_name": "Tesla Owner",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": false,
        "rating": 4.8,
        "total_sales": 12
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 180,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Listing
```
POST /api/marketplace
```

Create a new marketplace listing.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Rivian R1T Bed Cover",
  "description": "Retractable bed cover for Rivian R1T. Excellent condition, used for 6 months.",
  "category": "accessories",
  "subcategory": "exterior",
  "price": 800,
  "condition": "good",
  "brand": "Rivian",
  "model": "R1T",
  "year": 2023,
  "location": "Los Angeles, CA",
  "specifications": {
    "material": "Aluminum and vinyl",
    "color": "Black",
    "installation": "No tools required"
  },
  "features": [
    "Retractable design",
    "Weather resistant",
    "Easy installation",
    "Locking mechanism"
  ],
  "is_negotiable": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "listing": {
      "id": "new-listing-uuid",
      "seller_id": "user-uuid",
      "title": "Rivian R1T Bed Cover",
      "description": "Retractable bed cover for Rivian R1T. Excellent condition, used for 6 months.",
      "category": "accessories",
      "subcategory": "exterior",
      "price": 800,
      "condition": "good",
      "brand": "Rivian",
      "model": "R1T",
      "year": 2023,
      "location": "Los Angeles, CA",
      "images": [],
      "specifications": {
        "material": "Aluminum and vinyl",
        "color": "Black",
        "installation": "No tools required"
      },
      "features": [
        "Retractable design",
        "Weather resistant",
        "Easy installation",
        "Locking mechanism"
      ],
      "is_negotiable": true,
      "is_active": true,
      "status": "active",
      "views": 0,
      "created_at": "2024-01-15T17:30:00Z",
      "updated_at": "2024-01-15T17:30:00Z"
    }
  }
}
```

**Validation Rules:**
- `title`: Required string, 5-200 characters
- `description`: Optional string, max 2000 characters
- `category`: Required string
- `price`: Optional positive number
- `condition`: Optional enum - `new`, `like_new`, `good`, `fair`, `poor`
- `location`: Optional string, max 100 characters
- `is_negotiable`: Optional boolean (default: false)

---

### Get Listing by ID
```
GET /api/marketplace/:id
```

Get detailed information about a specific listing.

**Parameters:**
- `id` (string): Listing UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "listing-uuid",
      "seller_id": "user-uuid",
      "title": "Tesla Model 3 All-Weather Floor Mats",
      "description": "Brand new Tesla all-weather floor mats, never used. Perfect fit for Model 3.",
      "category": "accessories",
      "subcategory": "interior",
      "price": 150,
      "condition": "new",
      "brand": "Tesla",
      "model": "Model 3",
      "year": 2024,
      "location": "San Francisco, CA",
      "images": [
        "https://example.com/marketplace/floor-mats-1.jpg"
      ],
      "specifications": {
        "material": "Thermoplastic rubber",
        "color": "Black"
      },
      "features": ["All-weather protection", "Custom fit"],
      "is_negotiable": true,
      "is_active": true,
      "status": "active",
      "views": 46,
      "created_at": "2024-01-10T14:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "seller": {
        "username": "teslaowner",
        "full_name": "Tesla Owner",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": false,
        "rating": 4.8,
        "total_sales": 12,
        "member_since": "2023-06-01T00:00:00Z"
      }
    }
  }
}
```

---

### Update Listing
```
PUT /api/marketplace/:id
```

Update a marketplace listing (seller only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Listing UUID

**Request Body:**
```json
{
  "price": 130,
  "description": "Updated description with price reduction for quick sale",
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "listing": {
      // Updated listing object
    }
  }
}
```

---

### Delete Listing
```
DELETE /api/marketplace/:id
```

Delete a marketplace listing (seller only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Listing UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

---

### Get Categories
```
GET /api/marketplace/categories
```

Get all marketplace categories.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "category-uuid",
        "name": "Accessories",
        "description": "EV accessories and add-ons",
        "slug": "accessories",
        "parent_id": null,
        "icon": "🔧",
        "is_active": true,
        "sort_order": 1,
        "subcategories": [
          {
            "id": "sub-uuid",
            "name": "Interior",
            "slug": "interior"
          },
          {
            "id": "sub-uuid-2",
            "name": "Exterior", 
            "slug": "exterior"
          }
        ]
      }
    ]
  }
}
```

---

### Contact Seller
```
POST /api/marketplace/:id/contact
```

Send a message to the seller about a listing.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Listing UUID

**Request Body:**
```json
{
  "message": "Hi, I'm interested in your floor mats. Are they still available?",
  "offer_price": 120
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent to seller successfully",
  "data": {
    "contact": {
      "id": "contact-uuid",
      "listing_id": "listing-uuid",
      "buyer_id": "user-uuid",
      "seller_id": "seller-uuid",
      "message": "Hi, I'm interested in your floor mats. Are they still available?",
      "offer_price": 120,
      "status": "sent",
      "created_at": "2024-01-15T18:00:00Z"
    }
  }
}
```

## Error Responses

### Listing Not Found
```json
{
  "success": false,
  "error": "Marketplace listing not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only modify your own listings."
}
```

### Listing Inactive
```json
{
  "success": false,
  "error": "Cannot contact seller. Listing is no longer active."
}
```

### Self Contact Error
```json
{
  "success": false,
  "error": "Cannot contact yourself about your own listing"
}
```