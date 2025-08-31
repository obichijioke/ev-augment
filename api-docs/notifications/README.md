# Notifications API

User notification system for real-time updates and alerts.

## Base URL
```
/api/notifications
```

**Note:** The notifications routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get User Notifications
```
GET /api/notifications
```

Get all notifications for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `type` (string, optional): Filter by notification type
- `priority` (string, optional): Filter by priority - `low`, `normal`, `high`, `urgent`
- `is_read` (boolean, optional): Filter by read status
- `sort` (string, optional): Sort order - `asc`, `desc` (default: `desc`)

**Example:**
```
GET /api/notifications?is_read=false&priority=high&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "user_id": "user-uuid",
        "type": "forum_reply",
        "title": "New reply to your post",
        "message": "evexpert replied to your post 'Best charging practices for long battery life'",
        "data": {
          "thread_id": "thread-uuid",
          "reply_id": "reply-uuid",
          "author": "evexpert",
          "thread_title": "Best charging practices for long battery life"
        },
        "priority": "normal",
        "is_read": false,
        "read_at": null,
        "expires_at": "2024-02-15T20:00:00Z",
        "created_at": "2024-01-15T20:00:00Z"
      },
      {
        "id": "notification2-uuid",
        "user_id": "user-uuid",
        "type": "marketplace_message",
        "title": "New message about your listing",
        "message": "You have a new message about your Tesla floor mats listing",
        "data": {
          "listing_id": "listing-uuid",
          "message_id": "message-uuid",
          "sender": "buyer123",
          "listing_title": "Tesla Model 3 All-Weather Floor Mats"
        },
        "priority": "normal",
        "is_read": false,
        "read_at": null,
        "expires_at": null,
        "created_at": "2024-01-15T19:45:00Z"
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
      "total_notifications": 25,
      "unread_count": 8,
      "by_priority": {
        "urgent": 1,
        "high": 3,
        "normal": 18,
        "low": 3
      }
    }
  }
}
```

---

### Mark Notification as Read
```
PUT /api/notifications/:id/read
```

Mark a specific notification as read.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Notification UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "id": "notification-uuid",
      "is_read": true,
      "read_at": "2024-01-15T21:00:00Z"
    }
  }
}
```

---

### Mark All as Read
```
PUT /api/notifications/read-all
```

Mark all notifications as read for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "notifications_updated": 8
  }
}
```

---

### Delete Notification
```
DELETE /api/notifications/:id
```

Delete a specific notification.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Notification UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### Get Notification Preferences
```
GET /api/notifications/preferences
```

Get current user's notification preferences.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "id": "preferences-uuid",
      "user_id": "user-uuid",
      "email_notifications": true,
      "push_notifications": true,
      "sms_notifications": false,
      "email_frequency": "immediate",
      "notification_types": {
        "forum_replies": true,
        "forum_likes": true,
        "blog_comments": true,
        "marketplace_messages": true,
        "vehicle_updates": false,
        "system_announcements": true,
        "marketing": false
      },
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "08:00",
      "timezone": "America/Los_Angeles",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

### Update Notification Preferences
```
PUT /api/notifications/preferences
```

Update notification preferences for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "sms_notifications": false,
  "email_frequency": "daily",
  "notification_types": {
    "forum_replies": true,
    "forum_likes": false,
    "blog_comments": true,
    "marketplace_messages": true,
    "vehicle_updates": false,
    "system_announcements": true,
    "marketing": false
  },
  "quiet_hours_start": "23:00",
  "quiet_hours_end": "07:00",
  "timezone": "America/New_York"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "preferences": {
      // Updated preferences object
    }
  }
}
```

---

### Get Unread Count
```
GET /api/notifications/unread/count
```

Get count of unread notifications for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unread_count": 8,
    "by_priority": {
      "urgent": 1,
      "high": 2,
      "normal": 4,
      "low": 1
    },
    "by_type": {
      "forum_reply": 3,
      "marketplace_message": 2,
      "blog_comment": 1,
      "system_announcement": 1,
      "like": 1
    }
  }
}
```

---

### Bulk Operations
```
POST /api/notifications/bulk
```

Perform bulk operations on notifications.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "action": "mark_read",
  "notification_ids": ["notif1-uuid", "notif2-uuid", "notif3-uuid"]
}
```

**Available Actions:**
- `mark_read` - Mark notifications as read
- `mark_unread` - Mark notifications as unread
- `delete` - Delete notifications

**Response (200):**
```json
{
  "success": true,
  "message": "Bulk operation completed successfully",
  "data": {
    "action": "mark_read",
    "affected_count": 3,
    "results": [
      {
        "notification_id": "notif1-uuid",
        "success": true
      },
      {
        "notification_id": "notif2-uuid",
        "success": true
      },
      {
        "notification_id": "notif3-uuid",
        "success": false,
        "error": "Notification not found"
      }
    ]
  }
}
```

---

### Test Notification
```
POST /api/notifications/test
```

Send a test notification to verify delivery settings.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "delivery_method": "email",
  "message": "This is a test notification to verify your settings"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "delivery_method": "email",
    "sent_at": "2024-01-15T21:30:00Z",
    "delivery_id": "delivery-uuid"
    }
}
```

## Notification Types

### Available Notification Types
- `forum_reply` - New reply to user's forum post
- `forum_like` - Like on user's forum content
- `blog_comment` - New comment on user's blog post
- `blog_like` - Like on user's blog content
- `marketplace_message` - Message about marketplace listing
- `vehicle_update` - Updates related to user's vehicles
- `follow` - New follower
- `system_announcement` - Important system updates
- `security_alert` - Security-related notifications
- `marketing` - Promotional content (opt-in)

### Priority Levels
- `urgent` - Critical security or system issues
- `high` - Important updates requiring attention
- `normal` - Regular notifications and updates
- `low` - Non-critical informational updates

## Error Responses

### Notification Not Found
```json
{
  "success": false,
  "error": "Notification not found"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only access your own notifications."
}
```

### Invalid Notification Type
```json
{
  "success": false,
  "error": "Invalid notification type"
}
```

### Preferences Update Failed
```json
{
  "success": false,
  "error": "Failed to update notification preferences"
}
```

### Test Notification Failed
```json
{
  "success": false,
  "error": "Failed to send test notification. Please check your delivery settings."
}
```