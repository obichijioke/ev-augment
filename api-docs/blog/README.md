# Blog API

Blog management system with posts, comments, categories, and tags.

## Base URL
```
/api/blog
```

## Endpoints

### Get Blog Info
```
GET /api/blog
```

Get blog API information and available endpoints.

**Response (200):**
```json
{
  "success": true,
  "message": "Blog API is running",
  "endpoints": {
    "posts": "/api/blog/posts",
    "categories": "/api/blog/categories",
    "tags": "/api/blog/tags",
    "search": "/api/blog/search",
    "author": "/api/blog/author/:authorId"
  }
}
```

---

### Posts

#### Get All Blog Posts
```
GET /api/blog/posts
```

Get all published blog posts with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `tag` (string, optional): Filter by tag
- `author` (string, optional): Filter by author UUID
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `published_at`, `updated_at`, `views`, `title` (default: `published_at`)
- `q` (string, optional): Search in title, content, and excerpt
- `status` (string, optional): Filter by status (moderator only) - `draft`, `published`, `archived`

**Example:**
```
GET /api/blog/posts?category=reviews&page=1&limit=10&sortBy=published_at&sort=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid-here",
        "author_id": "user-uuid",
        "title": "2024 Tesla Model 3 Highland Review",
        "slug": "2024-tesla-model-3-highland-review",
        "excerpt": "An in-depth look at Tesla's refreshed Model 3 with updated interior and features.",
        "content": "The 2024 Tesla Model 3 Highland brings significant updates...",
        "featured_image": "https://example.com/blog/tesla-model3-highland.jpg",
        "category": "reviews",
        "tags": ["Tesla", "Model 3", "Review", "2024"],
        "status": "published",
        "is_featured": true,
        "view_count": 1250,
        "like_count": 45,
        "comment_count": 23,
        "published_at": "2024-01-10T09:00:00Z",
        "created_at": "2024-01-08T14:00:00Z",
        "updated_at": "2024-01-10T09:00:00Z",
        "users": {
          "username": "evreviewer",
          "full_name": "EV Reviewer",
          "avatar_url": "https://example.com/reviewer-avatar.jpg",
          "is_verified": true
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

#### Create Blog Post
```
POST /api/blog/posts
```

Create a new blog post (moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "The Future of Electric Vehicle Charging Infrastructure",
  "content": "As electric vehicles become more mainstream, the charging infrastructure...",
  "excerpt": "Exploring the rapid development of EV charging networks and future innovations.",
  "category": "technology",
  "tags": ["Charging", "Infrastructure", "Future", "Technology"],
  "featured_image": "https://example.com/blog/charging-future.jpg",
  "status": "published",
  "is_featured": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "post": {
      "id": "new-uuid-here",
      "author_id": "user-uuid",
      "title": "The Future of Electric Vehicle Charging Infrastructure",
      "slug": "future-electric-vehicle-charging-infrastructure",
      "excerpt": "Exploring the rapid development of EV charging networks and future innovations.",
      "content": "As electric vehicles become more mainstream, the charging infrastructure...",
      "featured_image": "https://example.com/blog/charging-future.jpg",
      "category": "technology",
      "tags": ["Charging", "Infrastructure", "Future", "Technology"],
      "status": "published",
      "is_featured": false,
      "view_count": 0,
      "like_count": 0,
      "comment_count": 0,
      "published_at": "2024-01-15T15:00:00Z",
      "created_at": "2024-01-15T15:00:00Z",
      "updated_at": "2024-01-15T15:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `title`: Required string, 5-200 characters
- `content`: Required string, minimum 50 characters
- `excerpt`: Optional string, max 500 characters
- `category`: Optional string
- `tags`: Optional array of strings
- `status`: Optional enum - `draft`, `published` (default: `draft`)

#### Get Blog Post by Slug
```
GET /api/blog/posts/:slug
```

Get a blog post by its slug.

**Parameters:**
- `slug` (string): Post slug

**Response (200):**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid-here",
      "author_id": "user-uuid",
      "title": "2024 Tesla Model 3 Highland Review",
      "slug": "2024-tesla-model-3-highland-review",
      "excerpt": "An in-depth look at Tesla's refreshed Model 3 with updated interior and features.",
      "content": "The 2024 Tesla Model 3 Highland brings significant updates...",
      "featured_image": "https://example.com/blog/tesla-model3-highland.jpg",
      "category": "reviews",
      "tags": ["Tesla", "Model 3", "Review", "2024"],
      "status": "published",
      "is_featured": true,
      "view_count": 1251,
      "like_count": 45,
      "comment_count": 23,
      "published_at": "2024-01-10T09:00:00Z",
      "created_at": "2024-01-08T14:00:00Z",
      "updated_at": "2024-01-10T09:00:00Z",
      "users": {
        "username": "evreviewer",
        "full_name": "EV Reviewer",
        "avatar_url": "https://example.com/reviewer-avatar.jpg",
        "is_verified": true
      }
    }
  }
}
```

#### Update Blog Post
```
PUT /api/blog/posts/:id
```

Update a blog post (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Post UUID

**Request Body:**
```json
{
  "title": "Updated: 2024 Tesla Model 3 Highland Review",
  "content": "Updated content with additional insights...",
  "tags": ["Tesla", "Model 3", "Review", "2024", "Highland"],
  "is_featured": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Blog post updated successfully",
  "data": {
    "post": {
      // Updated post object
    }
  }
}
```

#### Delete Blog Post
```
DELETE /api/blog/posts/:id
```

Delete a blog post (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Post UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Blog post deleted successfully"
}
```

---

### Comments

#### Get Post Comments
```
GET /api/blog/posts/:id/comments
```

Get comments for a specific blog post.

**Parameters:**
- `id` (string): Post UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-uuid",
        "post_id": "post-uuid",
        "author_id": "user-uuid",
        "parent_id": null,
        "content": "Great review! I'm considering getting the Highland myself.",
        "is_approved": true,
        "like_count": 3,
        "created_at": "2024-01-11T10:30:00Z",
        "updated_at": "2024-01-11T10:30:00Z",
        "users": {
          "username": "evbuyer",
          "full_name": "EV Buyer",
          "avatar_url": "https://example.com/buyer-avatar.jpg",
          "is_verified": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 23,
      "pages": 2
    }
  }
}
```

#### Create Comment
```
POST /api/blog/posts/:id/comments
```

Create a comment on a blog post.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Post UUID

**Request Body:**
```json
{
  "content": "Thanks for the detailed review! Very helpful for my decision.",
  "parent_id": null
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "comment": {
      "id": "new-comment-uuid",
      "post_id": "post-uuid",
      "author_id": "user-uuid",
      "parent_id": null,
      "content": "Thanks for the detailed review! Very helpful for my decision.",
      "is_approved": true,
      "like_count": 0,
      "created_at": "2024-01-15T16:45:00Z",
      "updated_at": "2024-01-15T16:45:00Z"
    }
  }
}
```

#### Update Comment
```
PUT /api/blog/comments/:id
```

Update a blog comment (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Comment UUID

**Request Body:**
```json
{
  "content": "Updated comment with additional thoughts..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "comment": {
      // Updated comment object
    }
  }
}
```

#### Delete Comment
```
DELETE /api/blog/comments/:id
```

Delete a blog comment (author or moderator only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Comment UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### Categories

#### Get All Categories
```
GET /api/blog/categories
```

Get all blog categories.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "reviews",
        "count": 15
      },
      {
        "name": "technology",
        "count": 8
      },
      {
        "name": "news",
        "count": 12
      }
    ]
  }
}
```

#### Get All Tags
```
GET /api/blog/tags
```

Get all blog tags with usage counts.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "Tesla",
        "count": 25
      },
      {
        "name": "Charging",
        "count": 18
      },
      {
        "name": "Review",
        "count": 15
      }
    ]
  }
}
```

---

### Search

#### Search Blog Posts
```
GET /api/blog/search
```

Search blog posts by title, content, and tags.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `author` (string, optional): Filter by author UUID

**Example:**
```
GET /api/blog/search?q=tesla&category=reviews&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        // Same structure as GET /posts
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### Get Posts by Author
```
GET /api/blog/author/:authorId
```

Get blog posts by a specific author.

**Parameters:**
- `authorId` (string): Author UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status (author only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        // Same structure as GET /posts
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

## Error Responses

### Post Not Found
```json
{
  "success": false,
  "error": "Blog post not found"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions. Moderator access required."
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "title": ["Title is required and must be 5-200 characters"],
    "content": ["Content must be at least 50 characters"]
  }
}
```

### Search Query Too Short
```json
{
  "success": false,
  "error": "Search query must be at least 2 characters long"
}
```

### Comment Not Approved
```json
{
  "success": false,
  "error": "Comment is pending approval"
}
```