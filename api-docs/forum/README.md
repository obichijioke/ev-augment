# Forum API Documentation

This section documents all forum-related API endpoints including threads, replies, categories, and images.

## 📋 Available Endpoints

### Categories
- [GET /api/forum/categories](./categories.md) - List all forum categories
- [POST /api/forum/categories](./categories.md) - Create new category (Admin)
- [PUT /api/forum/categories/:id](./categories.md) - Update category (Admin)
- [DELETE /api/forum/categories/:id](./categories.md) - Delete category (Admin)

### Threads
- [GET /api/forum/threads](./threads.md) - List threads with filtering
- [GET /api/forum/threads/:id](./threads.md) - Get single thread with replies
- [POST /api/forum/threads](./threads.md) - Create new thread
- [PUT /api/forum/threads/:id](./threads.md) - Update thread
- [DELETE /api/forum/threads/:id](./threads.md) - Delete thread

### Replies
- [POST /api/forum/replies](./replies.md) - Create new reply
- [PUT /api/forum/replies/:id](./replies.md) - Update reply
- [DELETE /api/forum/replies/:id](./replies.md) - Delete reply

### Images
- [POST /api/forum/images/upload](./images.md) - Upload forum image
- [DELETE /api/forum/images/:id](./images.md) - Delete forum image

## 🔐 Authentication

Most forum endpoints require authentication:
- **Public**: Category listing, thread listing, thread viewing
- **Authenticated**: Thread creation, reply creation, image upload
- **Author/Admin**: Thread/reply editing and deletion
- **Admin Only**: Category management

## 📊 Common Response Format

All forum API endpoints follow this response structure:

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
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  },
  "timestamp": "2025-08-05T12:00:00.000Z",
  "path": "/api/forum/endpoint",
  "method": "GET"
}
```

## 🏷️ Common Data Types

### ForumCategory
```json
{
  "id": "uuid",
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Category description",
  "icon": "💬",
  "color": "#3B82F6",
  "thread_count": 10,
  "is_active": true,
  "created_at": "2025-08-05T12:00:00.000Z",
  "updated_at": "2025-08-05T12:00:00.000Z"
}
```

### ForumThread
```json
{
  "id": "uuid",
  "title": "Thread Title",
  "slug": "thread-slug",
  "content": "Thread content",
  "is_pinned": false,
  "is_locked": false,
  "view_count": 100,
  "reply_count": 5,
  "created_at": "2025-08-05T12:00:00.000Z",
  "updated_at": "2025-08-05T12:00:00.000Z",
  "last_reply_at": "2025-08-05T12:30:00.000Z",
  "category_id": "uuid",
  "author_id": "uuid",
  "author": {
    "id": "uuid",
    "username": "user123",
    "displayName": "User Name",
    "avatar": "avatar_url"
  },
  "category": {
    "id": "uuid",
    "name": "Category Name",
    "slug": "category-slug",
    "icon": "💬",
    "color": "#3B82F6"
  },
  "images": [],
  "replies": []
}
```

### ForumReply
```json
{
  "id": "uuid",
  "thread_id": "uuid",
  "author_id": "uuid",
  "parent_id": "uuid", // null for root replies
  "content": "Reply content",
  "nesting_level": 0, // 0 or 1 (max 2 levels)
  "is_deleted": false,
  "created_at": "2025-08-05T12:00:00.000Z",
  "updated_at": "2025-08-05T12:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "user123",
    "displayName": "User Name",
    "avatar": "avatar_url"
  },
  "images": [],
  "replies": [] // Nested replies (max 1 level)
}
```

### ForumImage
```json
{
  "id": "uuid",
  "thread_id": "uuid", // null for reply images
  "reply_id": "uuid", // null for thread images
  "author_id": "uuid",
  "filename": "generated_filename.jpg",
  "original_filename": "user_uploaded_name.jpg",
  "file_size": 1024000,
  "mime_type": "image/jpeg",
  "storage_path": "forum-images/filename.jpg",
  "alt_text": "Image description",
  "width": 1920,
  "height": 1080,
  "created_at": "2025-08-05T12:00:00.000Z"
}
```

## 🚨 Error Codes

Common error codes used across forum endpoints:

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_REQUIRED` - User not authenticated
- `AUTHORIZATION_FAILED` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `THREAD_LOCKED` - Cannot modify locked thread
- `MAX_NESTING_EXCEEDED` - Reply nesting limit reached
- `FILE_TOO_LARGE` - Uploaded file exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file format

---

**Last Updated:** 2025-08-05
