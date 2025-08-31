# Response Formats

Standard response formats and HTTP status codes for the EV Community Platform API.

## Standard Response Structure

### Success Response
```typescript
interface ApiResponse<T = any> {
  success: boolean;              // Always true for success
  message?: string;              // Success message
  data?: T;                      // Response data
}
```

**Example:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "johndoe"
    }
  }
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: boolean;              // Always false for errors
  error: string;                 // Error message
  code?: string;                 // Error code
  details?: any;                 // Additional error details
}
```

**Example:**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

### Validation Error Response
```typescript
interface ValidationErrorResponse {
  success: boolean;              // Always false
  error: string;                 // General error message
  errors: Record<string, string[]>; // Field-specific errors
}
```

**Example:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Email is required", "Email format is invalid"],
    "password": ["Password must be at least 8 characters long"]
  }
}
```

### Paginated Response
```typescript
interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;                // Current page number
    limit: number;               // Items per page
    total: number;               // Total items count
    totalPages: number;          // Total pages count
    hasNext: boolean;            // Has next page
    hasPrev: boolean;            // Has previous page
  };
}
```

**Example:**
```json
{
  "success": true,
  "data": [
    {"id": "1", "name": "Item 1"},
    {"id": "2", "name": "Item 2"}
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## HTTP Status Codes

### Success Codes (2xx)

#### 200 OK
Used for successful GET, PUT, DELETE operations.
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { /* resource data */ }
}
```

#### 201 Created
Used for successful POST operations that create new resources.
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": { /* created resource */ }
}
```

#### 204 No Content
Used for successful operations with no response body (rare).

### Client Error Codes (4xx)

#### 400 Bad Request
Invalid request format, missing required fields, or validation errors.
```json
{
  "success": false,
  "error": "Invalid request format",
  "details": {
    "received": "invalid-json",
    "expected": "valid-json"
  }
}
```

#### 401 Unauthorized
Missing, invalid, or expired authentication token.
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden
Valid authentication but insufficient permissions.
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

#### 404 Not Found
Resource does not exist.
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

#### 409 Conflict
Resource already exists or conflict with current state.
```json
{
  "success": false,
  "error": "Username already exists",
  "code": "CONFLICT"
}
```

#### 422 Unprocessable Entity
Request format is correct but validation failed.
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Email format is invalid"],
    "password": ["Password too weak"]
  }
}
```

#### 429 Too Many Requests
Rate limit exceeded.
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 15 minutes.",
  "retry_after": 900
}
```

### Server Error Codes (5xx)

#### 500 Internal Server Error
Unexpected server error.
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

#### 502 Bad Gateway
Upstream service error.
```json
{
  "success": false,
  "error": "Service temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE"
}
```

#### 503 Service Unavailable
Service maintenance or overload.
```json
{
  "success": false,
  "error": "Service temporarily unavailable",
  "message": "The service is under maintenance. Please try again later."
}
```

## Rate Limiting Headers

All API responses include rate limiting information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
X-RateLimit-Window: 900
```

### Rate Limit Response
When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "retry_after": 900,
  "limit": 100,
  "window": 900
}
```

## Content-Type Headers

### Request Headers
- `Content-Type: application/json` - For JSON requests
- `Content-Type: multipart/form-data` - For file uploads
- `Authorization: Bearer <token>` - For authenticated requests

### Response Headers
- `Content-Type: application/json` - Standard API responses
- `Content-Type: text/csv` - CSV export responses
- `Content-Disposition: attachment; filename="export.csv"` - File downloads

## Pagination Metadata

### Pagination Object
```typescript
interface PaginationMeta {
  page: number;                  // Current page (1-based)
  limit: number;                 // Items per page
  total: number;                 // Total items available
  totalPages: number;            // Total pages available
  hasNext: boolean;              // Has next page
  hasPrev: boolean;              // Has previous page
}
```

### Pagination Calculations
- `totalPages = Math.ceil(total / limit)`
- `hasNext = page < totalPages`
- `hasPrev = page > 1`

## Special Response Types

### Health Check Response
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-15T22:00:00Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### API Documentation Response
```json
{
  "success": true,
  "message": "EV Community Platform API",
  "version": "1.0.0",
  "documentation": {
    "auth": "/api/auth - Authentication endpoints",
    "users": "/api/users - User management",
    "vehicles": "/api/vehicles - Vehicle management"
  },
  "endpoints": {
    "health": "/health - Health check",
    "docs": "/api - This documentation"
  }
}
```

### Empty Result Response
When a query returns no results:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```