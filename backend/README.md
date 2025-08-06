# EV Community Platform - Backend API

A comprehensive backend API for the EV Community Platform built with Express.js and Supabase.

## 🚀 Features

### Core Functionality

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - Profile management, privacy settings, and user interactions
- **Vehicle Management** - Add, edit, and showcase electric vehicles
- **Marketplace** - Buy/sell EV-related items with advanced filtering
- **Wanted Ads** - Post and respond to wanted advertisements

- **Blog Platform** - Articles and news about EVs with commenting system
- **Charging Stations** - Comprehensive EV charging station database
- **Business Directory** - Directory of EV-related businesses and services
- **Review System** - Rate and review vehicles, businesses, and services
- **Messaging System** - Private messaging between users
- **Notification System** - Real-time notifications with email/push support
- **File Upload** - Image and document upload with Supabase Storage
- **Admin Panel** - Content moderation and user management

### Technical Features

- **RESTful API** - Clean, consistent API design
- **Rate Limiting** - Protection against abuse and spam
- **Input Validation** - Comprehensive request validation with Joi
- **Error Handling** - Centralized error handling with detailed logging
- **Security** - Helmet.js, CORS, and security best practices
- **File Processing** - Image optimization with Sharp
- **Email Service** - Transactional emails with Nodemailer
- **Logging** - Request logging and error tracking
- **Compression** - Response compression for better performance

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Supabase account and project
- Email service (SMTP) for notifications

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ev-nextjs/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the backend root directory:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_REFRESH_EXPIRES_IN=30d

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ADMIN_URL=http://localhost:3001

   # Email Configuration (Nodemailer)
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@domain.com
   SMTP_PASS=your_email_password
   EMAIL_FROM=noreply@yourdomain.com

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX=5

   # Push Notifications (Optional)
   PUSH_NOTIFICATION_KEY=your_push_service_key

   # Analytics (Optional)
   ANALYTICS_API_KEY=your_analytics_key
   ```

4. **Database Setup**

   The application uses Supabase as the database. Follow these steps:

   a. **Create a Supabase project** at https://supabase.com

   b. **Set up the database schema**:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy and execute the SQL from `database/schema.sql`
   - This will create all necessary tables, indexes, triggers, and RLS policies

   c. **Configure Storage**:
   - Create storage buckets for file uploads:
     - `avatars` - User profile pictures
     - `vehicle-images` - Vehicle photos
     - `marketplace-images` - Marketplace listing photos
     - `documents` - Document uploads
   - Set appropriate bucket policies for public/private access

   d. **Verify Setup**:
   - Ensure all tables are created successfully
   - Check that RLS policies are enabled
   - Test database connectivity with your API keys

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot reloading.

### Production Mode

```bash
npm start
```

### Other Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## 📚 API Documentation

Once the server is running, you can access:

- **API Overview**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

### API Endpoints

#### Authentication (`/api/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /verify-email` - Verify email address
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password

#### Users (`/api/users`)

- `GET /` - Get users list
- `GET /profile` - Get current user profile
- `PUT /profile` - Update profile
- `GET /:username` - Get user by username
- `GET /:username/vehicles` - Get user's vehicles
- `GET /:username/posts` - Get user's forum posts
- `GET /:username/reviews` - Get user's reviews
- `POST /upload-avatar` - Upload user avatar
- `DELETE /account` - Delete user account

#### Vehicles (`/api/vehicles`)

- `GET /` - Get all vehicles (public)
- `POST /` - Create new vehicle (auth required)
- `GET /:id` - Get vehicle by ID
- `PUT /:id` - Update vehicle (owner only)
- `DELETE /:id` - Delete vehicle (owner only)
- `GET /user/:username` - Get vehicles by user
- `GET /makes` - Get vehicle makes
- `GET /models` - Get vehicle models

#### Marketplace (`/api/marketplace`)

- `GET /` - Get all listings
- `POST /` - Create new listing (auth required)
- `GET /:id` - Get listing by ID
- `PUT /:id` - Update listing (owner only)
- `DELETE /:id` - Delete listing (owner only)
- `POST /:id/contact` - Contact seller
- `GET /categories` - Get marketplace categories
- `GET /user/:username` - Get user's listings

#### Messages (`/api/messages`)

- `GET /conversations` - Get user conversations
- `GET /conversations/:id` - Get conversation messages
- `POST /` - Send new message
- `GET /:id` - Get message by ID
- `PUT /:id/read` - Mark message as read
- `DELETE /:id` - Delete message
- `GET /unread-count` - Get unread message count

#### Notifications (`/api/notifications`)

- `GET /` - Get user notifications
- `GET /unread-count` - Get unread count
- `GET /:id` - Get notification by ID
- `PUT /:id/read` - Mark as read
- `PUT /mark-all-read` - Mark all as read
- `DELETE /:id` - Delete notification
- `GET /preferences` - Get notification preferences
- `PUT /preferences` - Update preferences

#### File Upload (`/api/upload`)

- `POST /single` - Upload single file
- `POST /multiple` - Upload multiple files
- `GET /files` - Get user's files
- `GET /files/:id` - Get file by ID
- `PUT /files/:id` - Update file metadata
- `DELETE /files/:id` - Delete file
- `POST /avatar` - Upload user avatar
- `DELETE /avatar` - Remove user avatar

#### Admin (`/api/admin`)

- `GET /dashboard` - Get admin dashboard stats
- `GET /users` - Get all users (admin view)
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user (admin)
- `DELETE /users/:id` - Delete user (admin)
- `GET /content/pending` - Get pending content
- `PUT /content/:type/:id/approve` - Approve content
- `PUT /content/:type/:id/reject` - Reject content
- `GET /reports` - Get reported content
- `PUT /reports/:id/resolve` - Resolve report
- `GET /logs` - Get admin action logs

## 🗄️ Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **vehicles** - User vehicle information
- **marketplace_listings** - Marketplace items
- **wanted_ads** - Wanted advertisements

- **blog_posts** - Blog articles
- **blog_comments** - Blog post comments
- **charging_stations** - EV charging station data
- **directory_listings** - Business directory entries
- **reviews** - User reviews and ratings
- **likes** - Content likes/reactions
- **messages** - Private messages
- **notifications** - User notifications
- **file_uploads** - File upload records
- **admin_actions** - Admin action logs
- **reports** - Content reports

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - User, moderator, and admin roles
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Cross-origin request security
- **Helmet.js** - Security headers
- **File Upload Security** - File type and size validation
- **Password Hashing** - bcrypt password encryption

## 🧪 Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in the `tests/` directory and follow the naming convention `*.test.js`.

## 📝 Logging

The application includes comprehensive logging:

- **Request Logging** - All API requests are logged
- **Error Logging** - Detailed error information
- **Admin Action Logging** - All admin actions are tracked
- **Security Event Logging** - Authentication and authorization events

## 🚀 Deployment

### Environment Variables for Production

Ensure all environment variables are properly set for production:

```env
NODE_ENV=production
PORT=5000
# ... other production values
```

### Docker Deployment (Optional)

A Dockerfile is included for containerized deployment:

```bash
# Build Docker image
docker build -t ev-community-backend .

# Run container
docker run -p 5000:5000 --env-file .env ev-community-backend
```

### Health Checks

The application includes health check endpoints for monitoring:

- `GET /health` - Basic health check
- Database connectivity test on startup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error logs and environment details

## 🔄 API Versioning

The API follows semantic versioning. Current version: `v1.0.0`

- Breaking changes will increment the major version
- New features will increment the minor version
- Bug fixes will increment the patch version

## 📊 Performance

- Response compression enabled
- Database query optimization
- Efficient file upload handling
- Caching strategies for frequently accessed data
- Rate limiting to prevent abuse

## 🔮 Future Enhancements

- WebSocket support for real-time features
- Advanced search with Elasticsearch
- Caching layer with Redis
- Microservices architecture
- GraphQL API endpoint
- Advanced analytics and reporting
- Mobile app API optimizations
- Third-party integrations (payment, maps, etc.)

---

**Built with ❤️ for the EV Community**
