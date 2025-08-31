# Directory API

Business directory for EV-related services and businesses.

## Base URL
```
/api/directory
```

**Note:** The directory routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get All Businesses
```
GET /api/directory
```

Get all directory businesses with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by business category
- `subcategory` (string, optional): Filter by subcategory
- `city` (string, optional): Filter by city
- `state` (string, optional): Filter by state
- `country` (string, optional): Filter by country
- `services` (string, optional): Filter by services offered
- `certified_only` (boolean, optional): Show only certified businesses
- `featured_only` (boolean, optional): Show only featured businesses
- `latitude` (number, optional): Center latitude for proximity search
- `longitude` (number, optional): Center longitude for proximity search
- `radius` (number, optional): Search radius in miles (requires lat/lng)
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `asc`)
- `sortBy` (string, optional): Sort field - `name`, `city`, `rating`, `created_at`, `distance` (default: `name`)
- `search` (string, optional): Search in name and description

**Example:**
```
GET /api/directory?category=repair&city=San Francisco&certified_only=true&sort=desc&sortBy=rating
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "business-uuid",
      "owner_id": "owner-uuid",
      "name": "EV Tech Specialists",
      "category": "repair",
      "subcategory": "electrical",
      "description": "Specialized electric vehicle repair and maintenance services with certified technicians.",
      "address": "123 Battery St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94111",
      "country": "US",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "phone": "+1-555-123-4567",
      "email": "info@evtechspecialists.com",
      "website": "https://evtechspecialists.com",
      "business_hours": {
        "monday": "8:00-17:00",
        "tuesday": "8:00-17:00",
        "wednesday": "8:00-17:00",
        "thursday": "8:00-17:00",
        "friday": "8:00-17:00",
        "saturday": "9:00-15:00",
        "sunday": "closed"
      },
      "services": [
        "Battery diagnostics",
        "Charging system repair",
        "Software updates",
        "Preventive maintenance",
        "Warranty service"
      ],
      "certifications": [
        "Tesla Certified",
        "Rivian Authorized",
        "ASE Electric Vehicle",
        "Better Business Bureau A+"
      ],
      "images": [
        "https://example.com/business/shop-front.jpg",
        "https://example.com/business/service-bay.jpg"
      ],
      "is_verified": true,
      "is_featured": true,
      "created_at": "2023-08-15T00:00:00Z",
      "updated_at": "2024-01-10T14:00:00Z",
      "stats": {
        "total_reviews": 45,
        "average_rating": 4.8,
        "total_services": 234
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Business Listing
```
POST /api/directory
```

Create a new business directory listing.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Green Auto Solutions",
  "category": "installation",
  "subcategory": "home_charging",
  "description": "Professional EV charging station installation for residential and commercial properties.",
  "address": "456 Electric Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90210",
  "country": "US",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "phone": "+1-555-987-6543",
  "email": "contact@greenauto.com",
  "website": "https://greenauto.com",
  "business_hours": {
    "monday": "7:00-18:00",
    "tuesday": "7:00-18:00",
    "wednesday": "7:00-18:00",
    "thursday": "7:00-18:00",
    "friday": "7:00-18:00",
    "saturday": "8:00-16:00",
    "sunday": "closed"
  },
  "services": [
    "Level 2 charger installation",
    "Electrical panel upgrades",
    "Permit assistance",
    "Commercial installations"
  ],
  "certifications": [
    "Licensed Electrician",
    "Tesla Wall Connector Certified",
    "ChargePoint Installer"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Business listing created successfully",
  "data": {
    "business": {
      "id": "new-business-uuid",
      "owner_id": "user-uuid",
      "name": "Green Auto Solutions",
      "category": "installation",
      "subcategory": "home_charging",
      "description": "Professional EV charging station installation for residential and commercial properties.",
      "address": "456 Electric Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90210",
      "country": "US",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "phone": "+1-555-987-6543",
      "email": "contact@greenauto.com",
      "website": "https://greenauto.com",
      "business_hours": {
        "monday": "7:00-18:00",
        "tuesday": "7:00-18:00",
        "wednesday": "7:00-18:00",
        "thursday": "7:00-18:00",
        "friday": "7:00-18:00",
        "saturday": "8:00-16:00",
        "sunday": "closed"
      },
      "services": [
        "Level 2 charger installation",
        "Electrical panel upgrades",
        "Permit assistance",
        "Commercial installations"
      ],
      "certifications": [
        "Licensed Electrician",
        "Tesla Wall Connector Certified",
        "ChargePoint Installer"
      ],
      "images": [],
      "is_verified": false,
      "is_featured": false,
      "status": "pending",
      "created_at": "2024-01-15T21:00:00Z",
      "updated_at": "2024-01-15T21:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `name`: Required string, max 200 characters
- `category`: Required string
- `description`: Optional string, max 2000 characters
- `address`: Optional string, max 500 characters
- `city`: Optional string, max 100 characters
- `phone`: Optional string, valid phone format
- `email`: Optional string, valid email format
- `website`: Optional string, valid URL format
- `services`: Optional array of strings
- `certifications`: Optional array of strings

---

### Get Business by ID
```
GET /api/directory/:id
```

Get detailed information about a specific business.

**Parameters:**
- `id` (string): Business UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "business-uuid",
      "owner_id": "owner-uuid",
      "name": "EV Tech Specialists",
      "category": "repair",
      "subcategory": "electrical",
      "description": "Specialized electric vehicle repair and maintenance services with certified technicians.",
      "address": "123 Battery St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94111",
      "country": "US",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "phone": "+1-555-123-4567",
      "email": "info@evtechspecialists.com",
      "website": "https://evtechspecialists.com",
      "business_hours": {
        "monday": "8:00-17:00",
        "tuesday": "8:00-17:00",
        "wednesday": "8:00-17:00",
        "thursday": "8:00-17:00",
        "friday": "8:00-17:00",
        "saturday": "9:00-15:00",
        "sunday": "closed"
      },
      "services": [
        "Battery diagnostics",
        "Charging system repair",
        "Software updates",
        "Preventive maintenance"
      ],
      "certifications": [
        "Tesla Certified",
        "Rivian Authorized",
        "ASE Electric Vehicle"
      ],
      "images": [
        "https://example.com/business/shop-front.jpg",
        "https://example.com/business/service-bay.jpg"
      ],
      "is_verified": true,
      "is_featured": true,
      "status": "active",
      "created_at": "2023-08-15T00:00:00Z",
      "updated_at": "2024-01-10T14:00:00Z",
      "owner": {
        "username": "evtech",
        "full_name": "EV Tech Owner",
        "avatar_url": "https://example.com/owner-avatar.jpg",
        "is_verified": true
      },
      "stats": {
        "total_reviews": 45,
        "average_rating": 4.8,
        "total_services": 234,
        "years_in_business": 8
      }
    }
  }
}
```

---

### Update Business
```
PUT /api/directory/:id
```

Update business information (owner or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Business UUID

**Request Body:**
```json
{
  "description": "Updated description with new services and certifications",
  "services": [
    "Battery diagnostics",
    "Charging system repair", 
    "Software updates",
    "Preventive maintenance",
    "Mobile service calls"
  ],
  "business_hours": {
    "monday": "8:00-18:00",
    "tuesday": "8:00-18:00",
    "wednesday": "8:00-18:00",
    "thursday": "8:00-18:00",
    "friday": "8:00-18:00",
    "saturday": "9:00-15:00",
    "sunday": "closed"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Business updated successfully",
  "data": {
    "business": {
      // Updated business object
    }
  }
}
```

---

### Delete Business
```
DELETE /api/directory/:id
```

Delete a business listing (owner or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Business UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Business listing deleted successfully"
}
```

---

### Get Business Categories
```
GET /api/directory/categories
```

Get all business categories and subcategories.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "repair",
        "description": "EV repair and maintenance services",
        "subcategories": [
          {"name": "electrical", "description": "Electrical system repairs"},
          {"name": "body", "description": "Body work and collision repair"},
          {"name": "software", "description": "Software and firmware updates"}
        ],
        "business_count": 45
      },
      {
        "name": "installation",
        "description": "Charging station installation services",
        "subcategories": [
          {"name": "home_charging", "description": "Residential charging solutions"},
          {"name": "commercial", "description": "Commercial charging installations"},
          {"name": "fleet", "description": "Fleet charging solutions"}
        ],
        "business_count": 32
      },
      {
        "name": "sales",
        "description": "EV sales and dealerships",
        "subcategories": [
          {"name": "new_vehicles", "description": "New EV sales"},
          {"name": "used_vehicles", "description": "Used EV sales"},
          {"name": "accessories", "description": "EV accessories and parts"}
        ],
        "business_count": 28
      }
    ]
  }
}
```

---

### Search Businesses
```
GET /api/directory/search
```

Search businesses by name, services, or location.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `location` (string, optional): Filter by location
- `latitude` (number, optional): Center latitude for proximity search
- `longitude` (number, optional): Center longitude for proximity search
- `radius` (number, optional): Search radius in miles

**Example:**
```
GET /api/directory/search?q=tesla service&category=repair&latitude=37.7749&longitude=-122.4194&radius=25
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "businesses": [
      {
        // Same structure as GET /directory
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

### Get Business Reviews
```
GET /api/directory/:id/reviews
```

Get reviews for a specific business.

**Parameters:**
- `id` (string): Business UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `rating` (number, optional): Filter by rating

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "business_id": "business-uuid",
        "reviewer_id": "user-uuid",
        "rating": 5,
        "title": "Excellent service and expertise",
        "content": "The team at EV Tech Specialists diagnosed and fixed my charging issue quickly and professionally.",
        "pros": [
          "Knowledgeable staff",
          "Quick turnaround",
          "Fair pricing",
          "Great communication"
        ],
        "cons": [
          "Booking can be challenging due to high demand"
        ],
        "is_verified_purchase": true,
        "service_date": "2024-01-10T00:00:00Z",
        "helpful_count": 8,
        "created_at": "2024-01-12T15:30:00Z",
        "updated_at": "2024-01-12T15:30:00Z",
        "reviewer": {
          "username": "teslaowner",
          "full_name": "Tesla Owner",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_verified": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "average_rating": 4.8,
      "total_reviews": 45,
      "rating_distribution": {
        "5": 35,
        "4": 8,
        "3": 2,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

---

### Create Business Review
```
POST /api/directory/:id/reviews
```

Create a review for a business.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Business UUID

**Request Body:**
```json
{
  "rating": 5,
  "title": "Outstanding EV service center",
  "content": "Had my Rivian R1T serviced here and the experience was fantastic. The technicians are very knowledgeable about EVs.",
  "pros": [
    "Expert EV knowledge",
    "Professional service",
    "Competitive pricing",
    "Quick scheduling"
  ],
  "cons": [
    "Location could be more convenient"
  ],
  "service_date": "2024-01-14",
  "is_verified_purchase": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "id": "new-review-uuid",
      "business_id": "business-uuid",
      "reviewer_id": "user-uuid",
      "rating": 5,
      "title": "Outstanding EV service center",
      "content": "Had my Rivian R1T serviced here and the experience was fantastic.",
      "pros": [
        "Expert EV knowledge",
        "Professional service",
        "Competitive pricing",
        "Quick scheduling"
      ],
      "cons": [
        "Location could be more convenient"
      ],
      "service_date": "2024-01-14T00:00:00Z",
      "is_verified_purchase": true,
      "helpful_count": 0,
      "created_at": "2024-01-15T21:30:00Z",
      "updated_at": "2024-01-15T21:30:00Z"
    }
  }
}
```

---

### Contact Business
```
POST /api/directory/:id/contact
```

Send a message to a business.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Business UUID

**Request Body:**
```json
{
  "subject": "Charging installation inquiry",
  "message": "Hi, I'm interested in having a Level 2 charger installed at my home. Could you provide a quote?",
  "contact_method": "email",
  "phone": "+1-555-123-9999"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent to business successfully",
  "data": {
    "contact": {
      "id": "contact-uuid",
      "business_id": "business-uuid",
      "customer_id": "user-uuid",
      "subject": "Charging installation inquiry",
      "message": "Hi, I'm interested in having a Level 2 charger installed at my home.",
      "contact_method": "email",
      "phone": "+1-555-123-9999",
      "status": "sent",
      "created_at": "2024-01-15T22:00:00Z"
    }
  }
}
```

---

### Claim Business
```
POST /api/directory/:id/claim
```

Claim ownership of a business listing.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Business UUID

**Request Body:**
```json
{
  "verification_method": "email",
  "business_email": "owner@evtechspecialists.com",
  "verification_documents": ["business-license.pdf", "ownership-proof.pdf"],
  "additional_info": "I am the owner of EV Tech Specialists and would like to claim this listing."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Business claim request submitted successfully",
  "data": {
    "claim": {
      "id": "claim-uuid",
      "business_id": "business-uuid",
      "claimant_id": "user-uuid",
      "verification_method": "email",
      "business_email": "owner@evtechspecialists.com",
      "status": "pending",
      "submitted_at": "2024-01-15T22:15:00Z"
    }
  }
}
```

## Error Responses

### Business Not Found
```json
{
  "success": false,
  "error": "Business not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only modify your own business listings."
}
```

### Already Claimed
```json
{
  "success": false,
  "error": "This business has already been claimed"
}
```

### Duplicate Review
```json
{
  "success": false,
  "error": "You have already reviewed this business"
}
```

### Invalid Location
```json
{
  "success": false,
  "error": "Invalid latitude or longitude coordinates"
}
```

### Verification Required
```json
{
  "success": false,
  "error": "Business verification required before public listing"
}
```