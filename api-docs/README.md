# EV Community Platform API Documentation

Welcome to the EV Community Platform API documentation. This API powers a comprehensive electric vehicle community platform with features including user management, vehicle listings, forums, blog, marketplace, and more.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": ["Validation error messages"]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
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

## Rate Limiting
- General API endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Development mode: 1000 requests per 15 minutes

## Available Endpoints

### Core Features
- [**Authentication**](./auth/README.md) - User registration, login, password management
- [**Users**](./users/README.md) - User profiles, search, following system
- [**Vehicles**](./vehicles/README.md) - Personal vehicle management
- [**EV Listings**](./ev-listings/README.md) - Electric vehicle database and specifications

### Content & Community
- [**Forum**](./forum/README.md) - Discussion threads, categories, replies, moderation
- [**Blog**](./blog/README.md) - Blog posts, comments, categories
- [**Reviews**](./reviews/README.md) - User reviews and ratings system
- [**Likes**](./likes/README.md) - Content likes and reactions

### Marketplace & Services
- [**Marketplace**](./marketplace/README.md) - Buy/sell listings *(currently disabled)*
- [**Wanted Ads**](./wanted/README.md) - Wanted item advertisements *(currently disabled)*
- [**Charging Stations**](./charging/README.md) - Charging station directory *(currently disabled)*
- [**Directory**](./directory/README.md) - Business directory *(currently disabled)*

### Utility Services
- [**Upload**](./upload/README.md) - File upload management
- [**Search**](./search/README.md) - Global search functionality *(currently disabled)*
- [**Notifications**](./notifications/README.md) - User notifications *(currently disabled)*
- [**Messages**](./messages/README.md) - Direct messaging system *(currently disabled)*

### Administration
- [**Admin**](./admin/README.md) - Administrative functions and dashboard

### Data Models & Schemas
- [**Data Models**](./schemas/data-models.md) - TypeScript interfaces for all data models
- [**Validation Rules**](./schemas/validation-rules.md) - Comprehensive validation schemas
- [**Response Formats**](./schemas/response-formats.md) - Standard response formats and status codes

## Quick Start

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "username": "johndoe",
    "full_name": "John Doe",
    "terms_accepted": true
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### 4. Get User Profile
```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists or conflict |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Support

For questions or issues with the API, please refer to the specific endpoint documentation or contact the development team.