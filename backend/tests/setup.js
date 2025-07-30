// ==============================================
// EV Community Platform - Test Setup
// ==============================================
// Global test setup and configuration

const { createClient } = require('@supabase/supabase-js');

// ==============================================
// ENVIRONMENT SETUP
// ==============================================
// Ensure we're in test environment
process.env.NODE_ENV = 'test';

// Set test-specific environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_testing_only';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Supabase test configuration
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key';

// Email configuration for tests
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025'; // MailHog or similar test SMTP server
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test_password';
process.env.EMAIL_FROM = 'test@evcommunity.com';

// File upload configuration
process.env.MAX_FILE_SIZE = '10485760'; // 10MB
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';

// Rate limiting (disabled for tests)
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.AUTH_RATE_LIMIT_MAX = '100';

// CORS configuration
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ADMIN_URL = 'http://localhost:3001';

// ==============================================
// JEST EXTENSIONS
// ==============================================
// Extend Jest matchers
expect.extend({
  // Custom matcher for API responses
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.hasOwnProperty('status') &&
                 (received.hasOwnProperty('data') || received.hasOwnProperty('error'));
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with status and data/error properties`,
        pass: false,
      };
    }
  },

  // Custom matcher for JWT tokens
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT token`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT token`,
        pass: false,
      };
    }
  },

  // Custom matcher for email format
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  // Custom matcher for UUID format
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  }
});

// ==============================================
// GLOBAL TEST UTILITIES
// ==============================================
// Global test utilities available in all tests
global.testUtils = {
  // Generate test user data
  generateTestUser: (overrides = {}) => ({
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    ...overrides
  }),

  // Generate test vehicle data
  generateTestVehicle: (overrides = {}) => ({
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    trim: 'Long Range',
    color: 'Pearl White',
    battery_capacity: 75,
    range_miles: 358,
    purchase_date: '2023-01-15',
    purchase_price: 45000,
    ...overrides
  }),

  // Generate test marketplace listing
  generateTestListing: (overrides = {}) => ({
    title: 'Test EV Accessory',
    description: 'A test listing for EV accessories',
    price: 99.99,
    category: 'accessories',
    condition: 'new',
    location: 'Test City, TC',
    ...overrides
  }),

  // Generate test forum post
  generateTestPost: (overrides = {}) => ({
    title: 'Test Forum Post',
    content: 'This is a test forum post content',
    category_id: 1,
    ...overrides
  }),

  // Wait for a specified time (for async operations)
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clean up test data (implement based on your needs)
  cleanupTestData: async () => {
    // This would clean up any test data created during tests
    // Implementation depends on your database setup
    console.log('Cleaning up test data...');
  }
};

// ==============================================
// MOCK CONFIGURATIONS
// ==============================================
// Mock external services for testing

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    }
  }))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

// Mock multer for file uploads
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test file content'),
        size: 1024
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [{
        fieldname: 'files',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test file content'),
        size: 1024
      }];
      next();
    }
  });
  
  multer.memoryStorage = jest.fn();
  return multer;
});

// ==============================================
// CONSOLE OVERRIDES
// ==============================================
// Suppress console logs during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// ==============================================
// GLOBAL SETUP AND TEARDOWN
// ==============================================
// Global setup before all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Initialize test database connection if needed
  // await initializeTestDatabase();
  
  // Set up test data if needed
  // await seedTestData();
});

// Global teardown after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up test data
  await global.testUtils.cleanupTestData();
  
  // Close database connections
  // await closeTestDatabase();
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset any global state
  // resetGlobalState();
});

// Cleanup after each test
afterEach(() => {
  // Clean up any test-specific data
  // cleanupTestSpecificData();
});

// ==============================================
// ERROR HANDLING
// ==============================================
// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log the error
});

// ==============================================
// TEST HELPERS
// ==============================================
// Export test helpers for use in individual test files
module.exports = {
  testUtils: global.testUtils,
  
  // Helper to create authenticated request headers
  createAuthHeaders: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),
  
  // Helper to create test JWT token
  createTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: 'test-user-id', email: 'test@example.com', ...payload },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Helper to validate API response structure
  validateApiResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');
  },
  
  // Helper to validate error response structure
  validateErrorResponse: (response, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('status', expectedStatus);
  }
};

console.log('✅ Test setup completed successfully');