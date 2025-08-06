# EV Community Platform - Test Suite

Comprehensive test suite for the EV Community Platform backend API, providing thorough coverage of all routes, middleware, and functionality.

## 📋 Test Overview

The test suite includes comprehensive tests for:

- **Authentication Routes** (`auth.test.js`) - User registration, login, password management, email verification
- **User Management** (`users.test.js`) - Profile management, preferences, avatar handling, statistics
- **Vehicle Management** (`vehicles.test.js`) - CRUD operations, image handling, filtering, validation
- **Charging System** (`charging.test.js`) - Stations, sessions, analytics, reviews

- **Marketplace** (`marketplace.test.js`) - Listings, categories, search, image management
- **Notifications** (`notifications.test.js`) - Delivery, preferences, admin notifications
- **Admin Functions** (`admin.test.js`) - User management, content moderation, system monitoring
- **Application Core** (`app.test.js`) - Middleware, error handling, security

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Test Database** - Supabase test instance
3. **Environment Variables** - Properly configured `.env.test` file

### Environment Setup

Create a `.env.test` file in the backend root:

```env
# Test Environment Configuration
NODE_ENV=test

# Supabase Test Database
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# JWT Configuration
JWT_SECRET=your_test_jwt_secret
JWT_EXPIRES_IN=24h

# Email Configuration (Test)
EMAIL_FROM=test@example.com
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=test_user
EMAIL_SMTP_PASS=test_password

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Installation

```bash
# Install dependencies
npm install

# Install additional test dependencies
npm install --save-dev jest-junit jest-watch-typeahead
```

## 🧪 Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Advanced Test Runner

Use the custom test runner for more control:

```bash
# Run all tests with custom runner
node tests/runTests.js

# Run with coverage report
node tests/runTests.js --coverage

# Run in watch mode
node tests/runTests.js --watch

# Run specific test suite
node tests/runTests.js --suite=auth.test.js

# Run with bail on first failure
node tests/runTests.js --bail

# Run tests in parallel (faster but less reliable for integration tests)
node tests/runTests.js --parallel

# Silent mode (less verbose output)
node tests/runTests.js --silent
```

### Individual Test Suites

```bash
# Run specific test file
npx jest tests/auth.test.js

# Run tests matching pattern
npx jest --testNamePattern="User Registration"

# Run tests for specific describe block
npx jest --testNamePattern="POST /api/auth/register"
```

## 📊 Test Coverage

The test suite aims for comprehensive coverage:

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

### Generating Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 🏗️ Test Architecture

### Test Structure

```
tests/
├── auth.test.js           # Authentication tests
├── users.test.js          # User management tests
├── vehicles.test.js       # Vehicle management tests
├── charging.test.js       # Charging system tests
├── forum.test.js          # Forum functionality tests
├── marketplace.test.js    # Marketplace tests
├── notifications.test.js  # Notification system tests
├── admin.test.js          # Admin functionality tests
├── app.test.js           # Application core tests
├── utils.js              # Test utilities and helpers
├── database.js           # Database test helpers
├── setup.js              # Global test setup
├── env.js                # Environment configuration
├── testSequencer.js      # Custom test execution order
├── runTests.js           # Advanced test runner
└── README.md             # This documentation
```

### Test Utilities

#### `utils.js` - Test Helpers

- `generateTestUser()` - Create test user data
- `createTestAuthHeader()` - Generate auth headers
- `validateApiResponse()` - Validate API response format
- `validateErrorResponse()` - Validate error response format
- `isValidUUID()` - UUID validation
- `generateRandomString()` - Random string generation

#### `database.js` - Database Helpers

- `getTestDatabase()` - Get test database connection
- `resetTestDatabase()` - Clean and reset test data
- `createTestUser()` - Create test user in database
- `createTestVehicle()` - Create test vehicle
- `recordExists()` - Check if record exists
- `getRecordById()` - Fetch record by ID
- `countRecords()` - Count records in table

### Test Patterns

#### Standard Test Structure

```javascript
describe("Feature Name", () => {
  let supabase;
  let testUser;

  beforeAll(async () => {
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    testUser = await createTestUser(supabase, userData);
  });

  describe("API Endpoint", () => {
    test("should handle success case", async () => {
      const response = await request(app)
        .post("/api/endpoint")
        .set(createTestAuthHeader(testUser))
        .send(validData)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty("expectedField");
    });

    test("should handle error case", async () => {
      const response = await request(app)
        .post("/api/endpoint")
        .send(invalidData)
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain("error description");
    });
  });
});
```

## 🔧 Configuration

### Jest Configuration

The test suite uses Jest with custom configuration in `jest.config.js`:

- **Test Environment**: Node.js
- **Test Timeout**: 30 seconds (for integration tests)
- **Setup Files**: Global test setup
- **Coverage**: Configurable thresholds
- **Test Sequencing**: Custom order for optimal execution

### Test Database

Tests use a separate Supabase test database:

- **Isolation**: Each test gets a clean database state
- **Reset**: Database is reset before each test
- **Cleanup**: Automatic cleanup after test completion

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check environment variables
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

2. **Test Timeouts**

   ```bash
   # Run with increased timeout
   npx jest --testTimeout=60000
   ```

3. **Memory Issues**
   ```bash
   # Run tests sequentially
   npx jest --runInBand
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=* npm test

# Run specific test with debug
node --inspect-brk node_modules/.bin/jest tests/auth.test.js
```

### Logging

Enable detailed logging in tests:

```javascript
// In test files
const DEBUG = process.env.DEBUG_TESTS === "true";

if (DEBUG) {
  console.log("Test data:", testData);
  console.log("Response:", response.body);
}
```

## 📝 Writing New Tests

### Test Guidelines

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Isolation**: Each test should be independent
4. **Cleanup**: Always clean up test data
5. **Edge Cases**: Test both success and failure scenarios
6. **Security**: Test authentication and authorization
7. **Validation**: Test input validation and sanitization

### Adding New Test Files

1. Create test file: `tests/feature.test.js`
2. Follow existing patterns and structure
3. Add to test sequencer if order matters
4. Update this README with new test information

### Test Data Management

```javascript
// Use consistent test data
const validTestData = {
  email: "test@example.com",
  username: "testuser",
  password: "TestPassword123!",
};

// Use factories for complex data
const testUser = await createTestUser(supabase, {
  role: "user",
  isActive: true,
});
```

## 🚀 Continuous Integration

### GitHub Actions

Example workflow for automated testing:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
          JWT_SECRET: ${{ secrets.JWT_TEST_SECRET }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📈 Performance Testing

### Load Testing

For performance testing, consider using:

- **Artillery**: API load testing
- **Jest Performance**: Built-in performance testing
- **Clinic.js**: Node.js performance profiling

### Memory Testing

```bash
# Run tests with memory monitoring
node --max-old-space-size=4096 node_modules/.bin/jest

# Check for memory leaks
npx clinic doctor -- npm test
```

## 🔒 Security Testing

The test suite includes security-focused tests:

- **Input Sanitization**: XSS and injection prevention
- **Authentication**: Token validation and expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: API abuse prevention
- **Data Validation**: Input validation and type checking

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)

## 🤝 Contributing

When contributing to the test suite:

1. **Follow Patterns**: Use existing test patterns and structure
2. **Add Documentation**: Update this README for new features
3. **Test Coverage**: Maintain high test coverage
4. **Performance**: Consider test execution time
5. **Reliability**: Ensure tests are deterministic and reliable

---

**Happy Testing! 🧪✨**
