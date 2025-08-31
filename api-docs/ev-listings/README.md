# EV Listings API

Electric vehicle database with specifications, pricing, and availability information.

## Base URL
```
/api/ev-listings
```

## Endpoints

### Get All EV Listings
```
GET /api/ev-listings
```

Get all EV listings with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 50)
- `make` (string, optional): Filter by manufacturer
- `year` (number, optional): Filter by model year
- `min_price` (number, optional): Minimum price filter
- `max_price` (number, optional): Maximum price filter
- `min_range` (number, optional): Minimum EPA range filter
- `max_range` (number, optional): Maximum EPA range filter
- `body_type` (string, optional): Filter by body type
- `availability_status` (string, optional): Filter by availability - `available`, `coming_soon`, `discontinued`
- `sort` (string, optional): Sort field - `year`, `price`, `range`, `created_at` (default: `created_at`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `search` (string, optional): Search in make, model, and description

**Example:**
```
GET /api/ev-listings?make=Tesla&min_range=300&availability_status=available&sort=price&order=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2024,
      "trim": "Long Range",
      "body_type": "Sedan",
      "drivetrain": "RWD",
      "battery_capacity": 75,
      "range_epa": 358,
      "range_wltp": 491,
      "acceleration_0_60": 4.2,
      "top_speed": 140,
      "charging_speed_dc": 250,
      "charging_speed_ac": 11,
      "starting_price": 47240,
      "max_price": 52240,
      "availability_status": "available",
      "images": [
        "https://example.com/tesla-model3-1.jpg",
        "https://example.com/tesla-model3-2.jpg"
      ],
      "specifications": {
        "seating_capacity": 5,
        "cargo_space": "15 cu ft",
        "ground_clearance": "5.5 in",
        "curb_weight": "4034 lbs"
      },
      "features": [
        "Autopilot",
        "Supercharging",
        "Over-the-air updates",
        "Premium audio"
      ],
      "description": "The Tesla Model 3 is a premium electric sedan with cutting-edge technology and impressive range.",
      "manufacturer_website": "https://tesla.com/model3",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Get EV Listing by ID
```
GET /api/ev-listings/:id
```

Get detailed information about a specific EV listing.

**Parameters:**
- `id` (string): EV listing UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "uuid-here",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2024,
      "trim": "Long Range",
      "body_type": "Sedan",
      "drivetrain": "RWD",
      "battery_capacity": 75,
      "range_epa": 358,
      "range_wltp": 491,
      "acceleration_0_60": 4.2,
      "top_speed": 140,
      "charging_speed_dc": 250,
      "charging_speed_ac": 11,
      "starting_price": 47240,
      "max_price": 52240,
      "availability_status": "available",
      "images": [
        "https://example.com/tesla-model3-1.jpg",
        "https://example.com/tesla-model3-2.jpg"
      ],
      "specifications": {
        "seating_capacity": 5,
        "cargo_space": "15 cu ft",
        "ground_clearance": "5.5 in",
        "curb_weight": "4034 lbs",
        "warranty": "4 years / 50,000 miles"
      },
      "features": [
        "Autopilot",
        "Supercharging",
        "Over-the-air updates",
        "Premium audio",
        "Glass roof",
        "Mobile connector"
      ],
      "description": "The Tesla Model 3 is a premium electric sedan with cutting-edge technology and impressive range. Features include Autopilot, over-the-air updates, and access to Tesla's extensive Supercharger network.",
      "manufacturer_website": "https://tesla.com/model3",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T12:00:00Z"
    }
  }
}
```

---

### Create EV Listing
```
POST /api/ev-listings
```

Create a new EV listing (requires authentication, admin/moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "make": "Rivian",
  "model": "R1T",
  "year": 2024,
  "trim": "Launch Edition",
  "body_type": "Pickup Truck",
  "drivetrain": "AWD",
  "battery_capacity": 135,
  "range_epa": 314,
  "range_wltp": null,
  "acceleration_0_60": 3.0,
  "top_speed": 125,
  "charging_speed_dc": 210,
  "charging_speed_ac": 11,
  "starting_price": 73000,
  "max_price": 87000,
  "availability_status": "available",
  "images": [
    "https://example.com/rivian-r1t-1.jpg"
  ],
  "specifications": {
    "seating_capacity": 5,
    "payload": "1764 lbs",
    "towing_capacity": "11000 lbs",
    "ground_clearance": "14.9 in"
  },
  "features": [
    "Quad-motor AWD",
    "Air suspension",
    "Tank turn",
    "Camp mode",
    "Gear guard"
  ],
  "description": "The Rivian R1T is an electric pickup truck designed for adventure.",
  "manufacturer_website": "https://rivian.com/r1t"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "EV listing created successfully",
  "data": {
    "listing": {
      "id": "new-uuid-here",
      // ... full listing object with same structure as GET
    }
  }
}
```

**Validation Rules:**
- `make`: Required string, max 50 characters
- `model`: Required string, max 50 characters
- `year`: Required integer, 2010 to current year + 2
- `battery_capacity`: Optional positive number
- `range_epa`: Optional positive integer
- `starting_price`: Optional positive number
- `availability_status`: Optional enum - `available`, `coming_soon`, `discontinued`
- `images`: Optional array of URLs, max 10 items
- `features`: Optional array of strings, max 100 characters each

---

### Update EV Listing
```
PUT /api/ev-listings/:id
```

Update an existing EV listing (requires authentication, admin/moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): EV listing UUID

**Request Body:**
```json
{
  "starting_price": 75000,
  "max_price": 89000,
  "availability_status": "available",
  "description": "Updated description with new pricing information"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "EV listing updated successfully",
  "data": {
    "listing": {
      // Updated listing object with same structure as GET
    }
  }
}
```

---

### Delete EV Listing
```
DELETE /api/ev-listings/:id
```

Delete an EV listing (requires authentication, admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): EV listing UUID

**Response (200):**
```json
{
  "success": true,
  "message": "EV listing deleted successfully"
}
```

---

### Get Available Makes
```
GET /api/ev-listings/meta/makes
```

Get list of all available EV makes.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "makes": [
      "Tesla",
      "Rivian", 
      "Ford",
      "Chevrolet",
      "BMW",
      "Audi",
      "Mercedes-Benz",
      "Volkswagen",
      "Hyundai",
      "Kia"
    ]
  }
}
```

---

### Get Models by Make
```
GET /api/ev-listings/meta/models/:make
```

Get list of models for a specific make.

**Parameters:**
- `make` (string): Vehicle manufacturer name

**Example:**
```
GET /api/ev-listings/meta/models/Tesla
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "make": "Tesla",
    "models": [
      "Model 3",
      "Model Y",
      "Model S",
      "Model X",
      "Cybertruck"
    ]
  }
}
```

## Error Responses

### EV Listing Not Found
```json
{
  "success": false,
  "error": "EV listing not found"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions. Admin or moderator access required."
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "make": ["Make is required"],
    "year": ["Year must be between 2010 and 2026"]
  }
}
```

### Invalid Make
```json
{
  "success": false,
  "error": "Make not found"
}
```