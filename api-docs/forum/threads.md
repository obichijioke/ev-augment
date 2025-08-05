# Forum Threads API

Documentation for forum thread management endpoints.

## List Threads

### Endpoint
`GET /api/forum/threads`

### Description
Retrieve a paginated list of forum threads with optional filtering by category, search terms, and sorting options.

### Authentication
- Required: No
- Public endpoint accessible to all users

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | No | - | Filter by category slug |
| search | string | No | - | Search in thread titles and content |
| sort | string | No | 'latest' | Sort order: 'latest', 'oldest', 'popular', 'replies' |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of threads per page (max 100) |
| pinned | boolean | No | - | Filter pinned threads only |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
        "title": "Welcome to the Forum",
        "slug": "welcome-to-the-forum",
        "content": "This is the first thread...",
        "is_pinned": true,
        "is_locked": false,
        "view_count": 150,
        "reply_count": 12,
        "created_at": "2025-08-05T12:00:00.000Z",
        "updated_at": "2025-08-05T12:30:00.000Z",
        "last_reply_at": "2025-08-05T12:30:00.000Z",
        "category": {
          "id": "49699859-e21b-4237-b86b-14baf8476264",
          "name": "General Discussion",
          "slug": "general",
          "icon": "💬",
          "color": "#3B82F6"
        },
        "author": {
          "id": "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
          "username": "admin",
          "displayName": "Administrator",
          "avatar": "https://example.com/avatar.jpg"
        },
        "last_reply_username": "user123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Threads retrieved successfully"
}
```

### Example Request
```bash
curl -X GET "http://localhost:4001/api/forum/threads?category=general&sort=latest&limit=10"
```

---

## Get Single Thread

### Endpoint
`GET /api/forum/threads/:id`

### Description
Retrieve a single thread with all its replies, images, and author information. Increments view count.

### Authentication
- Required: No
- Public endpoint accessible to all users

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Thread UUID |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
    "title": "Thread with Replies",
    "slug": "thread-with-replies",
    "content": "This is the thread content...",
    "is_pinned": false,
    "is_locked": false,
    "view_count": 151,
    "reply_count": 3,
    "created_at": "2025-08-05T12:00:00.000Z",
    "updated_at": "2025-08-05T12:00:00.000Z",
    "last_reply_at": "2025-08-05T12:30:00.000Z",
    "category": {
      "id": "49699859-e21b-4237-b86b-14baf8476264",
      "name": "General Discussion",
      "slug": "general",
      "icon": "💬",
      "color": "#3B82F6"
    },
    "author": {
      "id": "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
      "username": "user123",
      "displayName": "User Name",
      "avatar": "https://example.com/avatar.jpg"
    },
    "images": [
      {
        "id": "c13798c4-4072-4212-b7f5-483f397892d0",
        "url": "https://storage.example.com/image.jpg",
        "filename": "image.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "alt": "Thread image"
      }
    ],
    "replies": [
      {
        "id": "1a4be3f9-b26e-49d3-8b73-6eb3912707c2",
        "content": "This is a reply...",
        "nesting_level": 0,
        "created_at": "2025-08-05T12:15:00.000Z",
        "author": {
          "id": "author-uuid",
          "username": "replier",
          "displayName": "Reply Author",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "images": [],
        "replies": [
          {
            "id": "nested-reply-uuid",
            "content": "Nested reply...",
            "nesting_level": 1,
            "created_at": "2025-08-05T12:20:00.000Z",
            "author": {
              "id": "author2-uuid",
              "username": "user456",
              "displayName": "Another User",
              "avatar": null
            },
            "images": [],
            "replies": []
          }
        ]
      }
    ]
  },
  "message": "Thread retrieved successfully"
}
```

#### Error Response
**Status Code:** 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Thread not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Request
```bash
curl -X GET "http://localhost:4001/api/forum/threads/717a60f6-ff37-4915-953b-8e4b4859f4a6"
```

---

## Create Thread

### Endpoint
`POST /api/forum/threads`

### Description
Create a new forum thread in a specified category.

### Authentication
- Required: Yes
- Type: Bearer Token

### Request Body
```json
{
  "title": "New Thread Title",
  "content": "Thread content goes here...",
  "category_id": "49699859-e21b-4237-b86b-14baf8476264",
  "is_pinned": false,
  "images": []
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Thread title (3-200 characters) |
| content | string | Yes | Thread content (10-50000 characters) |
| category_id | string | Yes | Valid category UUID |
| is_pinned | boolean | No | Pin thread (admin only) |
| images | array | No | Array of image file objects |

### Response

#### Success Response
**Status Code:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "new-thread-uuid",
    "title": "New Thread Title",
    "slug": "new-thread-title",
    "content": "Thread content goes here...",
    "is_pinned": false,
    "is_locked": false,
    "view_count": 0,
    "reply_count": 0,
    "created_at": "2025-08-05T12:00:00.000Z",
    "updated_at": "2025-08-05T12:00:00.000Z",
    "category_id": "49699859-e21b-4237-b86b-14baf8476264",
    "author_id": "5dfb8a98-cb4d-4f03-bc84-4bebd95badae"
  },
  "message": "Thread created successfully"
}
```

### Example Request
```bash
curl -X POST "http://localhost:4001/api/forum/threads" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Thread",
    "content": "This is my thread content...",
    "category_id": "49699859-e21b-4237-b86b-14baf8476264"
  }'
```

---

## Update Thread

### Endpoint
`PUT /api/forum/threads/:id`

### Description
Update an existing thread. Only the author or admin can update a thread.

### Authentication
- Required: Yes
- Permissions: Thread author or admin

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Thread UUID |

### Request Body
```json
{
  "title": "Updated Thread Title",
  "content": "Updated thread content...",
  "is_pinned": false,
  "is_locked": false
}
```

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "thread-uuid",
    "title": "Updated Thread Title",
    "content": "Updated thread content...",
    "updated_at": "2025-08-05T12:30:00.000Z"
  },
  "message": "Thread updated successfully"
}
```

---

## Delete Thread

### Endpoint
`DELETE /api/forum/threads/:id`

### Description
Delete a thread and all its replies. Only the author or admin can delete a thread.

### Authentication
- Required: Yes
- Permissions: Thread author or admin

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Thread UUID |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "message": "Thread deleted successfully"
}
```

### Example Request
```bash
curl -X DELETE "http://localhost:4001/api/forum/threads/thread-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
