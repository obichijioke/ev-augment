# API Documentation

This folder contains comprehensive documentation for all API routes in the EV Next.js application. The documentation is organized by feature and includes detailed information about endpoints, request/response formats, authentication requirements, and examples.

## 📁 Folder Structure

```
api-docs/
├── README.md                 # This file - overview and guidelines
├── authentication/           # Auth-related endpoints
├── forum/                   # Forum system endpoints
├── users/                   # User management endpoints
├── vehicles/                # Vehicle-related endpoints
├── images/                  # Image upload/management endpoints
└── schemas/                 # Shared data schemas and types
```

## 📋 Documentation Standards

Each API endpoint documentation should include:

### Required Sections
- **Endpoint URL** and HTTP method
- **Description** of what the endpoint does
- **Authentication** requirements
- **Request Parameters** (path, query, body)
- **Response Format** with status codes
- **Example Request/Response**
- **Error Handling** with error codes

### Optional Sections
- **Rate Limiting** information
- **Permissions** required
- **Related Endpoints**
- **Notes** and special considerations

## 🔧 Documentation Format

Use Markdown format with the following structure:

```markdown
# Endpoint Name

## Overview
Brief description of what this endpoint does.

## Endpoint
`METHOD /api/path/to/endpoint`

## Authentication
- Required: Yes/No
- Type: Bearer Token / API Key / etc.

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of items to return |

### Request Body
```json
{
  "field": "value"
}
```

## Response

### Success Response
**Status Code:** 200 OK
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Error Response
**Status Code:** 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Examples

### Request
```bash
curl -X GET "http://localhost:4001/api/endpoint" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "data": "response data"
}
```
```

## 🚀 Getting Started

1. **Create endpoint documentation** in the appropriate folder
2. **Follow the standard format** outlined above
3. **Include real examples** from the actual API
4. **Keep documentation up-to-date** with code changes

## 📝 Contributing

When adding new API endpoints:
1. Create documentation before or immediately after implementation
2. Include comprehensive examples
3. Test all examples to ensure accuracy
4. Update related documentation if needed

## 🔗 Related

This documentation will be used to generate:
- Interactive API documentation app
- Postman collections
- SDK generation
- Developer guides

---

**Last Updated:** 2025-08-05
**Version:** 1.0.0
