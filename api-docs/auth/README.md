# Authentication API

Authentication endpoints for user registration, login, password management, and profile verification.

## Base URL
```
/api/auth
```

## Endpoints

### Register User
```
POST /api/auth/register
```

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "full_name": "John Doe",
  "terms_accepted": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "email_confirmed": false
    }
  }
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `username`: 3-30 characters, alphanumeric + underscore, required
- `full_name`: Optional string
- `terms_accepted`: Must be true

---

### Login User
```
POST /api/auth/login
```

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": null,
      "role": "user",
      "email_confirmed": true
    },
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

---

### Logout User
```
POST /api/auth/logout
```

Logout the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Refresh Token
```
POST /api/auth/refresh
```

Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new-jwt-token-here",
    "refreshToken": "new-refresh-token-here"
  }
}
```

---

### Forgot Password
```
POST /api/auth/forgot-password
```

Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### Reset Password
```
POST /api/auth/reset-password
```

Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### Verify Email
```
GET /api/auth/verify-email/:token
```

Verify email address using verification token.

**Parameters:**
- `token` (string): Email verification token

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Resend Verification Email
```
POST /api/auth/resend-verification
```

Resend email verification (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

### Get Current User
```
GET /api/auth/me
```

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": null,
      "bio": "EV enthusiast",
      "location": "San Francisco, CA",
      "website": "https://example.com",
      "is_verified": false,
      "is_business": false,
      "join_date": "2024-01-01T00:00:00Z",
      "privacy_settings": {},
      "notification_settings": {}
    }
  }
}
```

---

### Change Password
```
POST /api/auth/change-password
```

Change user password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Get User Profile
```
GET /api/auth/profile
```

Get current user's detailed profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "user",
      "is_active": true,
      "email_verified": true,
      "last_login_at": "2024-01-01T12:00:00Z",
      "login_count": 15,
      "preferences": {
        "theme": "light",
        "language": "en",
        "notifications": {
          "email": true,
          "push": true,
          "marketing": false
        }
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### Update User Profile
```
PUT /api/auth/profile
```

Update current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Electric vehicle enthusiast and advocate",
  "location": "Los Angeles, CA",
  "website": "https://johnsmith.com",
  "privacy_settings": {
    "show_email": false,
    "show_location": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

---

### Verify Email (Alternative)
```
POST /api/auth/verify-email
```

Request email verification for current user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verification sent"
}
```

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Authentication Errors
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Rate Limit Error
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```