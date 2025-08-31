# Users API

User profile management, search, and social features.

## Base URL
```
/api/users
```

## Endpoints

### Get Current User Profile
```
GET /api/users/profile
```

Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "EV enthusiast",
      "location": "San Francisco, CA",
      "website": "https://johndoe.com",
      "phone": "+1234567890",
      "is_verified": false,
      "is_business": false,
      "business_name": null,
      "business_type": null,
      "join_date": "2024-01-01T00:00:00Z",
      "last_active": "2024-01-15T12:00:00Z",
      "privacy_settings": {
        "show_email": false,
        "show_phone": false,
        "show_location": true
      },
      "notification_settings": {
        "email": true,
        "push": true,
        "marketing": false
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

### Update User Profile
```
PUT /api/users/profile
```

Update the current user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Electric vehicle advocate and tech enthusiast",
  "location": "Los Angeles, CA",
  "website": "https://johnsmith.com",
  "phone": "+1987654321",
  "privacy_settings": {
    "show_email": false,
    "show_phone": false,
    "show_location": true
  },
  "notification_settings": {
    "email": true,
    "push": true,
    "marketing": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // Updated user object with same structure as GET
    }
  }
}
```

---

### Search Users
```
GET /api/users/search
```

Search for users by username, full name, or business name.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 50)
- `sort` (string, optional): Sort field - `username`, `full_name`, `join_date` (default: `username`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `asc`)

**Example:**
```
GET /api/users/search?q=john&page=1&limit=10&sort=username&order=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "is_verified": false,
      "is_business": false,
      "business_name": null,
      "join_date": "2024-01-01T00:00:00Z"
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

### Get User by Username
```
GET /api/users/:username
```

Get public profile information for a specific user.

**Parameters:**
- `username` (string): The username to look up

**Query Parameters:**
- `include_stats` (boolean, optional): Include user statistics (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "EV enthusiast",
      "location": "San Francisco, CA",
      "website": "https://johndoe.com",
      "is_verified": false,
      "is_business": false,
      "business_name": null,
      "join_date": "2024-01-01T00:00:00Z",
      "last_active": "2024-01-15T12:00:00Z"
    },
    "stats": {
      "vehicles_count": 2,
      "posts_count": 15,
      "reviews_count": 8,
      "followers_count": 25,
      "following_count": 18
    }
  }
}
```

---

### Get User's Vehicles
```
GET /api/users/:username/vehicles
```

Get public vehicles owned by a specific user.

**Parameters:**
- `username` (string): The username to look up

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2023,
      "trim": "Long Range",
      "color": "Pearl White",
      "nickname": "Lightning",
      "current_mileage": 15000,
      "battery_capacity": 75,
      "estimated_range": 358,
      "images": ["https://example.com/image1.jpg"],
      "created_at": "2024-01-01T00:00:00Z"
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

### Get User's Posts
```
GET /api/users/:username/posts
```

Get forum posts by a specific user.

**Parameters:**
- `username` (string): The username to look up

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sort` (string, optional): Sort field (default: `created_at`)
- `order` (string, optional): Sort order (default: `desc`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "My experience with Tesla charging",
      "content": "I've been using Tesla superchargers for 6 months...",
      "category": "Charging",
      "view_count": 150,
      "reply_count": 12,
      "like_count": 8,
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
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
```

---

### Follow/Unfollow User
```
POST /api/users/:username/follow
```

Follow or unfollow a user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `username` (string): The username to follow/unfollow

**Response (200):**
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "following": true,
    "followers_count": 26
  }
}
```

**Response (200) - Unfollow:**
```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "following": false,
    "followers_count": 24
  }
}
```

---

### Get User's Followers
```
GET /api/users/:username/followers
```

Get list of users following the specified user.

**Parameters:**
- `username` (string): The username to look up

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "username": "follower1",
      "full_name": "Follower One",
      "avatar_url": "https://example.com/avatar1.jpg",
      "is_verified": false,
      "followed_at": "2024-01-05T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Get Users Following
```
GET /api/users/:username/following
```

Get list of users that the specified user is following.

**Parameters:**
- `username` (string): The username to look up

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "username": "following1",
      "full_name": "Following One",
      "avatar_url": "https://example.com/avatar1.jpg",
      "is_verified": true,
      "followed_at": "2024-01-03T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 18,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Error Responses

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### Username Already Taken
```json
{
  "success": false,
  "error": "Username already taken"
}
```

### Search Query Too Short
```json
{
  "success": false,
  "error": "Search query must be at least 2 characters long"
}
```