// ==============================================
// EV Community Platform - Test Utilities
// ==============================================
// Comprehensive test utilities and helper functions

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ==============================================
// TEST DATA GENERATORS
// ==============================================

/**
 * Generate a test user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test user object
 */
const generateTestUser = (overrides = {}) => {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    id: uuidv4(),
    email: `testuser${randomId}@example.com`,
    username: `testuser${randomId}`,
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    role: 'user',
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate a test admin user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test admin user object
 */
const generateTestAdmin = (overrides = {}) => {
  return generateTestUser({
    role: 'admin',
    email: 'testadmin@example.com',
    username: 'testadmin',
    firstName: 'Test',
    lastName: 'Admin',
    ...overrides
  });
};

/**
 * Generate a test vehicle object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test vehicle object
 */
const generateTestVehicle = (overrides = {}) => {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    id: uuidv4(),
    userId: uuidv4(),
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    trim: 'Long Range',
    color: 'Pearl White',
    batteryCapacity: 75,
    range: 358,
    efficiency: 4.2,
    chargingType: 'CCS',
    vin: `TEST${randomId}VIN123456789`,
    licensePlate: `TEST${randomId}`,
    nickname: `My Tesla ${randomId}`,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate a test forum post object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test forum post object
 */
const generateTestForumPost = (overrides = {}) => {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    id: uuidv4(),
    userId: uuidv4(),
    categoryId: uuidv4(),
    title: `Test Forum Post ${randomId}`,
    content: `This is a test forum post content for testing purposes. Post ID: ${randomId}`,
    slug: `test-forum-post-${randomId}`,
    status: 'published',
    isPinned: false,
    isLocked: false,
    viewCount: 0,
    likeCount: 0,
    replyCount: 0,
    tags: ['test', 'forum'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate a test marketplace listing object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test marketplace listing object
 */
const generateTestMarketplaceListing = (overrides = {}) => {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    id: uuidv4(),
    userId: uuidv4(),
    title: `Test Marketplace Item ${randomId}`,
    description: `This is a test marketplace listing for testing purposes. Item ID: ${randomId}`,
    price: 29999.99,
    currency: 'USD',
    category: 'vehicles',
    condition: 'used',
    location: 'Test City, TC',
    images: [],
    status: 'active',
    isNegotiable: true,
    contactMethod: 'message',
    slug: `test-marketplace-item-${randomId}`,
    viewCount: 0,
    favoriteCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate a test charging session object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test charging session object
 */
const generateTestChargingSession = (overrides = {}) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  
  return {
    id: uuidv4(),
    userId: uuidv4(),
    vehicleId: uuidv4(),
    stationId: uuidv4(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    energyAdded: 45.5,
    cost: 12.75,
    currency: 'USD',
    startBatteryLevel: 25,
    endBatteryLevel: 85,
    chargingSpeed: 'fast',
    powerLevel: 150,
    notes: 'Test charging session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// ==============================================
// JWT UTILITIES
// ==============================================

/**
 * Generate a test JWT token
 * @param {Object} payload - JWT payload
 * @param {Object} options - JWT options
 * @returns {String} JWT token
 */
const generateTestJWT = (payload = {}, options = {}) => {
  const defaultPayload = {
    userId: uuidv4(),
    email: 'test@example.com',
    role: 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };

  const finalPayload = { ...defaultPayload, ...payload };
  const secret = process.env.JWT_SECRET || 'test_secret';
  const defaultOptions = { algorithm: 'HS256' };
  const finalOptions = { ...defaultOptions, ...options };

  return jwt.sign(finalPayload, secret, finalOptions);
};

/**
 * Generate an expired JWT token
 * @param {Object} payload - JWT payload
 * @returns {String} Expired JWT token
 */
const generateExpiredJWT = (payload = {}) => {
  return generateTestJWT({
    ...payload,
    exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
  });
};

/**
 * Generate an invalid JWT token
 * @returns {String} Invalid JWT token
 */
const generateInvalidJWT = () => {
  return 'invalid.jwt.token';
};

/**
 * Create authorization header with JWT token
 * @param {String} token - JWT token
 * @returns {Object} Authorization header object
 */
const createAuthHeader = (token) => {
  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Create authorization header for test user
 * @param {Object} user - User object
 * @returns {Object} Authorization header object
 */
const createTestAuthHeader = (user = {}) => {
  const token = generateTestJWT({
    userId: user.id || uuidv4(),
    email: user.email || 'test@example.com',
    role: user.role || 'user'
  });
  return createAuthHeader(token);
};

// ==============================================
// PASSWORD UTILITIES
// ==============================================

/**
 * Hash a password for testing
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Generate a random password
 * @param {Number} length - Password length
 * @returns {String} Random password
 */
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// ==============================================
// API RESPONSE UTILITIES
// ==============================================

/**
 * Validate API response structure
 * @param {Object} response - API response object
 * @param {Object} expectedStructure - Expected response structure
 * @returns {Boolean} Validation result
 */
const validateApiResponse = (response, expectedStructure = {}) => {
  const defaultStructure = {
    success: 'boolean',
    message: 'string',
    data: 'object'
  };

  const structure = { ...defaultStructure, ...expectedStructure };

  for (const [key, expectedType] of Object.entries(structure)) {
    if (!(key in response)) {
      throw new Error(`Missing required field: ${key}`);
    }

    const actualType = typeof response[key];
    if (actualType !== expectedType && response[key] !== null) {
      throw new Error(`Field ${key} should be ${expectedType}, got ${actualType}`);
    }
  }

  return true;
};

/**
 * Validate error response structure
 * @param {Object} response - Error response object
 * @returns {Boolean} Validation result
 */
const validateErrorResponse = (response) => {
  return validateApiResponse(response, {
    success: 'boolean',
    message: 'string',
    error: 'object'
  });
};

/**
 * Validate pagination response structure
 * @param {Object} response - Pagination response object
 * @returns {Boolean} Validation result
 */
const validatePaginationResponse = (response) => {
  validateApiResponse(response);
  
  if (!response.data.items || !Array.isArray(response.data.items)) {
    throw new Error('Pagination response should have items array');
  }

  const requiredPaginationFields = ['page', 'limit', 'total', 'totalPages'];
  for (const field of requiredPaginationFields) {
    if (!(field in response.data) || typeof response.data[field] !== 'number') {
      throw new Error(`Pagination response should have ${field} as number`);
    }
  }

  return true;
};

// ==============================================
// DATABASE UTILITIES
// ==============================================

/**
 * Clean up test data from database
 * @param {Object} supabase - Supabase client
 * @param {Array} tables - Tables to clean
 * @returns {Promise<void>}
 */
const cleanupTestData = async (supabase, tables = []) => {
  const defaultTables = [
    'charging_sessions',
    'marketplace_listings',
    'forum_posts',
    'vehicles',
    'users'
  ];

  const tablesToClean = tables.length > 0 ? tables : defaultTables;

  for (const table of tablesToClean) {
    try {
      // Only delete test data (identified by email containing 'test' or 'example')
      if (table === 'users') {
        await supabase
          .from(table)
          .delete()
          .or('email.ilike.%test%,email.ilike.%example%');
      } else {
        // For other tables, delete all test data
        await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep system data
      }
    } catch (error) {
      console.warn(`Warning: Could not clean table ${table}:`, error.message);
    }
  }
};

/**
 * Create test user in database
 * @param {Object} supabase - Supabase client
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createTestUser = async (supabase, userData = {}) => {
  const user = generateTestUser(userData);
  user.password = await hashPassword(user.password);

  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data;
};

/**
 * Create test vehicle in database
 * @param {Object} supabase - Supabase client
 * @param {String} userId - User ID
 * @param {Object} vehicleData - Vehicle data
 * @returns {Promise<Object>} Created vehicle
 */
const createTestVehicle = async (supabase, userId, vehicleData = {}) => {
  const vehicle = generateTestVehicle({ userId, ...vehicleData });

  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicle])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test vehicle: ${error.message}`);
  }

  return data;
};

// ==============================================
// FILE UTILITIES
// ==============================================

/**
 * Create a test file buffer
 * @param {String} content - File content
 * @param {String} mimeType - MIME type
 * @returns {Buffer} File buffer
 */
const createTestFile = (content = 'test file content', mimeType = 'text/plain') => {
  return Buffer.from(content);
};

/**
 * Create a test image buffer (simple PNG)
 * @returns {Buffer} Image buffer
 */
const createTestImage = () => {
  // Simple 1x1 PNG image
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  return pngData;
};

// ==============================================
// TIME UTILITIES
// ==============================================

/**
 * Sleep for specified milliseconds
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get ISO string for date offset by days
 * @param {Number} days - Days to offset (negative for past)
 * @returns {String} ISO date string
 */
const getDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// ==============================================
// RANDOM UTILITIES
// ==============================================

/**
 * Generate random string
 * @param {Number} length - String length
 * @returns {String} Random string
 */
const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

/**
 * Generate random number between min and max
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Number} Random number
 */
const generateRandomNumber = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Pick random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element
 */
const pickRandom = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// ==============================================
// VALIDATION UTILITIES
// ==============================================

/**
 * Validate UUID format
 * @param {String} uuid - UUID string
 * @returns {Boolean} Validation result
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate email format
 * @param {String} email - Email string
 * @returns {Boolean} Validation result
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate ISO date format
 * @param {String} dateString - Date string
 * @returns {Boolean} Validation result
 */
const isValidISODate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
  // Data generators
  generateTestUser,
  generateTestAdmin,
  generateTestVehicle,
  generateTestForumPost,
  generateTestMarketplaceListing,
  generateTestChargingSession,

  // JWT utilities
  generateTestJWT,
  generateExpiredJWT,
  generateInvalidJWT,
  createAuthHeader,
  createTestAuthHeader,

  // Password utilities
  hashPassword,
  generateRandomPassword,

  // API response utilities
  validateApiResponse,
  validateErrorResponse,
  validatePaginationResponse,

  // Database utilities
  cleanupTestData,
  createTestUser,
  createTestVehicle,

  // File utilities
  createTestFile,
  createTestImage,

  // Time utilities
  sleep,
  getDateOffset,

  // Random utilities
  generateRandomString,
  generateRandomNumber,
  pickRandom,

  // Validation utilities
  isValidUUID,
  isValidEmail,
  isValidISODate
};