# Likes API

Content likes and reactions system for forum posts, blog posts, and other entities.

## Base URL
```
/api/likes
```

## Endpoints

### Like/Unlike Content
```
POST /api/likes
```

Like or unlike content. If already liked, this will remove the like (toggle behavior).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "entity_type": "forum_post",
  "entity_id": "post-uuid"
}
```

**Supported Entity Types:**
- `forum_post` - Forum thread posts
- `forum_reply` - Forum replies
- `blog_post` - Blog posts
- `blog_comment` - Blog comments
- `marketplace_listing` - Marketplace listings
- `wanted_ad` - Wanted advertisements
- `vehicle` - User vehicles

**Response (201) - Liked:**
```json
{
  "success": true,
  "message": "Content liked successfully",
  "data": {
    "like": {
      "id": "like-uuid",
      "user_id": "user-uuid",
      "entity_type": "forum_post",
      "entity_id": "post-uuid",
      "created_at": "2024-01-15T16:30:00Z"
    },
    "like_count": 13,
    "user_liked": true
  }
}
```

**Response (200) - Unliked:**
```json
{
  "success": true,
  "message": "Like removed successfully",
  "data": {
    "like_count": 12,
    "user_liked": false
  }
}
```

**Validation Rules:**
- `entity_type`: Required enum (see supported types above)
- `entity_id`: Required valid UUID

---

### Get Entity Likes
```
GET /api/likes/entity/:entityType/:entityId
```

Get all likes for a specific entity with user information.

**Parameters:**
- `entityType` (string): Entity type (see supported types above)
- `entityId` (string): Entity UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Example:**
```
GET /api/likes/entity/forum_post/post-uuid?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "id": "like-uuid",
        "user_id": "user-uuid",
        "entity_type": "forum_post",
        "entity_id": "post-uuid",
        "created_at": "2024-01-15T16:30:00Z",
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
      "total": 13,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "total_likes": 13,
      "recent_likes": 3
    }
  }
}
```

---

### Get User Likes
```
GET /api/likes/user/:userId
```

Get all content liked by a specific user.

**Parameters:**
- `userId` (string): User UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `entity_type` (string, optional): Filter by entity type

**Example:**
```
GET /api/likes/user/user-uuid?entity_type=forum_post&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "id": "like-uuid",
        "user_id": "user-uuid",
        "entity_type": "forum_post",
        "entity_id": "post-uuid",
        "created_at": "2024-01-15T16:30:00Z",
        "entity_details": {
          "title": "Best charging practices for long battery life",
          "author": "evexpert",
          "category": "General Discussion"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Get Like Statistics
```
GET /api/likes/stats
```

Get overall like statistics for the platform.

**Query Parameters:**
- `timeframe` (string, optional): Time period - `24h`, `7d`, `30d`, `all` (default: `30d`)
- `entity_type` (string, optional): Filter by entity type

**Example:**
```
GET /api/likes/stats?timeframe=7d&entity_type=forum_post
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_likes": 1250,
      "likes_by_type": {
        "forum_post": 650,
        "forum_reply": 380,
        "blog_post": 150,
        "blog_comment": 70
      },
      "top_liked_content": [
        {
          "entity_type": "forum_post",
          "entity_id": "post-uuid",
          "title": "Best charging practices for long battery life",
          "like_count": 45,
          "author": "evexpert"
        }
      ],
      "timeframe": "7d"
    }
  }
}
```

---

### Delete Like
```
DELETE /api/likes/:id
```

Delete a specific like (user who created it or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Like UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Like removed successfully"
}
```

---

### Get Top Liked Content
```
GET /api/likes/top
```

Get the most liked content across the platform.

**Query Parameters:**
- `timeframe` (string, optional): Time period - `24h`, `7d`, `30d`, `all` (default: `30d`)
- `entity_type` (string, optional): Filter by entity type
- `limit` (number, optional): Number of results (default: 10, max: 50)

**Example:**
```
GET /api/likes/top?timeframe=7d&entity_type=forum_post&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "top_content": [
      {
        "entity_type": "forum_post",
        "entity_id": "post-uuid",
        "title": "Best charging practices for long battery life",
        "like_count": 45,
        "author": {
          "username": "evexpert",
          "full_name": "EV Expert",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "category": "General Discussion",
        "created_at": "2024-01-10T09:00:00Z"
      }
    ],
    "timeframe": "7d"
  }
}
```

## Error Responses

### Entity Not Found
```json
{
  "success": false,
  "error": "Entity not found or not accessible"
}
```

### Invalid Entity Type
```json
{
  "success": false,
  "error": "Invalid entity type"
}
```

### Already Liked
```json
{
  "success": false,
  "error": "Content already liked by user"
}
```

### Self-Like Error
```json
{
  "success": false,
  "error": "Cannot like your own content"
}
```

### Like Not Found
```json
{
  "success": false,
  "error": "Like not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only manage your own likes."
}
```