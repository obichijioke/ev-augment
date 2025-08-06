# Forum Categories API

Documentation for forum category management endpoints.

## List Categories

### Endpoint
`GET /api/forum/categories`

### Description
Retrieve all active forum categories with thread counts and basic statistics.

### Authentication
- Required: No
- Public endpoint accessible to all users

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| include_inactive | boolean | No | false | Include inactive categories (admin only) |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "49699859-e21b-4237-b86b-14baf8476264",
      "name": "General Discussion",
      "slug": "general",
      "description": "General topics and discussions",
      "icon": "💬",
      "color": "#3B82F6",
      "thread_count": 25,
      "is_active": true,
      "created_at": "2025-08-05T12:00:00.000Z",
      "updated_at": "2025-08-05T12:00:00.000Z"
    },
    {
      "id": "category-2-uuid",
      "name": "Technical Support",
      "slug": "support",
      "description": "Get help with technical issues",
      "icon": "🔧",
      "color": "#10B981",
      "thread_count": 12,
      "is_active": true,
      "created_at": "2025-08-05T12:00:00.000Z",
      "updated_at": "2025-08-05T12:00:00.000Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

### Example Request
```bash
curl -X GET "http://localhost:4001/api/forum/categories"
```

---

## Create Category

### Endpoint
`POST /api/forum/categories`

### Description
Create a new forum category. Admin access required.

### Authentication
- Required: Yes
- Permissions: Admin only

### Request Body
```json
{
  "name": "New Category",
  "description": "Description of the new category",
  "icon": "📝",
  "color": "#8B5CF6",
  "is_active": true
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Category name (3-50 characters) |
| description | string | No | Category description (max 500 characters) |
| icon | string | No | Emoji icon for the category |
| color | string | No | Hex color code (default: #3B82F6) |
| is_active | boolean | No | Whether category is active (default: true) |

### Response

#### Success Response
**Status Code:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "new-category-uuid",
    "name": "New Category",
    "slug": "new-category",
    "description": "Description of the new category",
    "icon": "📝",
    "color": "#8B5CF6",
    "thread_count": 0,
    "is_active": true,
    "created_at": "2025-08-05T12:00:00.000Z",
    "updated_at": "2025-08-05T12:00:00.000Z"
  },
  "message": "Category created successfully"
}
```

#### Error Responses

**Status Code:** 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Admin access required",
    "code": "AUTHORIZATION_FAILED",
    "statusCode": 403
  }
}
```

**Status Code:** 400 Bad Request - Duplicate Name
```json
{
  "success": false,
  "error": {
    "message": "Category name already exists",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

### Example Request
```bash
curl -X POST "http://localhost:4001/api/forum/categories" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Feature Requests",
    "description": "Suggest new features for the platform",
    "icon": "💡",
    "color": "#F59E0B"
  }'
```

---

## Update Category

### Endpoint
`PUT /api/forum/categories/:id`

### Description
Update an existing forum category. Admin access required.

### Authentication
- Required: Yes
- Permissions: Admin only

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

### Request Body
```json
{
  "name": "Updated Category Name",
  "description": "Updated description",
  "icon": "🔄",
  "color": "#EF4444",
  "is_active": true
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | Updated category name |
| description | string | No | Updated description |
| icon | string | No | Updated emoji icon |
| color | string | No | Updated hex color code |
| is_active | boolean | No | Updated active status |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "category-uuid",
    "name": "Updated Category Name",
    "slug": "updated-category-name",
    "description": "Updated description",
    "icon": "🔄",
    "color": "#EF4444",
    "thread_count": 15,
    "is_active": true,
    "updated_at": "2025-08-05T12:30:00.000Z"
  },
  "message": "Category updated successfully"
}
```

#### Error Responses

**Status Code:** 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Category not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Request
```bash
curl -X PUT "http://localhost:4001/api/forum/categories/category-uuid" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category",
    "description": "This category has been updated"
  }'
```

---

## Delete Category

### Endpoint
`DELETE /api/forum/categories/:id`

### Description
Delete a forum category. Admin access required. Categories with existing threads cannot be deleted unless force parameter is used.

### Authentication
- Required: Yes
- Permissions: Admin only

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Category UUID |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| force | boolean | No | Force delete even if category has threads |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

#### Error Responses

**Status Code:** 400 Bad Request - Has Threads
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete category with existing threads. Use force=true to override.",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

**Status Code:** 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Category not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Requests

#### Normal Delete
```bash
curl -X DELETE "http://localhost:4001/api/forum/categories/category-uuid" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Force Delete
```bash
curl -X DELETE "http://localhost:4001/api/forum/categories/category-uuid?force=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Category Slug Generation

Category slugs are automatically generated from the category name:
- Converted to lowercase
- Spaces replaced with hyphens
- Special characters removed
- Must be unique across all categories

### Examples
- "General Discussion" → "general-discussion"
- "Technical Support" → "technical-support"
- "Feature Requests & Ideas" → "feature-requests-ideas"

---

## Category Colors

Supported color formats:
- **Hex codes**: #3B82F6, #10B981, #F59E0B
- **Predefined colors**: Available in the frontend color palette
- **Default**: #3B82F6 (blue) if not specified

### Recommended Colors
- Blue: #3B82F6 (General topics)
- Green: #10B981 (Support/Help)
- Yellow: #F59E0B (Announcements)
- Purple: #8B5CF6 (Features)
- Red: #EF4444 (Issues/Bugs)

---

**Last Updated:** 2025-08-05
