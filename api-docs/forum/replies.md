# Forum Replies API

Documentation for forum reply management endpoints.

## Create Reply

### Endpoint
`POST /api/forum/replies`

### Description
Create a new reply to a forum thread or another reply. Supports 2-level nesting maximum (root replies and one level of nested replies).

### Authentication
- Required: Yes
- Type: Bearer Token

### Request Body
```json
{
  "thread_id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
  "parent_id": null,
  "content": "This is my reply content...",
  "images": []
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| thread_id | string | Yes | UUID of the thread being replied to |
| parent_id | string | No | UUID of parent reply (null for root replies) |
| content | string | Yes | Reply content (1-10000 characters) |
| images | array | No | Array of image file objects |

### Response

#### Success Response
**Status Code:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "1a4be3f9-b26e-49d3-8b73-6eb3912707c2",
    "thread_id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
    "author_id": "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
    "parent_id": null,
    "content": "This is my reply content...",
    "nesting_level": 0,
    "is_deleted": false,
    "created_at": "2025-08-05T12:15:00.000Z",
    "updated_at": "2025-08-05T12:15:00.000Z"
  },
  "message": "Reply created successfully"
}
```

#### Error Responses

**Status Code:** 400 Bad Request - Thread Locked
```json
{
  "success": false,
  "error": {
    "message": "Cannot reply to locked thread",
    "code": "THREAD_LOCKED",
    "statusCode": 400
  }
}
```

**Status Code:** 400 Bad Request - Max Nesting Exceeded
```json
{
  "success": false,
  "error": {
    "message": "Maximum nesting level exceeded. Only 2 levels allowed.",
    "code": "MAX_NESTING_EXCEEDED",
    "statusCode": 400
  }
}
```

**Status Code:** 404 Not Found - Thread Not Found
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

### Example Requests

#### Create Root Reply
```bash
curl -X POST "http://localhost:4001/api/forum/replies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
    "content": "This is a root reply to the thread."
  }'
```

#### Create Nested Reply
```bash
curl -X POST "http://localhost:4001/api/forum/replies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
    "parent_id": "1a4be3f9-b26e-49d3-8b73-6eb3912707c2",
    "content": "This is a nested reply to another reply."
  }'
```

---

## Update Reply

### Endpoint
`PUT /api/forum/replies/:id`

### Description
Update an existing reply. Only the author or admin can update a reply.

### Authentication
- Required: Yes
- Permissions: Reply author or admin

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Reply UUID |

### Request Body
```json
{
  "content": "Updated reply content..."
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | Yes | Updated reply content (1-10000 characters) |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "1a4be3f9-b26e-49d3-8b73-6eb3912707c2",
    "content": "Updated reply content...",
    "updated_at": "2025-08-05T12:30:00.000Z",
    "is_edited": true
  },
  "message": "Reply updated successfully"
}
```

#### Error Responses

**Status Code:** 403 Forbidden - Not Author
```json
{
  "success": false,
  "error": {
    "message": "You can only edit your own replies",
    "code": "AUTHORIZATION_FAILED",
    "statusCode": 403
  }
}
```

**Status Code:** 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Reply not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Request
```bash
curl -X PUT "http://localhost:4001/api/forum/replies/1a4be3f9-b26e-49d3-8b73-6eb3912707c2" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is my updated reply content."
  }'
```

---

## Delete Reply

### Endpoint
`DELETE /api/forum/replies/:id`

### Description
Delete a reply. Only the author or admin can delete a reply. Deleting a reply with nested replies will also delete all nested replies.

### Authentication
- Required: Yes
- Permissions: Reply author or admin

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Reply UUID |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "message": "Reply deleted successfully"
}
```

#### Error Responses

**Status Code:** 403 Forbidden - Not Author
```json
{
  "success": false,
  "error": {
    "message": "You can only delete your own replies",
    "code": "AUTHORIZATION_FAILED",
    "statusCode": 403
  }
}
```

**Status Code:** 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Reply not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Request
```bash
curl -X DELETE "http://localhost:4001/api/forum/replies/1a4be3f9-b26e-49d3-8b73-6eb3912707c2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Reply Nesting Rules

### Nesting Levels
- **Level 0**: Root replies (direct replies to the thread)
- **Level 1**: Nested replies (replies to other replies)
- **Maximum**: 2 levels total (0 and 1)

### Nesting Restrictions
1. **Root replies** can have nested replies
2. **Nested replies** cannot have further nested replies
3. **Maximum depth** is enforced at the API level
4. **Frontend** should disable reply buttons on level 1 replies

### Visual Representation
```
Thread
├── Root Reply (Level 0)
│   ├── Nested Reply (Level 1) ← Maximum depth
│   └── Nested Reply (Level 1) ← Maximum depth
├── Root Reply (Level 0)
│   └── Nested Reply (Level 1) ← Maximum depth
└── Root Reply (Level 0)
```

---

## Reply Images

Replies can include images that are uploaded separately and associated with the reply:

1. **Create reply** first (without images)
2. **Upload images** using the [Forum Images API](./images.md) with the reply ID
3. **Images are automatically** included when fetching the thread

### Image Association
- Images are linked to replies via `reply_id`
- Multiple images per reply are supported
- Images are displayed in the reply content area
- Images support full gallery functionality (zoom, navigation, download)

---

**Last Updated:** 2025-08-05
