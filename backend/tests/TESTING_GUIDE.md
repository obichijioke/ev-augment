# EV Community Platform - Testing Guide

Comprehensive guide for testing the EV Community Platform backend API, covering testing strategies, best practices, and implementation details.

## 🎯 Testing Philosophy

Our testing approach follows these core principles:

1. **Comprehensive Coverage** - Test all critical paths, edge cases, and error scenarios
2. **Isolation** - Each test should be independent and not affect others
3. **Reliability** - Tests should be deterministic and consistently pass/fail
4. **Performance** - Tests should run efficiently without unnecessary delays
5. **Maintainability** - Tests should be easy to understand, modify, and extend
6. **Security-First** - Every endpoint tested for authentication, authorization, and input validation

## 🏗️ Testing Architecture

### Test Pyramid Structure

```
    /\     E2E Tests (Few)
   /  \    - Full user workflows
  /____\   - Critical business processes
 
  /______\  Integration Tests (Some)
 /        \ - API endpoint testing
/__________\- Database interactions
            - External service mocking

/____________\ Unit Tests (Many)
              - Individual functions
              - Utility methods
              - Business logic
```

### Test Categories

#### 1. Unit Tests
- **Purpose**: Test individual functions and methods in isolation
- **Scope**: Utilities, helpers, business logic functions
- **Mocking**: Heavy use of mocks for external dependencies
- **Speed**: Very fast (< 100ms per test)

#### 2. Integration Tests
- **Purpose**: Test API endpoints and database interactions
- **Scope**: Route handlers, middleware, database operations
- **Mocking**: Limited mocking, real database interactions
- **Speed**: Moderate (100ms - 1s per test)

#### 3. End-to-End Tests
- **Purpose**: Test complete user workflows
- **Scope**: Multi-step processes, user journeys
- **Mocking**: Minimal mocking, real services where possible
- **Speed**: Slower (1s+ per test)

## 🧪 Test Implementation Patterns

### Standard Test Structure

```javascript
describe('Feature/Module Name', () => {
  // Test setup
  let supabase;
  let testUser;
  let authHeader;

  beforeAll(async () => {
    // One-time setup for the entire test suite
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    // Setup before each test
    await resetTestDatabase();
    testUser = await createTestUser(supabase, userData);
    authHeader = createTestAuthHeader(testUser);
  });

  afterEach(async () => {
    // Cleanup after each test (if needed)
    // Usually handled by resetTestDatabase()
  });

  afterAll(async () => {
    // Final cleanup for the entire test suite
    await supabase.auth.signOut();
  });

  describe('Specific Functionality', () => {
    test('should handle success case', async () => {
      // Arrange
      const validData = { /* test data */ };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .set(authHeader)
        .send(validData)
        .expect(200);

      // Assert
      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('expectedField');
      
      // Verify database state
      const dbRecord = await getRecordById(supabase, 'table', response.body.data.id);
      expect(dbRecord).toBeTruthy();
    });

    test('should handle error case', async () => {
      // Arrange
      const invalidData = { /* invalid test data */ };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(invalidData)
        .expect(400);

      // Assert
      validateErrorResponse(response.body);
      expect(response.body.message).toContain('expected error message');
    });
  });
});
```

### Authentication Testing Pattern

```javascript
describe('Authentication Required Endpoint', () => {
  test('should require authentication', async () => {
    await request(app)
      .get('/api/protected-endpoint')
      .expect(401);
  });

  test('should reject invalid token', async () => {
    await request(app)
      .get('/api/protected-endpoint')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  test('should reject expired token', async () => {
    const expiredToken = generateExpiredToken();
    await request(app)
      .get('/api/protected-endpoint')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  test('should allow valid token', async () => {
    const validToken = generateValidToken(testUser);
    await request(app)
      .get('/api/protected-endpoint')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

### Authorization Testing Pattern

```javascript
describe('Role-Based Access Control', () => {
  let adminUser, moderatorUser, regularUser;

  beforeEach(async () => {
    adminUser = await createTestUser(supabase, { role: 'admin' });
    moderatorUser = await createTestUser(supabase, { role: 'moderator' });
    regularUser = await createTestUser(supabase, { role: 'user' });
  });

  test('should allow admin access', async () => {
    await request(app)
      .delete('/api/admin/users/123')
      .set(createTestAuthHeader(adminUser))
      .expect(200);
  });

  test('should deny regular user access', async () => {
    await request(app)
      .delete('/api/admin/users/123')
      .set(createTestAuthHeader(regularUser))
      .expect(403);
  });

  test('should allow moderator limited access', async () => {
    await request(app)
      .put('/api/admin/posts/123/moderate')
      .set(createTestAuthHeader(moderatorUser))
      .expect(200);
  });
});
```

### Input Validation Testing Pattern

```javascript
describe('Input Validation', () => {
  const validData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'SecurePass123!'
  };

  test('should accept valid data', async () => {
    await request(app)
      .post('/api/endpoint')
      .send(validData)
      .expect(200);
  });

  test('should reject missing required fields', async () => {
    const requiredFields = ['email', 'username', 'password'];
    
    for (const field of requiredFields) {
      const invalidData = { ...validData };
      delete invalidData[field];
      
      const response = await request(app)
        .post('/api/endpoint')
        .send(invalidData)
        .expect(400);
      
      expect(response.body.message).toContain(field);
    }
  });

  test('should reject invalid email format', async () => {
    const invalidEmails = ['invalid', 'test@', '@example.com', 'test.example.com'];
    
    for (const email of invalidEmails) {
      await request(app)
        .post('/api/endpoint')
        .send({ ...validData, email })
        .expect(400);
    }
  });

  test('should sanitize input data', async () => {
    const maliciousData = {
      ...validData,
      username: '<script>alert("xss")</script>',
      bio: 'Normal text <img src=x onerror=alert(1)>'
    };

    const response = await request(app)
      .post('/api/endpoint')
      .send(maliciousData)
      .expect(200);

    // Verify data was sanitized
    expect(response.body.data.username).not.toContain('<script>');
    expect(response.body.data.bio).not.toContain('onerror');
  });
});
```

### Database Testing Pattern

```javascript
describe('Database Operations', () => {
  test('should create record in database', async () => {
    const testData = { name: 'Test Item', description: 'Test Description' };
    
    const response = await request(app)
      .post('/api/items')
      .set(authHeader)
      .send(testData)
      .expect(201);

    // Verify record exists in database
    const dbRecord = await getRecordById(supabase, 'items', response.body.data.id);
    expect(dbRecord).toBeTruthy();
    expect(dbRecord.name).toBe(testData.name);
    expect(dbRecord.user_id).toBe(testUser.id);
  });

  test('should update record in database', async () => {
    // Create initial record
    const item = await createTestItem(supabase, testUser.id);
    const updateData = { name: 'Updated Name' };

    const response = await request(app)
      .put(`/api/items/${item.id}`)
      .set(authHeader)
      .send(updateData)
      .expect(200);

    // Verify record was updated
    const updatedRecord = await getRecordById(supabase, 'items', item.id);
    expect(updatedRecord.name).toBe(updateData.name);
    expect(updatedRecord.updated_at).not.toBe(item.updated_at);
  });

  test('should handle database constraints', async () => {
    // Test unique constraint violation
    const duplicateData = { email: testUser.email };
    
    await request(app)
      .post('/api/users')
      .send(duplicateData)
      .expect(409); // Conflict
  });

  test('should handle foreign key constraints', async () => {
    const invalidData = { user_id: 'non-existent-id' };
    
    await request(app)
      .post('/api/items')
      .set(authHeader)
      .send(invalidData)
      .expect(400);
  });
});
```

### File Upload Testing Pattern

```javascript
describe('File Upload', () => {
  test('should upload valid image', async () => {
    const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const response = await request(app)
      .post('/api/upload')
      .set(authHeader)
      .attach('image', imagePath)
      .expect(200);

    expect(response.body.data).toHaveProperty('url');
    expect(response.body.data.url).toMatch(/\.(jpg|jpeg|png|webp)$/i);
  });

  test('should reject invalid file type', async () => {
    const textPath = path.join(__dirname, 'fixtures', 'test-file.txt');
    
    await request(app)
      .post('/api/upload')
      .set(authHeader)
      .attach('image', textPath)
      .expect(400);
  });

  test('should reject oversized file', async () => {
    const largePath = path.join(__dirname, 'fixtures', 'large-image.jpg');
    
    await request(app)
      .post('/api/upload')
      .set(authHeader)
      .attach('image', largePath)
      .expect(413); // Payload Too Large
  });

  test('should handle missing file', async () => {
    await request(app)
      .post('/api/upload')
      .set(authHeader)
      .expect(400);
  });
});
```

### Pagination Testing Pattern

```javascript
describe('Pagination', () => {
  beforeEach(async () => {
    // Create test data
    for (let i = 0; i < 25; i++) {
      await createTestItem(supabase, testUser.id, { name: `Item ${i}` });
    }
  });

  test('should return paginated results', async () => {
    const response = await request(app)
      .get('/api/items?page=1&limit=10')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: false
    });
  });

  test('should handle invalid pagination parameters', async () => {
    const invalidParams = [
      'page=0&limit=10',
      'page=1&limit=0',
      'page=-1&limit=10',
      'page=abc&limit=10',
      'page=1&limit=101' // Exceeds max limit
    ];

    for (const params of invalidParams) {
      await request(app)
        .get(`/api/items?${params}`)
        .set(authHeader)
        .expect(400);
    }
  });

  test('should return empty results for out-of-range page', async () => {
    const response = await request(app)
      .get('/api/items?page=999&limit=10')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.page).toBe(999);
  });
});
```

### Search and Filtering Testing Pattern

```javascript
describe('Search and Filtering', () => {
  beforeEach(async () => {
    await createTestItem(supabase, testUser.id, { 
      name: 'Electric Vehicle', 
      category: 'vehicle',
      price: 25000 
    });
    await createTestItem(supabase, testUser.id, { 
      name: 'Charging Cable', 
      category: 'accessory',
      price: 50 
    });
    await createTestItem(supabase, testUser.id, { 
      name: 'Tesla Model 3', 
      category: 'vehicle',
      price: 35000 
    });
  });

  test('should search by text query', async () => {
    const response = await request(app)
      .get('/api/items?search=Tesla')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toContain('Tesla');
  });

  test('should filter by category', async () => {
    const response = await request(app)
      .get('/api/items?category=vehicle')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    response.body.data.forEach(item => {
      expect(item.category).toBe('vehicle');
    });
  });

  test('should filter by price range', async () => {
    const response = await request(app)
      .get('/api/items?minPrice=1000&maxPrice=30000')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].price).toBe(25000);
  });

  test('should combine multiple filters', async () => {
    const response = await request(app)
      .get('/api/items?category=vehicle&minPrice=30000&search=Tesla')
      .set(authHeader)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toContain('Tesla');
  });
});
```

## 🔧 Test Utilities and Helpers

### Database Helpers

```javascript
// tests/database.js
const { createClient } = require('@supabase/supabase-js');

let testSupabase;

function getTestDatabase() {
  if (!testSupabase) {
    testSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return testSupabase;
}

async function resetTestDatabase() {
  const supabase = getTestDatabase();
  
  // Delete test data in correct order (respecting foreign keys)
  const tables = [
    'charging_sessions',
    'charging_reviews',
    'marketplace_images',
    'marketplace_listings',
    'forum_likes',
    'forum_comments',
    'forum_posts',
    'notifications',
    'vehicles',
    'user_profiles'
  ];

  for (const table of tables) {
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

async function createTestUser(supabase, userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!',
    role: 'user',
    isActive: true,
    emailVerified: true
  };

  const user = { ...defaultData, ...userData };
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password
  });

  if (authError) throw authError;

  // Create user profile
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      email_verified: user.emailVerified
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return { ...authData.user, ...profileData };
}

module.exports = {
  getTestDatabase,
  resetTestDatabase,
  createTestUser,
  // ... other helpers
};
```

### Authentication Helpers

```javascript
// tests/utils.js
const jwt = require('jsonwebtoken');

function createTestAuthHeader(user) {
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return { 'Authorization': `Bearer ${token}` };
}

function generateExpiredToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  );
}

function generateInvalidToken() {
  return jwt.sign(
    { userId: 'invalid' },
    'wrong-secret',
    { expiresIn: '1h' }
  );
}

module.exports = {
  createTestAuthHeader,
  generateExpiredToken,
  generateInvalidToken,
  // ... other utilities
};
```

### Response Validation Helpers

```javascript
// tests/utils.js
function validateApiResponse(response) {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('message');
  
  if (response.pagination) {
    expect(response.pagination).toHaveProperty('page');
    expect(response.pagination).toHaveProperty('limit');
    expect(response.pagination).toHaveProperty('total');
    expect(response.pagination).toHaveProperty('totalPages');
  }
}

function validateErrorResponse(response) {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('message');
  expect(response).toHaveProperty('error');
  
  if (response.errors) {
    expect(Array.isArray(response.errors)).toBe(true);
  }
}

function validateUserObject(user) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('createdAt');
  
  // Should not expose sensitive data
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('passwordHash');
}

module.exports = {
  validateApiResponse,
  validateErrorResponse,
  validateUserObject,
  // ... other validators
};
```

## 🚀 Performance Testing

### Load Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: 'User Registration and Login'
    weight: 30
    flow:
      - post:
          url: '/api/auth/register'
          json:
            email: 'test{{ $randomString() }}@example.com'
            username: 'user{{ $randomString() }}'
            password: 'TestPassword123!'
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: 'TestPassword123!'
          capture:
            - json: '$.data.token'
              as: 'authToken'

  - name: 'Browse Marketplace'
    weight: 50
    flow:
      - get:
          url: '/api/marketplace/listings'
      - get:
          url: '/api/marketplace/categories'
      - get:
          url: '/api/marketplace/listings?category=vehicles'

  - name: 'Authenticated Actions'
    weight: 20
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'TestPassword123!'
          capture:
            - json: '$.data.token'
              as: 'authToken'
      - get:
          url: '/api/users/profile'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      - post:
          url: '/api/vehicles'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            make: 'Tesla'
            model: 'Model 3'
            year: 2023
```

### Memory Leak Testing

```javascript
// tests/performance/memory.test.js
describe('Memory Leak Tests', () => {
  test('should not leak memory during repeated requests', async () => {
    const initialMemory = process.memoryUsage();
    
    // Perform many requests
    for (let i = 0; i < 1000; i++) {
      await request(app)
        .get('/api/marketplace/listings')
        .expect(200);
    }
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## 🔒 Security Testing

### SQL Injection Testing

```javascript
describe('SQL Injection Protection', () => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; UPDATE users SET role='admin' WHERE id='1'; --",
    "' UNION SELECT * FROM users --"
  ];

  test('should prevent SQL injection in search queries', async () => {
    for (const payload of sqlInjectionPayloads) {
      const response = await request(app)
        .get(`/api/marketplace/listings?search=${encodeURIComponent(payload)}`)
        .expect(200);
      
      // Should return empty results, not cause an error
      expect(response.body.data).toEqual([]);
    }
  });

  test('should prevent SQL injection in POST data', async () => {
    for (const payload of sqlInjectionPayloads) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: payload,
          password: 'password'
        })
        .expect(400); // Should be validation error, not SQL error
    }
  });
});
```

### XSS Protection Testing

```javascript
describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert("xss")',
    '<svg onload=alert(1)>',
    '\u003cscript\u003ealert("xss")\u003c/script\u003e'
  ];

  test('should sanitize user input', async () => {
    for (const payload of xssPayloads) {
      const response = await request(app)
        .post('/api/forum/posts')
        .set(createTestAuthHeader(testUser))
        .send({
          title: `Test Post ${payload}`,
          content: `Content with ${payload}`,
          category: 'general'
        })
        .expect(201);

      // Verify XSS payload was sanitized
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.content).not.toContain('onerror');
      expect(response.body.data.title).not.toContain('javascript:');
    }
  });
});
```

### Rate Limiting Testing

```javascript
describe('Rate Limiting', () => {
  test('should enforce rate limits', async () => {
    const requests = [];
    
    // Make many requests quickly
    for (let i = 0; i < 150; i++) {
      requests.push(
        request(app)
          .get('/api/marketplace/listings')
      );
    }
    
    const responses = await Promise.allSettled(requests);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(
      result => result.value && result.value.status === 429
    );
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should reset rate limit after window', async () => {
    // Hit rate limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/marketplace/listings');
    }
    
    // Should be rate limited
    await request(app)
      .get('/api/marketplace/listings')
      .expect(429);
    
    // Wait for rate limit window to reset
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Should work again
    await request(app)
      .get('/api/marketplace/listings')
      .expect(200);
  }, 70000);
});
```

## 📊 Test Reporting and Metrics

### Coverage Reports

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/routes/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**',
    '!**/tests/**'
  ]
};
```

### Custom Test Reporter

```javascript
// tests/reporters/customReporter.js
class CustomTestReporter {
  onRunStart(results, options) {
    console.log('🧪 Starting test suite...');
    this.startTime = Date.now();
  }

  onTestResult(test, testResult, aggregatedResult) {
    const { testFilePath, testResults } = testResult;
    const fileName = testFilePath.split('/').pop();
    
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const skipped = testResults.filter(t => t.status === 'pending').length;
    
    console.log(`📄 ${fileName}: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  }

  onRunComplete(contexts, results) {
    const duration = Date.now() - this.startTime;
    const { numTotalTests, numPassedTests, numFailedTests } = results;
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${numTotalTests}`);
    console.log(`   Passed: ${numPassedTests}`);
    console.log(`   Failed: ${numFailedTests}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (numFailedTests === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed.');
    }
  }
}

module.exports = CustomTestReporter;
```

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      working-directory: ./backend
      run: npm ci
    
    - name: Run linting
      working-directory: ./backend
      run: npm run lint
    
    - name: Run tests
      working-directory: ./backend
      run: npm run test:coverage
      env:
        NODE_ENV: test
        SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_ROLE_KEY }}
        JWT_SECRET: ${{ secrets.JWT_TEST_SECRET }}
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage/lcov.info
        flags: backend
        name: backend-coverage
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-${{ matrix.node-version }}
        path: |
          backend/coverage/
          backend/test-results.xml
```

## 🎯 Best Practices Summary

### Do's ✅

1. **Write tests first** - Follow TDD when possible
2. **Test edge cases** - Don't just test the happy path
3. **Use descriptive test names** - Make failures easy to understand
4. **Keep tests isolated** - Each test should be independent
5. **Mock external dependencies** - Control what you're testing
6. **Test security** - Always test auth, validation, and sanitization
7. **Maintain high coverage** - Aim for 80%+ coverage
8. **Use factories** - Create reusable test data generators
9. **Clean up after tests** - Reset database state between tests
10. **Document test patterns** - Help other developers understand

### Don'ts ❌

1. **Don't test implementation details** - Test behavior, not internals
2. **Don't write flaky tests** - Tests should be deterministic
3. **Don't ignore failing tests** - Fix or remove broken tests
4. **Don't test external services** - Mock them instead
5. **Don't write overly complex tests** - Keep tests simple and focused
6. **Don't skip error cases** - Test failure scenarios
7. **Don't hardcode test data** - Use factories and generators
8. **Don't leave test data behind** - Clean up after each test
9. **Don't test everything** - Focus on critical business logic
10. **Don't forget performance** - Consider test execution time

---

**Remember**: Good tests are your safety net. They give you confidence to refactor, add features, and deploy with peace of mind. Invest time in writing quality tests - your future self will thank you! 🚀