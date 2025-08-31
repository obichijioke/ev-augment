# Forum API

Discussion forum with categories, threads, replies, and moderation features.

## Base URL
```
/api/forum
```

## Endpoints

### Categories

#### Get All Categories
```
GET /api/forum/categories
```

Get all active forum categories.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "General Discussion",
      "description": "General EV topics and discussions",
      "slug": "general-discussion",
      "icon": "💬",
      "color": "#3B82F6",
      "is_active": true,
      "sort_order": 1,
      "thread_count": 150,
      "post_count": 1250,
      "last_post_at": "2024-01-15T14:30:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

#### Create Category
```
POST /api/forum/categories
```

Create a new forum category (admin/moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Tesla Owners",
  "description": "Discussion for Tesla vehicle owners",
  "slug": "tesla-owners",
  "icon": "🚗",
  "color": "#EF4444",
  "sort_order": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "name": "Tesla Owners",
    "description": "Discussion for Tesla vehicle owners",
    "slug": "tesla-owners",
    "icon": "🚗",
    "color": "#EF4444",
    "is_active": true,
    "sort_order": 5,
    "thread_count": 0,
    "post_count": 0,
    "last_post_at": null,
    "created_at": "2024-01-15T15:00:00Z",
    "updated_at": "2024-01-15T15:00:00Z"
  },
  "message": "Category created successfully"
}
```

#### Update Category
```
PUT /api/forum/categories/:id
```

Update a forum category (admin/moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Category UUID

**Request Body:**
```json
{
  "name": "Tesla Community",
  "description": "Updated description for Tesla discussions",
  "color": "#10B981"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated category object
  },
  "message": "Category updated successfully"
}
```

#### Delete Category
```
DELETE /api/forum/categories/:id
```

Delete a forum category (admin/moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Category UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

### Threads

#### Get All Threads
```
GET /api/forum/threads
```

Get forum threads with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category_id` (string, optional): Filter by category UUID
- `category` (string, optional): Filter by category slug
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `last_post_at`, `view_count`, `reply_count` (default: `last_post_at`)
- `search` (string, optional): Search in title and content

**Example:**
```
GET /api/forum/threads?category=general-discussion&page=1&limit=10&sortBy=last_post_at
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "Best charging practices for long battery life",
      "content": "I've been researching optimal charging habits...",
      "author_id": "user-uuid",
      "category_id": "category-uuid",
      "slug": "best-charging-practices-long-battery-life",
      "is_pinned": false,
      "is_locked": false,
      "is_deleted": false,
      "view_count": 245,
      "reply_count": 18,
      "like_count": 12,
      "last_post_at": "2024-01-15T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
      "users": {
        "username": "evexpert",
        "full_name": "EV Expert",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": true
      },
      "forum_categories": {
        "name": "General Discussion",
        "slug": "general-discussion",
        "color": "#3B82F6"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Thread by ID
```
GET /api/forum/threads/:id
```

Get detailed thread information with replies.

**Parameters:**
- `id` (string): Thread UUID

**Query Parameters:**
- `include_replies` (boolean, optional): Include replies (default: true)
- `replies_page` (number, optional): Replies page number (default: 1)
- `replies_limit` (number, optional): Replies per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "thread": {
      "id": "uuid-here",
      "title": "Best charging practices for long battery life",
      "content": "I've been researching optimal charging habits and wanted to share what I've learned...",
      "author_id": "user-uuid",
      "category_id": "category-uuid",
      "slug": "best-charging-practices-long-battery-life",
      "is_pinned": false,
      "is_locked": false,
      "is_deleted": false,
      "view_count": 246,
      "reply_count": 18,
      "like_count": 12,
      "last_post_at": "2024-01-15T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
      "users": {
        "username": "evexpert",
        "full_name": "EV Expert",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_verified": true
      },
      "forum_categories": {
        "name": "General Discussion",
        "slug": "general-discussion",
        "color": "#3B82F6"
      }
    },
    "replies": [
      {
        "id": "reply-uuid",
        "thread_id": "uuid-here",
        "author_id": "user2-uuid",
        "parent_id": null,
        "content": "Great information! I've been following similar practices...",
        "is_deleted": false,
        "like_count": 5,
        "created_at": "2024-01-10T11:30:00Z",
        "updated_at": "2024-01-10T11:30:00Z",
        "users": {
          "username": "teslaowner",
          "full_name": "Tesla Owner",
          "avatar_url": "https://example.com/avatar2.jpg",
          "is_verified": false
        }
      }
    ],
    "replies_pagination": {
      "page": 1,
      "limit": 20,
      "total": 18,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### Create Thread
```
POST /api/forum/threads
```

Create a new forum thread.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Question about home charging setup",
  "content": "I'm looking to install a Level 2 charger at home. What are the key considerations?",
  "category_id": "category-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Thread created successfully",
  "data": {
    "thread": {
      "id": "new-uuid-here",
      "title": "Question about home charging setup",
      "content": "I'm looking to install a Level 2 charger at home. What are the key considerations?",
      "author_id": "user-uuid",
      "category_id": "category-uuid",
      "slug": "question-about-home-charging-setup",
      "is_pinned": false,
      "is_locked": false,
      "is_deleted": false,
      "view_count": 1,
      "reply_count": 0,
      "like_count": 0,
      "last_post_at": "2024-01-15T15:00:00Z",
      "created_at": "2024-01-15T15:00:00Z",
      "updated_at": "2024-01-15T15:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `title`: Required string, 5-200 characters
- `content`: Required string, 10-50000 characters
- `category_id`: Required valid UUID

#### Update Thread
```
PUT /api/forum/threads/:id
```

Update a forum thread (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Thread UUID

**Request Body:**
```json
{
  "title": "Updated: Question about home charging setup",
  "content": "Updated content with more specific questions about installation..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Thread updated successfully",
  "data": {
    "thread": {
      // Updated thread object
    }
  }
}
```

#### Delete Thread
```
DELETE /api/forum/threads/:id
```

Delete a forum thread (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Thread UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Thread deleted successfully"
}
```

---

### Replies

#### Create Reply
```
POST /api/forum/replies
```

Create a reply to a forum thread.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "thread_id": "thread-uuid",
  "content": "For home charging, I'd recommend getting a 240V outlet installed...",
  "parent_id": null
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Reply created successfully",
  "data": {
    "reply": {
      "id": "new-uuid-here",
      "thread_id": "thread-uuid",
      "author_id": "user-uuid",
      "parent_id": null,
      "content": "For home charging, I'd recommend getting a 240V outlet installed...",
      "is_deleted": false,
      "like_count": 0,
      "created_at": "2024-01-15T16:00:00Z",
      "updated_at": "2024-01-15T16:00:00Z",
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
- `thread_id`: Required valid UUID
- `content`: Required string, 1-10000 characters
- `parent_id`: Optional valid UUID for nested replies

#### Update Reply
```
PUT /api/forum/replies/:id
```

Update a forum reply (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Reply UUID

**Request Body:**
```json
{
  "content": "Updated reply content with more detailed information..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reply updated successfully",
  "data": {
    "reply": {
      // Updated reply object
    }
  }
}
```

#### Delete Reply
```
DELETE /api/forum/replies/:id
```

Delete a forum reply (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Reply UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Reply deleted successfully"
}
```

---

### Moderation

#### Moderate Thread
```
POST /api/forum/threads/:id/moderate
```

Perform moderation action on a thread (moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Thread UUID

**Request Body:**
```json
{
  "action": "pin",
  "reason": "Important community announcement"
}
```

**Available Actions:**
- `pin` / `unpin`: Pin/unpin thread
- `lock` / `unlock`: Lock/unlock thread
- `delete`: Delete thread
- `move`: Move to different category (requires `category_id`)

**Response (200):**
```json
{
  "success": true,
  "message": "Thread moderated successfully",
  "data": {
    "action": "pin",
    "thread": {
      // Updated thread object
    }
  }
}
```

## Forum Images

### Upload Image
```
POST /api/forum/images/upload
```

Upload an image for a forum thread or reply.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` (file): Image file (JPEG, PNG, GIF, WebP, max 5MB)
- `thread_id` (string, optional): Thread UUID (required if no reply_id)
- `reply_id` (string, optional): Reply UUID (required if no thread_id)
- `alt_text` (string, optional): Alternative text for accessibility

**Response (201):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image": {
      "id": "image-uuid",
      "url": "https://storage.example.com/forum/images/image.jpg",
      "filename": "charging-setup.jpg",
      "alt_text": "Home charging station installation",
      "size": 1024000,
      "thread_id": "thread-uuid",
      "reply_id": null,
      "uploaded_by": "user-uuid",
      "created_at": "2024-01-15T16:30:00Z"
    }
  }
}
```

### Get Thread Images
```
GET /api/forum/images/thread/:threadId
```

Get all images for a specific thread.

**Parameters:**
- `threadId` (string): Thread UUID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "image-uuid",
      "url": "https://storage.example.com/forum/images/image.jpg",
      "filename": "charging-setup.jpg",
      "alt_text": "Home charging station installation",
      "size": 1024000,
      "thread_id": "thread-uuid",
      "reply_id": null,
      "uploaded_by": "user-uuid",
      "created_at": "2024-01-15T16:30:00Z"
    }
  ]
}
```

### Delete Image
```
DELETE /api/forum/images/:id
```

Delete a forum image (uploader or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Image UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Forum Moderation

### Get Users (Admin Only)
```
GET /api/forum/moderation/users
```

Get all users with their forum roles and statistics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search users

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "user",
      "forum_role": "user",
      "forum_post_count": 25,
      "forum_reputation": 150,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Responses

### Thread Not Found
```json
{
  "success": false,
  "error": "Thread not found"
}
```

### Category Not Found
```json
{
  "success": false,
  "error": "Category not found"
}
```

### Thread Locked
```json
{
  "success": false,
  "error": "Cannot reply to locked thread"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions - moderator role required"
}
```

### Image Upload Error
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
}
```

### File Size Error
```json
{
  "success": false,
  "error": "File too large. Maximum size is 5MB."
}
```