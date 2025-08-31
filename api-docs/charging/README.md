# Charging Stations API

Charging station directory with locations, reviews, and session tracking.

## Base URL
```
/api/charging-stations
```

**Note:** The charging stations routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get All Charging Stations
```
GET /api/charging-stations
```

Get all charging stations with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `network` (string, optional): Filter by charging network
- `connector_type` (string, optional): Filter by connector type
- `power_level` (string, optional): Filter by power level
- `city` (string, optional): Filter by city
- `state` (string, optional): Filter by state
- `latitude` (number, optional): Center latitude for proximity search
- `longitude` (number, optional): Center longitude for proximity search
- `radius` (number, optional): Search radius in miles (requires lat/lng)
- `amenities` (string, optional): Filter by amenities
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `asc`)
- `sortBy` (string, optional): Sort field - `name`, `city`, `created_at`, `distance` (default: `name`)

**Example:**
```
GET /api/charging-stations?network=Tesla&city=San Francisco&connector_type=Tesla&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "station-uuid",
      "name": "Tesla Supercharger - Union Square",
      "address": "333 Post St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94108",
      "country": "US",
      "latitude": 37.7879,
      "longitude": -122.4075,
      "network": "Tesla",
      "station_type": "DC Fast Charging",
      "connector_types": ["Tesla", "CCS"],
      "power_levels": ["250kW", "150kW"],
      "pricing_info": {
        "per_kwh": 0.28,
        "per_minute": 0.26,
        "idle_fee": 1.00,
        "currency": "USD"
      },
      "amenities": [
        "Parking",
        "Restrooms",
        "Shopping",
        "Restaurant",
        "WiFi"
      ],
      "hours_of_operation": {
        "monday": "24/7",
        "tuesday": "24/7",
        "wednesday": "24/7",
        "thursday": "24/7",
        "friday": "24/7",
        "saturday": "24/7",
        "sunday": "24/7"
      },
      "phone": "+1-555-123-4567",
      "website": "https://tesla.com/findus",
      "is_operational": true,
      "last_verified": "2024-01-10T00:00:00Z",
      "created_at": "2023-06-01T00:00:00Z",
      "updated_at": "2024-01-10T00:00:00Z",
      "stats": {
        "total_reviews": 25,
        "average_rating": 4.6,
        "total_sessions": 1250
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Charging Station
```
POST /api/charging-stations
```

Create a new charging station (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "ChargePoint Station - Downtown",
  "address": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90210",
  "country": "US",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "network": "ChargePoint",
  "station_type": "Level 2",
  "connector_types": ["J1772", "CCS"],
  "power_levels": ["7kW", "11kW"],
  "pricing_info": {
    "per_kwh": 0.25,
    "currency": "USD"
  },
  "amenities": ["Parking", "Shopping"],
  "hours_of_operation": {
    "monday": "6:00-22:00",
    "tuesday": "6:00-22:00",
    "wednesday": "6:00-22:00",
    "thursday": "6:00-22:00",
    "friday": "6:00-22:00",
    "saturday": "8:00-20:00",
    "sunday": "8:00-20:00"
  },
  "phone": "+1-555-987-6543",
  "website": "https://chargepoint.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Charging station created successfully",
  "data": {
    "station": {
      "id": "new-station-uuid",
      // ... full station object with same structure as GET
      "is_operational": true,
      "created_at": "2024-01-15T18:00:00Z",
      "updated_at": "2024-01-15T18:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `name`: Required string, max 200 characters
- `address`: Required string, max 500 characters
- `city`: Required string, max 100 characters
- `state`: Required string, max 50 characters
- `country`: Required string, max 50 characters
- `network`: Optional string, max 100 characters
- `connector_types`: Optional array of strings
- `power_levels`: Optional array of strings

---

### Get Station by ID
```
GET /api/charging-stations/:id
```

Get detailed information about a specific charging station.

**Parameters:**
- `id` (string): Station UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "station": {
      "id": "station-uuid",
      "name": "Tesla Supercharger - Union Square",
      "address": "333 Post St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94108",
      "country": "US",
      "latitude": 37.7879,
      "longitude": -122.4075,
      "network": "Tesla",
      "station_type": "DC Fast Charging",
      "connector_types": ["Tesla", "CCS"],
      "power_levels": ["250kW", "150kW"],
      "pricing_info": {
        "per_kwh": 0.28,
        "per_minute": 0.26,
        "idle_fee": 1.00,
        "currency": "USD"
      },
      "amenities": ["Parking", "Restrooms", "Shopping", "Restaurant", "WiFi"],
      "hours_of_operation": {
        "monday": "24/7",
        "tuesday": "24/7",
        "wednesday": "24/7",
        "thursday": "24/7",
        "friday": "24/7",
        "saturday": "24/7",
        "sunday": "24/7"
      },
      "phone": "+1-555-123-4567",
      "website": "https://tesla.com/findus",
      "is_operational": true,
      "last_verified": "2024-01-10T00:00:00Z",
      "created_at": "2023-06-01T00:00:00Z",
      "updated_at": "2024-01-10T00:00:00Z",
      "stats": {
        "total_reviews": 25,
        "average_rating": 4.6,
        "total_sessions": 1250,
        "recent_sessions": 45
      }
    }
  }
}
```

---

### Update Charging Station
```
PUT /api/charging-stations/:id
```

Update charging station information (creator or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Station UUID

**Request Body:**
```json
{
  "pricing_info": {
    "per_kwh": 0.30,
    "per_minute": 0.28,
    "idle_fee": 1.00,
    "currency": "USD"
  },
  "amenities": ["Parking", "Restrooms", "Shopping", "Restaurant", "WiFi", "EV Charging Lounge"],
  "is_operational": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Charging station updated successfully",
  "data": {
    "station": {
      // Updated station object
    }
  }
}
```

---

### Delete Charging Station
```
DELETE /api/charging-stations/:id
```

Delete a charging station (creator or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Station UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Charging station deleted successfully"
}
```

---

### Get Station Reviews
```
GET /api/charging-stations/:id/reviews
```

Get reviews for a specific charging station.

**Parameters:**
- `id` (string): Station UUID

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
        "station_id": "station-uuid",
        "user_id": "user-uuid",
        "rating": 5,
        "title": "Excellent charging experience",
        "content": "Fast charging speeds and great amenities. Clean restrooms and nearby shopping.",
        "pros": ["Fast charging", "Clean facilities", "Good location"],
        "cons": ["Can get busy during peak hours"],
        "visit_date": "2024-01-12T00:00:00Z",
        "would_recommend": true,
        "created_at": "2024-01-13T14:30:00Z",
        "updated_at": "2024-01-13T14:30:00Z",
        "user": {
          "username": "evtraveler",
          "full_name": "EV Traveler",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_verified": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "average_rating": 4.6,
      "total_reviews": 25,
      "rating_distribution": {
        "5": 15,
        "4": 7,
        "3": 2,
        "2": 1,
        "1": 0
      }
    }
  }
}
```

---

### Create Station Review
```
POST /api/charging-stations/:id/reviews
```

Create a review for a charging station.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Station UUID

**Request Body:**
```json
{
  "rating": 4,
  "title": "Good charging station with minor issues",
  "content": "Overall good experience but one charger was out of order.",
  "pros": ["Fast charging when working", "Good location", "Clean"],
  "cons": ["One charger broken", "Limited parking"],
  "visit_date": "2024-01-14",
  "would_recommend": true
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
      "station_id": "station-uuid",
      "user_id": "user-uuid",
      "rating": 4,
      "title": "Good charging station with minor issues",
      "content": "Overall good experience but one charger was out of order.",
      "pros": ["Fast charging when working", "Good location", "Clean"],
      "cons": ["One charger broken", "Limited parking"],
      "visit_date": "2024-01-14T00:00:00Z",
      "would_recommend": true,
      "created_at": "2024-01-15T18:30:00Z",
      "updated_at": "2024-01-15T18:30:00Z"
    }
  }
}
```

---

### Get Networks
```
GET /api/charging-stations/meta/networks
```

Get list of all charging networks.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "networks": [
      {
        "name": "Tesla",
        "station_count": 450,
        "total_connectors": 2800
      },
      {
        "name": "ChargePoint",
        "station_count": 320,
        "total_connectors": 890
      },
      {
        "name": "Electrify America",
        "station_count": 180,
        "total_connectors": 720
      }
    ]
  }
}
```

---

### Get Connector Types
```
GET /api/charging-stations/meta/connector-types
```

Get list of all connector types.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connector_types": [
      {
        "type": "Tesla",
        "description": "Tesla proprietary connector",
        "power_levels": ["150kW", "250kW", "350kW"],
        "station_count": 450
      },
      {
        "type": "CCS",
        "description": "Combined Charging System",
        "power_levels": ["50kW", "150kW", "250kW", "350kW"],
        "station_count": 680
      },
      {
        "type": "CHAdeMO",
        "description": "CHAdeMO fast charging standard",
        "power_levels": ["50kW", "100kW"],
        "station_count": 280
      },
      {
        "type": "J1772",
        "description": "Level 2 AC charging",
        "power_levels": ["3.3kW", "6.6kW", "11kW"],
        "station_count": 1200
      }
    ]
  }
}
```

---

### Search Charging Stations
```
GET /api/charging-stations/search
```

Search charging stations by name, address, or amenities.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `latitude` (number, optional): Center latitude for proximity boost
- `longitude` (number, optional): Center longitude for proximity boost

**Example:**
```
GET /api/charging-stations/search?q=supercharger&latitude=37.7749&longitude=-122.4194
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        // Same structure as GET /charging-stations
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Report Station Issue
```
POST /api/charging-stations/:id/report
```

Report an issue with a charging station.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Station UUID

**Request Body:**
```json
{
  "issue_type": "out_of_order",
  "description": "Charger #3 is not working, displays error message",
  "severity": "medium"
}
```

**Available Issue Types:**
- `out_of_order` - Charger not working
- `slow_charging` - Charging slower than expected
- `access_issue` - Access problems (gate, payment, etc.)
- `safety_concern` - Safety or security issue
- `amenity_issue` - Problem with amenities
- `pricing_error` - Incorrect pricing information
- `location_error` - Incorrect location information

**Response (201):**
```json
{
  "success": true,
  "message": "Station issue reported successfully",
  "data": {
    "report": {
      "id": "report-uuid",
      "station_id": "station-uuid",
      "reporter_id": "user-uuid",
      "issue_type": "out_of_order",
      "description": "Charger #3 is not working, displays error message",
      "severity": "medium",
      "status": "open",
      "created_at": "2024-01-15T19:00:00Z"
    }
  }
}
```

## Error Responses

### Station Not Found
```json
{
  "success": false,
  "error": "Charging station not found"
}
```

### Invalid Location
```json
{
  "success": false,
  "error": "Invalid latitude or longitude coordinates"
}
```

### Duplicate Review
```json
{
  "success": false,
  "error": "You have already reviewed this charging station"
}
```

### Search Query Too Short
```json
{
  "success": false,
  "error": "Search query must be at least 2 characters long"
}
```

### Invalid Issue Type
```json
{
  "success": false,
  "error": "Invalid issue type"
}
```