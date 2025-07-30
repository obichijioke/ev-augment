// ==============================================
// EV Community Platform - Authentication Tests
// ==============================================
// Comprehensive tests for authentication routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestAdmin,
  generateTestJWT,
  generateExpiredJWT,
  generateInvalidJWT,
  createAuthHeader,
  hashPassword,
  validateApiResponse,
  validateErrorResponse,
  isValidUUID,
  isValidEmail
} = require('./utils');
const {
  getTestDatabase,
  resetTestDatabase,
  createTestUser,
  recordExists,
  getRecordById
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Authentication Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    
    // Create test users
    testUser = await createTestUser(supabase, {
      email: 'testuser@example.com',
      username: 'testuser',
      role: 'user',
      isEmailVerified: true
    });

    testAdmin = await createTestUser(supabase, {
      email: 'testadmin@example.com',
      username: 'testadmin',
      role: 'admin',
      isEmailVerified: true
    });
  });

  // ==============================================
  // USER REGISTRATION TESTS
  // ==============================================

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    };

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('registered successfully')
      });

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
        role: 'user',
        isActive: true
      });

      expect(isValidUUID(response.body.data.user.id)).toBe(true);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const userExists = await recordExists('users', {
        email: validRegistrationData.email
      });
      expect(userExists).toBe(true);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com'
          // Missing other required fields
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('email');
    });

    test('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          password: '123',
          confirmPassword: '123'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('password');
    });

    test('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          confirmPassword: 'DifferentPassword123!'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('match');
    });

    test('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: testUser.email
        })
        .expect(409);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('already exists');
    });

    test('should return 409 for duplicate username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          username: testUser.username
        })
        .expect(409);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('already exists');
    });

    test('should sanitize and validate input data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: '  NEWUSER@EXAMPLE.COM  ',
          username: '  NewUser  ',
          firstName: '  New  ',
          lastName: '  User  '
        })
        .expect(201);

      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.username).toBe('newuser');
      expect(response.body.data.user.firstName).toBe('New');
      expect(response.body.data.user.lastName).toBe('User');
    });
  });

  // ==============================================
  // USER LOGIN TESTS
  // ==============================================

  describe('POST /api/auth/login', () => {
    test('should login with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!' // Default password from utils
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should login with valid username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'TestPassword123!'
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('required');
    });

    test('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return 401 for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser(supabase, {
        email: 'inactive@example.com',
        username: 'inactive',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'TestPassword123!'
        })
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('account is disabled');
    });

    test('should handle case-insensitive email login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: 'TestPassword123!'
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user.id).toBe(testUser.id);
    });
  });

  // ==============================================
  // TOKEN VALIDATION TESTS
  // ==============================================

  describe('GET /api/auth/me', () => {
    test('should return user profile with valid token', async () => {
      const token = generateTestJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(token))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('token');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(generateInvalidJWT()))
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid token');
    });

    test('should return 401 for expired token', async () => {
      const expiredToken = generateExpiredJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(expiredToken))
        .expect(401);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('expired');
    });

    test('should return 404 for non-existent user', async () => {
      const token = generateTestJWT({
        userId: '550e8400-e29b-41d4-a716-446655440000', // Non-existent user
        email: 'nonexistent@example.com',
        role: 'user'
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(token))
        .expect(404);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('User not found');
    });
  });

  // ==============================================
  // PASSWORD RESET TESTS
  // ==============================================

  describe('POST /api/auth/forgot-password', () => {
    test('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('reset instructions');
    });

    test('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('reset instructions');
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('email');
    });

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      // This would typically require a valid reset token from the database
      // For testing, we'll mock the token validation
      const resetToken = 'valid-reset-token-123';
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('reset successfully');
    });

    test('should return 400 for invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid or expired');
    });

    test('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-reset-token-123',
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('match');
    });

    test('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-reset-token-123',
          password: '123',
          confirmPassword: '123'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('password');
    });
  });

  // ==============================================
  // PASSWORD CHANGE TESTS
  // ==============================================

  describe('POST /api/auth/change-password', () => {
    test('should change password with valid current password', async () => {
      const token = generateTestJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(token))
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('changed successfully');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(401);

      validateErrorResponse(response.body);
    });

    test('should return 400 for incorrect current password', async () => {
      const token = generateTestJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(token))
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('current password');
    });

    test('should return 400 for password mismatch', async () => {
      const token = generateTestJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(token))
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('match');
    });
  });

  // ==============================================
  // LOGOUT TESTS
  // ==============================================

  describe('POST /api/auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const token = generateTestJWT({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set(createAuthHeader(token))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('logged out');
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // EMAIL VERIFICATION TESTS
  // ==============================================

  describe('POST /api/auth/verify-email', () => {
    test('should verify email with valid token', async () => {
      // Create unverified user
      const unverifiedUser = await createTestUser(supabase, {
        email: 'unverified@example.com',
        username: 'unverified',
        isEmailVerified: false
      });

      const verificationToken = 'valid-verification-token-123';

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: verificationToken
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('verified successfully');
    });

    test('should return 400 for invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'invalid-token'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    test('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: testUser.email
        })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('verification email');
    });

    test('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // RATE LIMITING TESTS
  // ==============================================

  describe('Rate Limiting', () => {
    test('should apply rate limiting to login attempts', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Check if rate limiting is applied
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  // ==============================================
  // SECURITY TESTS
  // ==============================================

  describe('Security', () => {
    test('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).not.toContain('user not found');
      expect(response.body.message).not.toContain('password incorrect');
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should sanitize input to prevent injection attacks', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password'
        })
        .expect(400);

      validateErrorResponse(response.body);
    });

    test('should hash passwords properly', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security@example.com',
          username: 'security',
          firstName: 'Security',
          lastName: 'Test',
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!'
        })
        .expect(201);

      // Verify password is not returned in response
      expect(response.body.data.user).not.toHaveProperty('password');
      
      // Verify password is hashed in database
      const user = await getRecordById('users', response.body.data.user.id);
      expect(user.password).not.toBe('SecurePassword123!');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });
});