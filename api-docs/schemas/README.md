# API Schemas and Data Types

This section contains shared data schemas, types, and validation rules used across all API endpoints.

## 📋 Common Response Format

All API endpoints follow a consistent response structure:

### Success Response
```json
{
  "success": true,
  "data": {}, // Endpoint-specific data
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {} // Optional additional error details
  },
  "timestamp": "2025-08-05T12:00:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## 🔐 Authentication

### Bearer Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user|admin",
  "iat": 1641024000,
  "exp": 1641110400
}
```

## 📊 Pagination

### Request Parameters
```json
{
  "page": 1,
  "limit": 20,
  "sort": "created_at",
  "order": "desc"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🏷️ Data Types

### User
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "full_name": "string|null",
  "avatar_url": "string|null",
  "role": "user|admin",
  "is_verified": "boolean",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### ForumCategory
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string|null",
  "icon": "string|null",
  "color": "string",
  "thread_count": "number",
  "is_active": "boolean",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### ForumThread
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "content": "string",
  "is_pinned": "boolean",
  "is_locked": "boolean",
  "view_count": "number",
  "reply_count": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "last_reply_at": "ISO8601|null",
  "category_id": "uuid",
  "author_id": "uuid",
  "author": "User",
  "category": "ForumCategory",
  "images": "ForumImage[]",
  "replies": "ForumReply[]"
}
```

### ForumReply
```json
{
  "id": "uuid",
  "thread_id": "uuid",
  "author_id": "uuid",
  "parent_id": "uuid|null",
  "content": "string",
  "nesting_level": "number",
  "is_deleted": "boolean",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "author": "User",
  "images": "ForumImage[]",
  "replies": "ForumReply[]"
}
```

### ForumImage
```json
{
  "id": "uuid",
  "thread_id": "uuid|null",
  "reply_id": "uuid|null",
  "author_id": "uuid",
  "filename": "string",
  "original_filename": "string",
  "file_size": "number",
  "mime_type": "string",
  "storage_path": "string",
  "public_url": "string",
  "alt_text": "string|null",
  "width": "number|null",
  "height": "number|null",
  "created_at": "ISO8601"
}
```

## ⚠️ Error Codes

### Authentication Errors
- `AUTHENTICATION_REQUIRED` - User not authenticated
- `INVALID_TOKEN` - Token is invalid or expired
- `TOKEN_EXPIRED` - Token has expired

### Authorization Errors
- `AUTHORIZATION_FAILED` - User lacks required permissions
- `ADMIN_REQUIRED` - Admin access required
- `OWNER_REQUIRED` - Resource owner access required

### Validation Errors
- `VALIDATION_ERROR` - Input validation failed
- `REQUIRED_FIELD_MISSING` - Required field not provided
- `INVALID_FORMAT` - Field format is invalid
- `VALUE_TOO_LONG` - Field value exceeds maximum length
- `VALUE_TOO_SHORT` - Field value below minimum length

### Resource Errors
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RESOURCE_ALREADY_EXISTS` - Resource with same identifier exists
- `RESOURCE_LOCKED` - Resource is locked for modifications

### File Upload Errors
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file format
- `UPLOAD_FAILED` - File upload process failed

### Forum-Specific Errors
- `THREAD_LOCKED` - Cannot modify locked thread
- `MAX_NESTING_EXCEEDED` - Reply nesting limit reached
- `CATEGORY_INACTIVE` - Category is not active

## 📏 Validation Rules

### String Lengths
```json
{
  "username": "3-30 characters",
  "email": "5-255 characters",
  "thread_title": "3-200 characters",
  "thread_content": "10-50000 characters",
  "reply_content": "1-10000 characters",
  "category_name": "3-50 characters",
  "category_description": "0-500 characters"
}
```

### File Limits
```json
{
  "image_max_size": "10MB",
  "image_formats": ["JPEG", "PNG", "GIF", "WebP"],
  "max_images_per_thread": 10,
  "max_images_per_reply": 5
}
```

### Rate Limits
```json
{
  "thread_creation": "5 per hour",
  "reply_creation": "30 per hour",
  "image_upload": "20 per hour",
  "api_requests": "1000 per hour"
}
```

## 🔄 Status Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned

### Client Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Upstream server error
- `503 Service Unavailable` - Service temporarily unavailable

## 📅 Date Formats

All dates use ISO 8601 format:
```
2025-08-05T12:00:00.000Z
```

### Timezone
- All dates stored in UTC
- Client-side conversion for display
- Consistent across all endpoints

---

**Last Updated:** 2025-08-05
