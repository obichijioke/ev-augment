# Messages API

Direct messaging system for user-to-user communication.

## Base URL
```
/api/messages
```

**Note:** The messages routes are currently commented out in the main app but the functionality exists. This documentation covers the available endpoints when enabled.

## Endpoints

### Get Conversations
```
GET /api/messages/conversations
```

Get all conversations for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `unread_only` (boolean, optional): Show only unread conversations (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "user_id": "other-user-uuid",
        "username": "evdealer",
        "full_name": "EV Dealer",
        "avatar_url": "https://example.com/dealer-avatar.jpg",
        "is_verified": true,
        "last_message": {
          "id": "message-uuid",
          "content": "The Tesla Model 3 is still available. Would you like to schedule a viewing?",
          "sender_id": "other-user-uuid",
          "created_at": "2024-01-15T16:30:00Z",
          "is_read": false
        },
        "unread_count": 2,
        "total_messages": 8,
        "last_activity": "2024-01-15T16:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "stats": {
      "total_conversations": 5,
      "unread_conversations": 2,
      "total_unread_messages": 4
    }
  }
}
```

---

### Get Conversation with User
```
GET /api/messages/conversation/:userId
```

Get message history with a specific user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `userId` (string): Other user's UUID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `before` (string, optional): Get messages before this timestamp

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "participant": {
        "id": "other-user-uuid",
        "username": "evdealer",
        "full_name": "EV Dealer",
        "avatar_url": "https://example.com/dealer-avatar.jpg",
        "is_verified": true,
        "is_online": false,
        "last_seen": "2024-01-15T16:30:00Z"
      },
      "messages": [
        {
          "id": "message1-uuid",
          "sender_id": "user-uuid",
          "receiver_id": "other-user-uuid",
          "content": "Hi, I'm interested in your Tesla Model 3 listing. Is it still available?",
          "message_type": "text",
          "is_read": true,
          "read_at": "2024-01-15T15:05:00Z",
          "created_at": "2024-01-15T15:00:00Z",
          "updated_at": "2024-01-15T15:00:00Z"
        },
        {
          "id": "message2-uuid",
          "sender_id": "other-user-uuid",
          "receiver_id": "user-uuid",
          "content": "Yes, it's still available! Would you like to schedule a viewing?",
          "message_type": "text",
          "is_read": false,
          "read_at": null,
          "created_at": "2024-01-15T16:30:00Z",
          "updated_at": "2024-01-15T16:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 50,
        "total": 8,
        "totalPages": 1,
        "hasNext": false,
        "hasPrev": false
      }
    }
  }
}
```

---

### Send Message
```
POST /api/messages
```

Send a message to another user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "receiver_id": "other-user-uuid",
  "content": "Thanks for the quick response! I'd love to schedule a viewing this weekend if possible.",
  "message_type": "text",
  "context": {
    "related_listing_id": "listing-uuid",
    "related_type": "marketplace_inquiry"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "new-message-uuid",
      "sender_id": "user-uuid",
      "receiver_id": "other-user-uuid",
      "content": "Thanks for the quick response! I'd love to schedule a viewing this weekend if possible.",
      "message_type": "text",
      "context": {
        "related_listing_id": "listing-uuid",
        "related_type": "marketplace_inquiry"
      },
      "is_read": false,
      "read_at": null,
      "created_at": "2024-01-15T20:00:00Z",
      "updated_at": "2024-01-15T20:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `receiver_id`: Required valid UUID
- `content`: Required string, 1-2000 characters
- `message_type`: Optional enum - `text`, `image`, `file` (default: `text`)

---

### Get Message by ID
```
GET /api/messages/:id
```

Get a specific message by ID.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Message UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message-uuid",
      "sender_id": "user-uuid",
      "receiver_id": "other-user-uuid",
      "content": "Thanks for the quick response!",
      "message_type": "text",
      "context": {
        "related_listing_id": "listing-uuid",
        "related_type": "marketplace_inquiry"
      },
      "is_read": true,
      "read_at": "2024-01-15T20:05:00Z",
      "created_at": "2024-01-15T20:00:00Z",
      "updated_at": "2024-01-15T20:00:00Z",
      "sender": {
        "username": "buyer123",
        "full_name": "Buyer Name",
        "avatar_url": "https://example.com/buyer-avatar.jpg"
      },
      "receiver": {
        "username": "seller456",
        "full_name": "Seller Name",
        "avatar_url": "https://example.com/seller-avatar.jpg"
      }
    }
  }
}
```

---

### Mark Message as Read
```
PUT /api/messages/:id/read
```

Mark a specific message as read.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Message UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "message": {
      "id": "message-uuid",
      "is_read": true,
      "read_at": "2024-01-15T20:30:00Z"
    }
  }
}
```

---

### Mark Conversation as Read
```
PUT /api/messages/conversation/:userId/read
```

Mark all messages in a conversation as read.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `userId` (string): Other user's UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation marked as read",
  "data": {
    "messages_updated": 3,
    "conversation": {
      "unread_count": 0
    }
  }
}
```

---

### Delete Message
```
DELETE /api/messages/:id
```

Delete a message (sender only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `id` (string): Message UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### Get Unread Count
```
GET /api/messages/unread/count
```

Get total unread message count for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unread_count": 4,
    "unread_conversations": 2
  }
}
```

---

### Search Messages
```
GET /api/messages/search
```

Search messages by content.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)
- `user_id` (string, optional): Search within conversation with specific user
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "sender_id": "user-uuid",
        "receiver_id": "other-user-uuid",
        "content": "Thanks for the quick response about the Tesla!",
        "created_at": "2024-01-15T20:00:00Z",
        "conversation_partner": {
          "username": "evdealer",
          "full_name": "EV Dealer",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Bulk Mark as Read
```
POST /api/messages/bulk-read
```

Mark multiple messages as read.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "message_ids": ["message1-uuid", "message2-uuid", "message3-uuid"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "messages_updated": 3
  }
}
```

---

### Delete Conversation
```
DELETE /api/messages/conversation/:userId
```

Delete entire conversation with a user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Parameters:**
- `userId` (string): Other user's UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "data": {
    "messages_deleted": 8
  }
}
```

## Error Responses

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### Message Not Found
```json
{
  "success": false,
  "error": "Message not found"
}
```

### Cannot Message Self
```json
{
  "success": false,
  "error": "Cannot send message to yourself"
}
```

### User Blocked
```json
{
  "success": false,
  "error": "Cannot send message. User has blocked you or you have blocked this user."
}
```

### Message Too Long
```json
{
  "success": false,
  "error": "Message content exceeds maximum length of 2000 characters"
}
```

### Access Denied
```json
{
  "success": false,
  "error": "Access denied. You can only read your own messages."
}
```