# Validation Rules

Comprehensive validation rules for all API endpoints.

## Common Validations

### Pagination
- `page`: Integer, minimum 1, default 1
- `limit`: Integer, minimum 1, maximum 100, default 20
- `sort`: String, enum ["asc", "desc"], default "desc"

### Search
- `q`: String, minimum 2 characters for search queries
- `search`: String, minimum 1 character for filters

### UUID Validation
- All ID fields must be valid UUID v4 format
- Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`

### Email Validation
- Must be valid email format
- Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Maximum 255 characters

### URL Validation
- Must be valid HTTP/HTTPS URL
- Pattern: `^https?:\/\/.+`

## Authentication Validations

### Password Requirements
- Minimum 8 characters
- Must contain at least one letter and one number
- Special characters allowed but not required
- Maximum 128 characters

### Username Requirements
- 3-30 characters
- Alphanumeric characters and underscores only
- Pattern: `^[a-zA-Z0-9_]{3,30}$`
- Must be unique across platform

### Registration
```typescript
const registerSchema = {
  email: {
    required: true,
    type: "email",
    maxLength: 255
  },
  password: {
    required: true,
    type: "string",
    minLength: 8,
    maxLength: 128,
    pattern: "^(?=.*[a-zA-Z])(?=.*\\d).+$"
  },
  username: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 30,
    pattern: "^[a-zA-Z0-9_]+$"
  },
  full_name: {
    required: false,
    type: "string",
    maxLength: 100
  },
  terms_accepted: {
    required: true,
    type: "boolean",
    enum: [true]
  }
}
```

## Vehicle Validations

### Create/Update Vehicle
```typescript
const vehicleSchema = {
  make: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50
  },
  model: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50
  },
  year: {
    required: true,
    type: "integer",
    minimum: 1900,
    maximum: 2030
  },
  trim: {
    required: false,
    type: "string",
    maxLength: 100
  },
  color: {
    required: false,
    type: "string",
    maxLength: 50
  },
  vin: {
    required: false,
    type: "string",
    maxLength: 17,
    pattern: "^[A-HJ-NPR-Z0-9]{17}$"
  },
  current_mileage: {
    required: false,
    type: "integer",
    minimum: 0
  },
  purchase_price: {
    required: false,
    type: "number",
    minimum: 0
  },
  battery_capacity: {
    required: false,
    type: "number",
    minimum: 0
  },
  estimated_range: {
    required: false,
    type: "integer",
    minimum: 0
  }
}
```

## Forum Validations

### Thread Creation
```typescript
const threadSchema = {
  title: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 200
  },
  content: {
    required: true,
    type: "string",
    minLength: 10,
    maxLength: 50000
  },
  category_id: {
    required: true,
    type: "string",
    format: "uuid"
  }
}
```

### Reply Creation
```typescript
const replySchema = {
  thread_id: {
    required: true,
    type: "string",
    format: "uuid"
  },
  content: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 10000
  },
  parent_id: {
    required: false,
    type: "string",
    format: "uuid"
  }
}
```

### Category Management
```typescript
const categorySchema = {
  name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 100
  },
  description: {
    required: false,
    type: "string",
    maxLength: 500
  },
  slug: {
    required: true,
    type: "string",
    pattern: "^[a-z0-9-]+$",
    maxLength: 100
  },
  icon: {
    required: false,
    type: "string",
    maxLength: 10
  },
  color: {
    required: false,
    type: "string",
    pattern: "^#[0-9A-Fa-f]{6}$"
  }
}
```

## Blog Validations

### Blog Post Creation
```typescript
const blogPostSchema = {
  title: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 200
  },
  content: {
    required: true,
    type: "string",
    minLength: 50
  },
  excerpt: {
    required: false,
    type: "string",
    maxLength: 500
  },
  category: {
    required: false,
    type: "string",
    maxLength: 50
  },
  tags: {
    required: false,
    type: "array",
    items: {
      type: "string",
      maxLength: 50
    },
    maxItems: 20
  },
  featured_image: {
    required: false,
    type: "string",
    format: "url"
  },
  status: {
    required: false,
    type: "string",
    enum: ["draft", "published", "archived"],
    default: "draft"
  }
}
```

### Blog Comment Creation
```typescript
const commentSchema = {
  content: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 2000
  },
  parent_id: {
    required: false,
    type: "string",
    format: "uuid"
  }
}
```

## Review Validations

### Review Creation
```typescript
const reviewSchema = {
  entity_type: {
    required: true,
    type: "string",
    enum: ["vehicle", "business", "charging_station", "ev_listing"]
  },
  entity_id: {
    required: true,
    type: "string",
    format: "uuid"
  },
  rating: {
    required: true,
    type: "integer",
    minimum: 1,
    maximum: 5
  },
  title: {
    required: false,
    type: "string",
    maxLength: 200
  },
  content: {
    required: false,
    type: "string",
    maxLength: 2000
  },
  pros: {
    required: false,
    type: "array",
    items: {
      type: "string",
      maxLength: 200
    },
    maxItems: 10
  },
  cons: {
    required: false,
    type: "array",
    items: {
      type: "string",
      maxLength: 200
    },
    maxItems: 10
  },
  reviewer_name: {
    required: true, // For guest reviews
    type: "string",
    minLength: 2,
    maxLength: 100
  },
  reviewer_email: {
    required: true, // For guest reviews
    type: "string",
    format: "email"
  }
}
```

## File Upload Validations

### File Constraints
```typescript
const uploadConstraints = {
  maxFileSize: 10485760,         // 10MB in bytes
  maxFilesPerRequest: 5,
  allowedImageTypes: [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/webp",
    "image/gif"
  ],
  allowedDocumentTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  allowedVideoTypes: [
    "video/mp4",
    "video/webm",
    "video/ogg"
  ]
}
```

### Upload Schema
```typescript
const uploadSchema = {
  upload_type: {
    required: true,
    type: "string",
    enum: ["image", "document", "video"]
  },
  entity_type: {
    required: false,
    type: "string",
    enum: ["vehicle", "forum_post", "forum_reply", "blog_post", "marketplace_listing"]
  },
  entity_id: {
    required: false,
    type: "string",
    format: "uuid"
  },
  alt_text: {
    required: false,
    type: "string",
    maxLength: 200
  },
  description: {
    required: false,
    type: "string",
    maxLength: 500
  }
}
```

## EV Listing Validations

### EV Listing Schema
```typescript
const evListingSchema = {
  make: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50
  },
  model: {
    required: true,
    type: "string", 
    minLength: 1,
    maxLength: 50
  },
  year: {
    required: true,
    type: "integer",
    minimum: 2010,
    maximum: 2026 // Current year + 2
  },
  battery_capacity: {
    required: false,
    type: "number",
    minimum: 0
  },
  range_epa: {
    required: false,
    type: "integer",
    minimum: 0
  },
  starting_price: {
    required: false,
    type: "number",
    minimum: 0
  },
  availability_status: {
    required: false,
    type: "string",
    enum: ["available", "coming_soon", "discontinued"],
    default: "available"
  },
  images: {
    required: false,
    type: "array",
    items: {
      type: "string",
      format: "url"
    },
    maxItems: 10
  },
  features: {
    required: false,
    type: "array",
    items: {
      type: "string",
      maxLength: 100
    }
  }
}
```

## Marketplace Validations

### Marketplace Listing Schema
```typescript
const marketplaceSchema = {
  title: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 200
  },
  description: {
    required: false,
    type: "string",
    maxLength: 2000
  },
  category: {
    required: true,
    type: "string",
    maxLength: 50
  },
  price: {
    required: false,
    type: "number",
    minimum: 0
  },
  condition: {
    required: false,
    type: "string",
    enum: ["new", "like_new", "good", "fair", "poor"]
  },
  location: {
    required: false,
    type: "string",
    maxLength: 100
  },
  is_negotiable: {
    required: false,
    type: "boolean",
    default: false
  }
}
```

## Error Response Format

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "field_name": [
      "Field is required",
      "Field must be at least 3 characters long"
    ],
    "another_field": [
      "Invalid format"
    ]
  }
}
```

### Field-Specific Error Messages

#### String Validations
- Required: `"Field is required"`
- Min length: `"Field must be at least {min} characters long"`
- Max length: `"Field must be no more than {max} characters long"`
- Pattern: `"Field format is invalid"`

#### Number Validations
- Required: `"Field is required"`
- Minimum: `"Field must be at least {min}"`
- Maximum: `"Field must be no more than {max}"`
- Type: `"Field must be a valid number"`

#### Array Validations
- Max items: `"Field can contain at most {max} items"`
- Item validation: `"Item at index {index} is invalid: {message}"`

#### Date Validations
- Format: `"Field must be a valid ISO date string"`
- Range: `"Date must be between {min} and {max}"`