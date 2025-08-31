# Vehicles API

Personal vehicle management for users to track their EVs.

## Base URL
```
/api/vehicles
```

## Endpoints

### Get All Vehicles
```
GET /api/vehicles
```

Get all public vehicles with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 50)
- `make` (string, optional): Filter by vehicle make
- `model` (string, optional): Filter by vehicle model
- `year` (number, optional): Filter by vehicle year
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `year`, `make`, `model`, `current_mileage` (default: `created_at`)

**Example:**
```
GET /api/vehicles?make=Tesla&year=2023&page=1&limit=10&sort=desc&sortBy=created_at
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "owner_id": "user-uuid",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2023,
      "trim": "Long Range",
      "color": "Pearl White",
      "vin": "5YJ3E1EB*********",
      "nickname": "Lightning",
      "purchase_date": "2023-06-15T00:00:00Z",
      "purchase_price": 52000,
      "current_mileage": 15000,
      "battery_capacity": 75,
      "estimated_range": 358,
      "charging_speed": "250kW DC / 11kW AC",
      "modifications": ["Tinted windows", "All-weather floor mats"],
      "notes": "Amazing car, love the autopilot features",
      "images": [
        "https://example.com/vehicle1.jpg",
        "https://example.com/vehicle2.jpg"
      ],
      "is_public": true,
      "created_at": "2023-06-20T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
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
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Create Vehicle
```
POST /api/vehicles
```

Create a new vehicle for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "make": "Tesla",
  "model": "Model Y",
  "year": 2024,
  "trim": "Performance",
  "color": "Midnight Silver Metallic",
  "vin": "5YJYGDEE*********",
  "nickname": "Storm",
  "purchase_date": "2024-01-10",
  "purchase_price": 67000,
  "current_mileage": 500,
  "battery_capacity": 75,
  "estimated_range": 303,
  "charging_speed": "250kW DC / 11kW AC",
  "modifications": ["Performance pedals", "All-weather floor mats"],
  "notes": "Incredible acceleration and handling",
  "is_public": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "vehicle": {
      "id": "new-uuid-here",
      "owner_id": "user-uuid",
      "make": "Tesla",
      "model": "Model Y",
      "year": 2024,
      "trim": "Performance",
      "color": "Midnight Silver Metallic",
      "vin": "5YJYGDEE*********",
      "nickname": "Storm",
      "purchase_date": "2024-01-10T00:00:00Z",
      "purchase_price": 67000,
      "current_mileage": 500,
      "battery_capacity": 75,
      "estimated_range": 303,
      "charging_speed": "250kW DC / 11kW AC",
      "modifications": ["Performance pedals", "All-weather floor mats"],
      "notes": "Incredible acceleration and handling",
      "images": [],
      "is_public": true,
      "created_at": "2024-01-15T15:00:00Z",
      "updated_at": "2024-01-15T15:00:00Z",
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

**Validation Rules:**
- `make`: Required string, max 50 characters
- `model`: Required string, max 50 characters
- `year`: Required integer, 1900-2030
- `trim`: Optional string, max 100 characters
- `color`: Optional string, max 50 characters
- `vin`: Optional string, max 17 characters
- `nickname`: Optional string, max 100 characters
- `purchase_price`: Optional positive number
- `current_mileage`: Optional non-negative integer
- `battery_capacity`: Optional positive number
- `estimated_range`: Optional positive integer
- `modifications`: Optional array of strings
- `is_public`: Optional boolean (default: false)

---

### Get Vehicle by ID
```
GET /api/vehicles/:id
```

Get detailed information about a specific vehicle.

**Parameters:**
- `id` (string): Vehicle UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vehicle": {
      "id": "uuid-here",
      "owner_id": "user-uuid",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2023,
      "trim": "Long Range",
      "color": "Pearl White",
      "vin": "5YJ3E1EB*********",
      "nickname": "Lightning",
      "purchase_date": "2023-06-15T00:00:00Z",
      "purchase_price": 52000,
      "current_mileage": 15000,
      "battery_capacity": 75,
      "estimated_range": 358,
      "charging_speed": "250kW DC / 11kW AC",
      "modifications": ["Tinted windows", "All-weather floor mats"],
      "notes": "Amazing car, love the autopilot features",
      "images": [
        "https://example.com/vehicle1.jpg",
        "https://example.com/vehicle2.jpg"
      ],
      "is_public": true,
      "created_at": "2023-06-20T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
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

### Update Vehicle
```
PUT /api/vehicles/:id
```

Update a vehicle (owner only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Vehicle UUID

**Request Body:**
```json
{
  "current_mileage": 16000,
  "notes": "Still loving this car after 6 months!",
  "modifications": ["Tinted windows", "All-weather floor mats", "Phone mount"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "data": {
    "vehicle": {
      // Updated vehicle object with same structure as GET
    }
  }
}
```

---

### Delete Vehicle
```
DELETE /api/vehicles/:id
```

Delete a vehicle (owner only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Vehicle UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

---

### Get Vehicle Statistics
```
GET /api/vehicles/:id/stats
```

Get statistics for a specific vehicle.

**Parameters:**
- `id` (string): Vehicle UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_distance": 15000,
      "charging_sessions": 45,
      "average_efficiency": 4.2,
      "total_charging_cost": 850.50,
      "reviews_count": 3,
      "average_rating": 4.7
    }
  }
}
```

## Error Responses

### Vehicle Not Found
```json
{
  "success": false,
  "error": "Vehicle not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only modify your own vehicles."
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "make": ["Make is required"],
    "year": ["Year must be between 1900 and 2030"]
  }
}
```