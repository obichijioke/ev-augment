# Admin API

Administrative functions and dashboard for moderators and administrators.

## Base URL
```
/api/admin
```

## Authentication
All admin endpoints require authentication and appropriate role permissions:
- **Moderator**: Can access most admin functions
- **Admin**: Can access all admin functions including user management and system settings

## Endpoints

### Dashboard

#### Get Admin Dashboard
```
GET /api/admin/dashboard
```

Get administrative dashboard statistics and overview.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `timeframe` (string, optional): Time period - `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Example:**
```
GET /api/admin/dashboard?timeframe=7d
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "users": {
        "total": 1250,
        "new": 45,
        "active": 890
      },
      "content": {
        "vehicles": {
          "total": 650,
          "new": 25
        },
        "marketplace_listings": {
          "total": 180,
          "new": 12
        },
        "forum_posts": {
          "total": 2340,
          "new": 156
        }
      },
      "moderation": {
        "pending_listings": 8,
        "pending_directory": 3,
        "reported_content": 5
      },
      "revenue": {
        "total": 15750.50,
        "recent": 2340.25
      },
      "timeframe": "7d"
    }
  }
}
```

---

### User Management

#### Get All Users (Admin)
```
GET /api/admin/users
```

Get all users with administrative information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search by username, email, or full name
- `role` (string, optional): Filter by role - `user`, `moderator`, `admin`
- `status` (string, optional): Filter by status - `active`, `suspended`, `banned`
- `sort` (string, optional): Sort field - `created_at`, `last_login_at`, `username` (default: `created_at`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `desc`)

**Example:**
```
GET /api/admin/users?role=moderator&status=active&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "username": "johndoe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "role": "user",
        "forum_role": "user",
        "is_active": true,
        "is_verified": false,
        "email_verified": true,
        "last_login_at": "2024-01-15T10:30:00Z",
        "login_count": 45,
        "forum_post_count": 25,
        "forum_reputation": 150,
        "vehicles_count": 2,
        "reviews_count": 8,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1250,
      "totalPages": 125,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get User Details (Admin)
```
GET /api/admin/users/:id
```

Get detailed information about a specific user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): User UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "EV enthusiast",
      "location": "San Francisco, CA",
      "website": "https://johndoe.com",
      "phone": "+1234567890",
      "role": "user",
      "forum_role": "user",
      "is_active": true,
      "is_verified": false,
      "is_business": false,
      "email_verified": true,
      "last_login_at": "2024-01-15T10:30:00Z",
      "login_count": 45,
      "join_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "stats": {
      "vehicles_count": 2,
      "forum_posts_count": 25,
      "forum_replies_count": 68,
      "blog_comments_count": 12,
      "reviews_count": 8,
      "likes_given": 156,
      "likes_received": 89
    },
    "recent_activity": [
      {
        "type": "forum_post",
        "action": "created",
        "resource_id": "post-uuid",
        "resource_title": "Best charging practices",
        "created_at": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

#### Get User Statistics (Admin)
```
GET /api/admin/users/stats
```

Get overall user statistics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_users": 1250,
      "active_users": 890,
      "verified_users": 234,
      "business_users": 67,
      "new_users_today": 8,
      "new_users_week": 45,
      "new_users_month": 178,
      "role_distribution": {
        "user": 1200,
        "moderator": 15,
        "admin": 5
      },
      "login_stats": {
        "daily_active": 245,
        "weekly_active": 567,
        "monthly_active": 890
      }
    }
  }
}
```

#### Update User (Admin)
```
PUT /api/admin/users/:id
```

Update user information and permissions.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): User UUID

**Request Body:**
```json
{
  "role": "moderator",
  "forum_role": "moderator",
  "is_active": true,
  "is_verified": true,
  "moderator_notes": "Promoted to moderator due to excellent community contributions"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

#### Bulk User Operations (Admin)
```
POST /api/admin/users/bulk
```

Perform bulk operations on multiple users.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "action": "suspend",
  "user_ids": ["user1-uuid", "user2-uuid", "user3-uuid"],
  "reason": "Violation of community guidelines",
  "duration": 7
}
```

**Available Actions:**
- `activate` - Activate users
- `suspend` - Suspend users temporarily
- `ban` - Ban users permanently
- `verify` - Verify users
- `promote` - Promote to moderator
- `demote` - Demote from moderator

**Response (200):**
```json
{
  "success": true,
  "message": "Bulk operation completed successfully",
  "data": {
    "action": "suspend",
    "affected_users": 3,
    "results": [
      {
        "user_id": "user1-uuid",
        "success": true
      },
      {
        "user_id": "user2-uuid", 
        "success": true
      },
      {
        "user_id": "user3-uuid",
        "success": false,
        "error": "User not found"
      }
    ]
  }
}
```

#### Export Users (Admin)
```
GET /api/admin/users/export
```

Export user data in CSV format.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `format` (string, optional): Export format - `csv`, `json` (default: `csv`)
- `fields` (string, optional): Comma-separated list of fields to include
- `filter_role` (string, optional): Filter by role
- `filter_status` (string, optional): Filter by status

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="users-export-2024-01-15.csv"

id,username,email,full_name,role,is_active,created_at
uuid1,johndoe,john@example.com,John Doe,user,true,2024-01-01T00:00:00Z
uuid2,janedoe,jane@example.com,Jane Doe,moderator,true,2024-01-02T00:00:00Z
```

---

### Content Management

#### Get Content Overview
```
GET /api/admin/content
```

Get overview of all content on the platform.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "forum": {
        "total_threads": 1250,
        "total_replies": 8940,
        "pending_moderation": 5,
        "reported_content": 3
      },
      "blog": {
        "total_posts": 85,
        "draft_posts": 12,
        "published_posts": 73,
        "total_comments": 456
      },
      "marketplace": {
        "active_listings": 180,
        "pending_approval": 8,
        "sold_listings": 95
      },
      "vehicles": {
        "total_vehicles": 650,
        "public_vehicles": 520,
        "private_vehicles": 130
      }
    }
  }
}
```

---

### Forum Administration

#### Get Forum Statistics
```
GET /api/admin/forum
```

Get detailed forum statistics and moderation information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_categories": 8,
      "total_threads": 1250,
      "total_replies": 8940,
      "active_users": 456,
      "posts_today": 23,
      "posts_week": 156,
      "posts_month": 678
    },
    "moderation": {
      "pending_threads": 3,
      "pending_replies": 2,
      "reported_threads": 1,
      "reported_replies": 4,
      "locked_threads": 12,
      "pinned_threads": 5
    },
    "top_categories": [
      {
        "name": "General Discussion",
        "thread_count": 345,
        "post_count": 2890
      },
      {
        "name": "Tesla Owners",
        "thread_count": 234,
        "post_count": 1567
      }
    ]
  }
}
```

---

### Blog Administration

#### Get Blog Statistics
```
GET /api/admin/blog
```

Get blog statistics and management information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_posts": 85,
      "published_posts": 73,
      "draft_posts": 12,
      "archived_posts": 0,
      "total_comments": 456,
      "pending_comments": 8,
      "total_views": 125000,
      "total_likes": 3450
    },
    "recent_posts": [
      {
        "id": "post-uuid",
        "title": "2024 Tesla Model 3 Highland Review",
        "status": "published",
        "view_count": 1250,
        "like_count": 45,
        "comment_count": 23,
        "published_at": "2024-01-10T09:00:00Z"
      }
    ],
    "top_categories": [
      {
        "name": "reviews",
        "post_count": 25
      },
      {
        "name": "technology",
        "post_count": 18
      }
    ]
  }
}
```

---

### Reports Management

#### Get All Reports
```
GET /api/admin/reports
```

Get all user reports for content moderation.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status` (string, optional): Filter by status - `pending`, `reviewing`, `resolved`, `dismissed`
- `content_type` (string, optional): Filter by content type
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "reporter_id": "user1-uuid",
        "reported_user_id": "user2-uuid",
        "content_type": "forum_post",
        "content_id": "post-uuid",
        "reason": "spam",
        "description": "This post appears to be promotional spam",
        "status": "pending",
        "moderator_id": null,
        "moderator_notes": null,
        "resolved_at": null,
        "created_at": "2024-01-15T14:30:00Z",
        "updated_at": "2024-01-15T14:30:00Z",
        "reporter": {
          "username": "reporter1",
          "full_name": "Reporter One"
        },
        "reported_user": {
          "username": "spammer",
          "full_name": "Spam User"
        },
        "content_preview": "Buy cheap EV parts here..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Analytics (Admin Only)

#### Get Platform Analytics
```
GET /api/admin/analytics
```

Get comprehensive platform analytics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `timeframe` (string, optional): Time period - `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `metric` (string, optional): Specific metric to focus on

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "user_engagement": {
        "daily_active_users": 245,
        "weekly_active_users": 567,
        "monthly_active_users": 890,
        "average_session_duration": "25m 30s",
        "bounce_rate": 0.15
      },
      "content_metrics": {
        "posts_per_day": 23,
        "comments_per_day": 89,
        "likes_per_day": 156,
        "most_active_categories": [
          {
            "name": "General Discussion",
            "posts": 345
          }
        ]
      },
      "growth_metrics": {
        "user_growth_rate": 0.08,
        "content_growth_rate": 0.12,
        "retention_rate": 0.75
      },
      "timeframe": "30d"
    }
  }
}
```

---

### System Settings (Admin Only)

#### Get System Settings
```
GET /api/admin/settings
```

Get system configuration settings.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "settings": {
      "site": {
        "name": "EV Community Platform",
        "description": "The premier community for electric vehicle enthusiasts",
        "logo_url": "https://example.com/logo.png",
        "maintenance_mode": false
      },
      "features": {
        "user_registration": true,
        "email_verification": true,
        "forum_enabled": true,
        "marketplace_enabled": true,
        "blog_enabled": true
      },
      "moderation": {
        "auto_approve_posts": false,
        "auto_approve_comments": true,
        "require_approval_new_users": false
      },
      "limits": {
        "max_file_size": 10485760,
        "max_files_per_upload": 5,
        "rate_limit_requests": 100,
        "rate_limit_window": 900
      }
    }
  }
}
```

---

### Logs (Admin Only)

#### Get System Logs
```
GET /api/admin/logs
```

Get system logs and audit trail.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `level` (string, optional): Log level - `info`, `warn`, `error` (default: all)
- `action` (string, optional): Filter by action type
- `user_id` (string, optional): Filter by user
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "user_id": "user-uuid",
        "action": "user_login",
        "resource_type": "auth",
        "resource_id": null,
        "old_values": null,
        "new_values": {
          "login_method": "email",
          "ip_address": "192.168.1.1"
        },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-15T16:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Vehicle Listings Administration

#### Get Vehicle Listings Overview
```
GET /api/admin/vehicle-listings
```

Get overview of vehicle listings for administrative purposes.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_listings": 180,
      "active_listings": 165,
      "pending_approval": 8,
      "sold_listings": 95,
      "flagged_listings": 2
    },
    "recent_activity": [
      {
        "action": "listing_created",
        "listing_id": "listing-uuid",
        "user_id": "user-uuid",
        "created_at": "2024-01-15T16:00:00Z"
      }
    ]
  }
}
```

## Error Responses

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions. Admin access required."
}
```

### Moderator Access Required
```json
{
  "success": false,
  "error": "Insufficient permissions. Moderator access required."
}
```

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### Invalid Bulk Operation
```json
{
  "success": false,
  "error": "Invalid bulk operation or user IDs"
}
```

### Export Failed
```json
{
  "success": false,
  "error": "Failed to generate export file"
}
```

### Settings Update Failed
```json
{
  "success": false,
  "error": "Failed to update system settings"
}
```