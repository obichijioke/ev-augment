# Upload API

File upload management system supporting images, documents, and videos.

## Base URL
```
/api/upload
```

## File Constraints

### Supported File Types
- **Images**: JPEG, JPG, PNG, WebP, GIF
- **Documents**: PDF, DOC, DOCX
- **Videos**: MP4, WebM, OGG

### Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 5 files

## Endpoints

### Upload Single File
```
POST /api/upload/single
```

Upload a single file.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file): The file to upload
- `upload_type` (string): Type of upload - `image`, `document`, `video` (default: `image`)
- `entity_type` (string, optional): Associated entity type - `vehicle`, `forum_post`, `blog_post`, etc.
- `entity_id` (string, optional): Associated entity UUID
- `alt_text` (string, optional): Alternative text for accessibility
- `description` (string, optional): File description

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": "file-uuid",
      "filename": "charging-station-photo.jpg",
      "original_name": "my-charging-photo.jpg",
      "url": "https://storage.example.com/uploads/image/user-uuid/1642234567890-abc123def.jpg",
      "file_path": "image/user-uuid/1642234567890-abc123def.jpg",
      "file_size": 2048000,
      "mime_type": "image/jpeg",
      "upload_type": "image",
      "entity_type": "forum_post",
      "entity_id": "post-uuid",
      "alt_text": "Home charging station installation",
      "description": "My Level 2 home charging setup",
      "uploaded_by": "user-uuid",
      "is_active": true,
      "created_at": "2024-01-15T17:00:00Z",
      "updated_at": "2024-01-15T17:00:00Z"
    }
  }
}
```

---

### Upload Multiple Files
```
POST /api/upload/multiple
```

Upload multiple files at once.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files` (file[]): Array of files to upload (max 5 files)
- `upload_type` (string): Type of upload - `image`, `document`, `video`
- `entity_type` (string, optional): Associated entity type
- `entity_id` (string, optional): Associated entity UUID

**Response (201):**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "files": [
      {
        "id": "file1-uuid",
        "filename": "image1.jpg",
        "url": "https://storage.example.com/uploads/image1.jpg",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "created_at": "2024-01-15T17:00:00Z"
      },
      {
        "id": "file2-uuid",
        "filename": "image2.jpg",
        "url": "https://storage.example.com/uploads/image2.jpg",
        "file_size": 1536000,
        "mime_type": "image/jpeg",
        "created_at": "2024-01-15T17:00:00Z"
      }
    ],
    "upload_summary": {
      "total_files": 2,
      "successful_uploads": 2,
      "failed_uploads": 0,
      "total_size": 2560000
    }
  }
}
```

---

### Get User Files
```
GET /api/upload/files
```

Get all files uploaded by the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `upload_type` (string, optional): Filter by upload type
- `entity_type` (string, optional): Filter by entity type
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)
- `sortBy` (string, optional): Sort field - `created_at`, `file_size`, `filename` (default: `created_at`)

**Example:**
```
GET /api/upload/files?upload_type=image&page=1&limit=10&sortBy=created_at&sort=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file-uuid",
        "filename": "charging-station-photo.jpg",
        "original_name": "my-charging-photo.jpg",
        "url": "https://storage.example.com/uploads/image/user-uuid/1642234567890-abc123def.jpg",
        "file_path": "image/user-uuid/1642234567890-abc123def.jpg",
        "file_size": 2048000,
        "mime_type": "image/jpeg",
        "upload_type": "image",
        "entity_type": "forum_post",
        "entity_id": "post-uuid",
        "alt_text": "Home charging station installation",
        "description": "My Level 2 home charging setup",
        "uploaded_by": "user-uuid",
        "is_active": true,
        "created_at": "2024-01-15T17:00:00Z",
        "updated_at": "2024-01-15T17:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "total_files": 25,
      "total_size": 52428800,
      "by_type": {
        "image": 20,
        "document": 3,
        "video": 2
      }
    }
  }
}
```

---

### Get File by ID
```
GET /api/upload/files/:id
```

Get detailed information about a specific file.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): File UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file-uuid",
      "filename": "charging-station-photo.jpg",
      "original_name": "my-charging-photo.jpg",
      "url": "https://storage.example.com/uploads/image/user-uuid/1642234567890-abc123def.jpg",
      "file_path": "image/user-uuid/1642234567890-abc123def.jpg",
      "file_size": 2048000,
      "mime_type": "image/jpeg",
      "upload_type": "image",
      "entity_type": "forum_post",
      "entity_id": "post-uuid",
      "alt_text": "Home charging station installation",
      "description": "My Level 2 home charging setup",
      "uploaded_by": "user-uuid",
      "is_active": true,
      "download_count": 5,
      "created_at": "2024-01-15T17:00:00Z",
      "updated_at": "2024-01-15T17:00:00Z"
    }
  }
}
```

---

### Update File Metadata
```
PUT /api/upload/files/:id
```

Update file metadata (uploader only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): File UUID

**Request Body:**
```json
{
  "alt_text": "Updated alternative text",
  "description": "Updated description with more details",
  "entity_type": "vehicle",
  "entity_id": "vehicle-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "File metadata updated successfully",
  "data": {
    "file": {
      // Updated file object
    }
  }
}
```

---

### Delete File
```
DELETE /api/upload/files/:id
```

Delete a file (uploader only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): File UUID

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### Upload Avatar
```
POST /api/upload/avatar
```

Upload user avatar image.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar` (file): Avatar image file (JPEG, PNG, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": {
      "id": "avatar-uuid",
      "url": "https://storage.example.com/avatars/user-uuid/avatar.jpg",
      "filename": "avatar.jpg",
      "file_size": 512000,
      "mime_type": "image/jpeg",
      "uploaded_by": "user-uuid",
      "created_at": "2024-01-15T17:30:00Z"
    },
    "user": {
      "avatar_url": "https://storage.example.com/avatars/user-uuid/avatar.jpg"
    }
  }
}
```

---

### Delete Avatar
```
DELETE /api/upload/avatar
```

Delete current user's avatar.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully",
  "data": {
    "user": {
      "avatar_url": null
    }
  }
}
```

## Error Responses

### No File Provided
```json
{
  "success": false,
  "error": "No file provided"
}
```

### Invalid File Type
```json
{
  "success": false,
  "error": "Invalid file type. Allowed types for image: image/jpeg, image/png, image/webp, image/gif"
}
```

### File Too Large
```json
{
  "success": false,
  "error": "File size exceeds maximum limit of 10MB"
}
```

### Too Many Files
```json
{
  "success": false,
  "error": "Maximum 5 files allowed per upload"
}
```

### Storage Error
```json
{
  "success": false,
  "error": "Failed to upload file to storage"
}
```

### File Not Found
```json
{
  "success": false,
  "error": "File not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only manage your own files."
}
```

### Entity Validation Error
```json
{
  "success": false,
  "error": "Invalid entity association. You don't have permission to upload files for this entity."
}
```