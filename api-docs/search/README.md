# Search API

Global search functionality across all platform content.

## Base URL
```
/api/search
```

**Note:** The search routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Global Search
```
GET /api/search
```

Search across all content types on the platform.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `type` (string, optional): Content type filter - `all`, `users`, `vehicles`, `forum`, `blog`, `marketplace`, `wanted`, `charging` (default: `all`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sort` (string, optional): Sort order - `relevance`, `date`, `popularity` (default: `relevance`)
- `category` (string, optional): Filter by category (type-specific)
- `location` (string, optional): Filter by location
- `date_from` (string, optional): Filter content from this date (ISO format)
- `date_to` (string, optional): Filter content to this date (ISO format)

**Example:**
```
GET /api/search?q=tesla model 3&type=all&page=1&limit=10&sort=relevance
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "vehicle",
        "id": "vehicle-uuid",
        "title": "Tesla Model 3 Long Range",
        "description": "2023 Tesla Model 3 with autopilot and premium interior",
        "url": "/vehicles/vehicle-uuid",
        "relevance_score": 0.95,
        "highlight": "Tesla <mark>Model 3</mark> Long Range with autopilot",
        "metadata": {
          "owner": "johndoe",
          "year": 2023,
          "mileage": 15000,
          "location": "San Francisco, CA"
        },
        "created_at": "2023-06-20T10:00:00Z"
      },
      {
        "type": "forum_post",
        "id": "post-uuid",
        "title": "Tesla Model 3 charging tips",
        "description": "Best practices for charging your Tesla Model 3 for optimal battery health",
        "url": "/forum/general/tesla-model-3-charging-tips",
        "relevance_score": 0.88,
        "highlight": "<mark>Tesla Model 3</mark> charging tips and best practices",
        "metadata": {
          "author": "evexpert",
          "category": "General Discussion",
          "replies": 23,
          "likes": 45
        },
        "created_at": "2024-01-10T09:00:00Z"
      },
      {
        "type": "blog_post",
        "id": "blog-uuid",
        "title": "2024 Tesla Model 3 Highland Review",
        "description": "Comprehensive review of the updated Tesla Model 3 Highland",
        "url": "/blog/2024-tesla-model-3-highland-review",
        "relevance_score": 0.82,
        "highlight": "2024 <mark>Tesla Model 3</mark> Highland brings significant updates",
        "metadata": {
          "author": "evreviewer",
          "category": "reviews",
          "views": 1250,
          "likes": 45
        },
        "created_at": "2024-01-10T09:00:00Z"
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
    "facets": {
      "by_type": {
        "vehicles": 8,
        "forum_posts": 12,
        "blog_posts": 3,
        "marketplace": 2
      },
      "by_category": {
        "General Discussion": 8,
        "Tesla Owners": 6,
        "Reviews": 4
      }
    },
    "query_info": {
      "query": "tesla model 3",
      "processed_query": "tesla model 3",
      "search_time_ms": 45,
      "total_results": 25
    }
  }
}
```

---

### Get Search Suggestions
```
GET /api/search/suggestions
```

Get search suggestions and autocomplete results.

**Query Parameters:**
- `q` (string, required): Partial search query (minimum 1 character)
- `type` (string, optional): Content type filter (default: `all`)
- `limit` (number, optional): Number of suggestions (default: 10, max: 20)

**Example:**
```
GET /api/search/suggestions?q=tes&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "tesla model 3",
        "type": "query",
        "count": 45,
        "category": "vehicles"
      },
      {
        "text": "tesla charging",
        "type": "query", 
        "count": 32,
        "category": "forum"
      },
      {
        "text": "tesla supercharger",
        "type": "query",
        "count": 28,
        "category": "charging"
      },
      {
        "text": "Tesla",
        "type": "brand",
        "count": 156,
        "category": "vehicles"
      },
      {
        "text": "Tesla Model Y",
        "type": "model",
        "count": 23,
        "category": "vehicles"
      }
    ],
    "query": "tes"
  }
}
```

---

### Get Trending Searches
```
GET /api/search/trending
```

Get trending search queries.

**Query Parameters:**
- `timeframe` (string, optional): Time period - `24h`, `7d`, `30d` (default: `7d`)
- `limit` (number, optional): Number of results (default: 10, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trending": [
      {
        "query": "tesla model 3 2024",
        "search_count": 156,
        "trend_direction": "up",
        "change_percentage": 25.5
      },
      {
        "query": "rivian r1t review",
        "search_count": 89,
        "trend_direction": "up",
        "change_percentage": 45.2
      },
      {
        "query": "home charging installation",
        "search_count": 67,
        "trend_direction": "stable",
        "change_percentage": 2.1
      }
    ],
    "timeframe": "7d",
    "generated_at": "2024-01-15T20:30:00Z"
  }
}
```

---

### Get Search Filters
```
GET /api/search/filters
```

Get available search filters for different content types.

**Query Parameters:**
- `type` (string, optional): Content type - `vehicles`, `forum`, `blog`, `marketplace`, `charging`

**Example:**
```
GET /api/search/filters?type=vehicles
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "filters": {
      "vehicles": {
        "makes": ["Tesla", "Rivian", "Ford", "Chevrolet", "BMW"],
        "years": [2024, 2023, 2022, 2021, 2020],
        "body_types": ["Sedan", "SUV", "Truck", "Hatchback"],
        "price_ranges": [
          {"label": "Under $30k", "min": 0, "max": 30000},
          {"label": "$30k - $50k", "min": 30000, "max": 50000},
          {"label": "$50k - $80k", "min": 50000, "max": 80000},
          {"label": "Over $80k", "min": 80000, "max": null}
        ]
      },
      "forum": {
        "categories": [
          {"name": "General Discussion", "slug": "general-discussion"},
          {"name": "Tesla Owners", "slug": "tesla-owners"},
          {"name": "Charging", "slug": "charging"}
        ]
      },
      "blog": {
        "categories": ["reviews", "technology", "news", "guides"],
        "tags": ["Tesla", "Charging", "Review", "Technology", "Tips"]
      }
    }
  }
}
```

---

### Advanced Search
```
POST /api/search/advanced
```

Perform advanced search with complex filters.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "query": "tesla charging",
  "filters": {
    "content_types": ["forum_post", "blog_post"],
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-15"
    },
    "categories": ["general-discussion", "tesla-owners"],
    "authors": ["evexpert", "teslaowner"],
    "min_rating": 4,
    "has_images": true,
    "location": {
      "city": "San Francisco",
      "radius": 50
    }
  },
  "sort": {
    "field": "relevance",
    "order": "desc"
  },
  "page": 1,
  "limit": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        // Same structure as basic search results
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "applied_filters": {
      "content_types": ["forum_post", "blog_post"],
      "date_range": "2024-01-01 to 2024-01-15",
      "categories": 2,
      "authors": 2,
      "min_rating": 4
    }
  }
}
```

## Error Responses

### Search Query Too Short
```json
{
  "success": false,
  "error": "Search query must be at least 2 characters long"
}
```

### Invalid Content Type
```json
{
  "success": false,
  "error": "Invalid content type filter"
}
```

### Invalid Date Range
```json
{
  "success": false,
  "error": "Invalid date range. 'from' date must be before 'to' date"
}
```

### Search Service Error
```json
{
  "success": false,
  "error": "Search service temporarily unavailable"
}
```

### Too Many Results
```json
{
  "success": false,
  "error": "Search query too broad. Please refine your search terms."
}
```