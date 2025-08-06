# Forum Images API

Documentation for forum image upload and management endpoints.

## Upload Image

### Endpoint
`POST /api/forum/images/upload`

### Description
Upload an image file to be associated with a forum thread or reply. Images are stored in Supabase storage and can be used in forum content.

### Authentication
- Required: Yes
- Type: Bearer Token

### Request Format
- **Content-Type**: `multipart/form-data`
- **File Field**: `image`
- **Additional Fields**: Form data parameters

### Form Data Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | file | Yes | Image file (JPEG, PNG, GIF, WebP) |
| thread_id | string | Conditional | Thread UUID (required if no reply_id) |
| reply_id | string | Conditional | Reply UUID (required if no thread_id) |
| alt_text | string | No | Alternative text for accessibility |

### File Restrictions
- **Maximum size**: 10MB
- **Allowed formats**: JPEG, PNG, GIF, WebP
- **Dimensions**: No specific limits (auto-resized if needed)

### Response

#### Success Response
**Status Code:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "ff6f3318-0667-45a2-91c9-449a6091aeb7",
    "thread_id": "717a60f6-ff37-4915-953b-8e4b4859f4a6",
    "reply_id": null,
    "author_id": "5dfb8a98-cb4d-4f03-bc84-4bebd95badae",
    "filename": "46ae2f3f-481d-4c33-bcb1-adfce1e4a68b.jpeg",
    "original_filename": "my-image.jpeg",
    "file_size": 112623,
    "mime_type": "image/jpeg",
    "storage_path": "forum-images/46ae2f3f-481d-4c33-bcb1-adfce1e4a68b.jpeg",
    "public_url": "https://rszqdjbjswwfparbzfyi.supabase.co/storage/v1/object/public/forum-images/46ae2f3f-481d-4c33-bcb1-adfce1e4a68b.jpeg",
    "alt_text": "Screenshot of the login page",
    "width": 1920,
    "height": 1080,
    "created_at": "2025-08-05T12:00:00.000Z"
  },
  "message": "Image uploaded successfully"
}
```

#### Error Responses

**Status Code:** 400 Bad Request - Invalid Parameters
```json
{
  "success": false,
  "error": {
    "message": "Cannot provide both thread_id and reply_id",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

**Status Code:** 400 Bad Request - Missing Parameters
```json
{
  "success": false,
  "error": {
    "message": "Must provide either thread_id or reply_id",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

**Status Code:** 400 Bad Request - File Too Large
```json
{
  "success": false,
  "error": {
    "message": "File size exceeds 10MB limit",
    "code": "FILE_TOO_LARGE",
    "statusCode": 400
  }
}
```

**Status Code:** 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "error": {
    "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
    "code": "INVALID_FILE_TYPE",
    "statusCode": 400
  }
}
```

**Status Code:** 404 Not Found - Thread/Reply Not Found
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

#### Upload Thread Image
```bash
curl -X POST "http://localhost:4001/api/forum/images/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "thread_id=717a60f6-ff37-4915-953b-8e4b4859f4a6" \
  -F "alt_text=Screenshot of the feature"
```

#### Upload Reply Image
```bash
curl -X POST "http://localhost:4001/api/forum/images/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.png" \
  -F "reply_id=1a4be3f9-b26e-49d3-8b73-6eb3912707c2" \
  -F "alt_text=Error message screenshot"
```

#### JavaScript/Fetch Example
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('thread_id', 'thread-uuid');
formData.append('alt_text', 'Image description');

const response = await fetch('/api/forum/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

---

## Delete Image

### Endpoint
`DELETE /api/forum/images/:id`

### Description
Delete an uploaded forum image. Only the image author or admin can delete an image.

### Authentication
- Required: Yes
- Permissions: Image author or admin

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Image UUID |

### Response

#### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

#### Error Responses

**Status Code:** 403 Forbidden - Not Author
```json
{
  "success": false,
  "error": {
    "message": "You can only delete your own images",
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
    "message": "Image not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Example Request
```bash
curl -X DELETE "http://localhost:4001/api/forum/images/ff6f3318-0667-45a2-91c9-449a6091aeb7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Image Storage Details

### Storage Location
- **Provider**: Supabase Storage
- **Bucket**: `forum-images`
- **Path Structure**: `forum-images/{generated-filename}`
- **Access**: Public read access

### File Processing
1. **Upload**: File is uploaded to temporary location
2. **Validation**: File type, size, and format validation
3. **Processing**: Generate unique filename, extract metadata
4. **Storage**: Move to permanent location in Supabase
5. **Database**: Save metadata to `forum_images` table
6. **Response**: Return image details with public URL

### Filename Generation
- **Format**: `{uuid}.{extension}`
- **Example**: `46ae2f3f-481d-4c33-bcb1-adfce1e4a68b.jpeg`
- **Original filename**: Preserved in `original_filename` field

### Public URL Format
```
https://rszqdjbjswwfparbzfyi.supabase.co/storage/v1/object/public/forum-images/{filename}
```

---

## Image Association Rules

### Thread Images
- **Association**: Linked via `thread_id`
- **Usage**: Displayed in thread content area
- **Permissions**: Thread author can upload
- **Deletion**: Deleted when thread is deleted

### Reply Images
- **Association**: Linked via `reply_id`
- **Usage**: Displayed in reply content area
- **Permissions**: Reply author can upload
- **Deletion**: Deleted when reply is deleted

### Validation Rules
1. **Exclusive association**: Image must belong to either thread OR reply, not both
2. **Author validation**: Only thread/reply author can upload images
3. **Existence validation**: Thread/reply must exist before image upload
4. **Permission validation**: User must have permission to modify the thread/reply

---

## Supported Image Formats

### JPEG
- **Extensions**: `.jpg`, `.jpeg`
- **MIME Type**: `image/jpeg`
- **Compression**: Lossy compression, good for photos

### PNG
- **Extensions**: `.png`
- **MIME Type**: `image/png`
- **Features**: Transparency support, lossless compression

### GIF
- **Extensions**: `.gif`
- **MIME Type**: `image/gif`
- **Features**: Animation support, limited colors

### WebP
- **Extensions**: `.webp`
- **MIME Type**: `image/webp`
- **Features**: Modern format, excellent compression

---

## Image Metadata

Images store the following metadata:
- **Dimensions**: Width and height in pixels
- **File size**: Size in bytes
- **MIME type**: Original file format
- **Creation date**: Upload timestamp
- **Author**: User who uploaded the image
- **Alt text**: Accessibility description
- **Association**: Thread or reply linkage

---

**Last Updated:** 2025-08-05
