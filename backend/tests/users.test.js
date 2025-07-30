// ==============================================
// EV Community Platform - User Routes Tests
// ==============================================
// Comprehensive tests for user management routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestAdmin,
  generateTestJWT,
  createAuthHeader,
  createTestAuthHeader,
  validateApiResponse,
  validateErrorResponse,
  validatePaginationResponse,
  isValidUUID,
  isValidEmail,
  createTestImage,
  generateRandomString
} = require('./utils');
const {
  getTestDatabase,
  resetTestDatabase,
  createTestUser,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('User Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;
  let otherUser;

  beforeAll(async () => {
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    
    // Create test users
    testUser = await createTestUser(supabase, {
      email: 'testuser@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isEmailVerified: true
    });

    testAdmin = await createTestUser(supabase, {
      email: 'testadmin@example.com',
      username: 'testadmin',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      isEmailVerified: true
    });

    otherUser = await createTestUser(supabase, {
      email: 'otheruser@example.com',
      username: 'otheruser',
      firstName: 'Other',
      lastName: 'User',
      role: 'user',
      isEmailVerified: true
    });
  });

  // ==============================================
  // GET USER PROFILE TESTS
  // ==============================================

  describe('GET /api/users/profile', () => {
    test('should get own profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      validateErrorResponse(response.body);
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // UPDATE USER PROFILE TESTS
  // ==============================================

  describe('PUT /api/users/profile', () => {
    const validUpdateData = {
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio',
      location: 'Updated City, UC',
      website: 'https://updated-website.com',
      preferences: {
        emailNotifications: false,
        pushNotifications: true,
        theme: 'dark'
      }
    };

    test('should update profile with valid data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        firstName: validUpdateData.firstName,
        lastName: validUpdateData.lastName,
        bio: validUpdateData.bio,
        location: validUpdateData.location,
        website: validUpdateData.website
      });

      // Verify update in database
      const updatedUser = await getRecordById('users', testUser.id);
      expect(updatedUser.firstName).toBe(validUpdateData.firstName);
      expect(updatedUser.lastName).toBe(validUpdateData.lastName);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send(validUpdateData)
        .expect(401);

      validateErrorResponse(response.body);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('email');
    });

    test('should return 400 for invalid website URL', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .send({
          website: 'invalid-url'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('website');
    });

    test('should sanitize input data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .send({
          firstName: '  Updated  ',
          lastName: '  Name  ',
          bio: '  Updated bio  '
        })
        .expect(200);

      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
      expect(response.body.data.user.bio).toBe('Updated bio');
    });

    test('should not allow updating protected fields', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set(createTestAuthHeader(testUser))
        .send({
          id: 'new-id',
          role: 'admin',
          isEmailVerified: false,
          createdAt: new Date().toISOString()
        })
        .expect(200);

      // Verify protected fields weren't changed
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.role).toBe(testUser.role);
    });
  });

  // ==============================================
  // GET USER BY ID TESTS
  // ==============================================

  describe('GET /api/users/:id', () => {
    test('should get public user profile by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUser.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.user).toMatchObject({
        id: otherUser.id,
        username: otherUser.username,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName
      });
      
      // Should not include private information
      expect(response.body.data.user).not.toHaveProperty('email');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('User not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid user ID');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUser.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // GET USERS LIST TESTS
  // ==============================================

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create additional users for pagination testing
      for (let i = 0; i < 15; i++) {
        await createTestUser(supabase, {
          email: `user${i}@example.com`,
          username: `user${i}`,
          firstName: `User`,
          lastName: `${i}`
        });
      }
    });

    test('should get paginated users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10); // Default limit
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=2&limit=5')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    test('should support search by username', async () => {
      const response = await request(app)
        .get('/api/users?search=testuser')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      const usernames = response.body.data.items.map(user => user.username);
      expect(usernames.some(username => username.includes('testuser'))).toBe(true);
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/users?sortBy=username&sortOrder=desc')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      const usernames = response.body.data.items.map(user => user.username);
      const sortedUsernames = [...usernames].sort().reverse();
      expect(usernames).toEqual(sortedUsernames);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      validateErrorResponse(response.body);
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=0&limit=101')
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });
  });

  // ==============================================
  // AVATAR UPLOAD TESTS
  // ==============================================

  describe('POST /api/users/avatar', () => {
    test('should upload avatar image', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post('/api/users/avatar')
        .set(createTestAuthHeader(testUser))
        .attach('avatar', imageBuffer, 'avatar.png')
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('avatarUrl');
      expect(response.body.data.avatarUrl).toMatch(/^https?:\/\/.+/);
    });

    test('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/api/users/avatar')
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('file');
    });

    test('should return 400 for invalid file type', async () => {
      const textBuffer = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/api/users/avatar')
        .set(createTestAuthHeader(testUser))
        .attach('avatar', textBuffer, 'document.txt')
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('file type');
    });

    test('should return 401 for missing authentication', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post('/api/users/avatar')
        .attach('avatar', imageBuffer, 'avatar.png')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // DELETE AVATAR TESTS
  // ==============================================

  describe('DELETE /api/users/avatar', () => {
    test('should delete avatar', async () => {
      const response = await request(app)
        .delete('/api/users/avatar')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('removed');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete('/api/users/avatar')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // USER PREFERENCES TESTS
  // ==============================================

  describe('GET /api/users/preferences', () => {
    test('should get user preferences', async () => {
      const response = await request(app)
        .get('/api/users/preferences')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('preferences');
      expect(typeof response.body.data.preferences).toBe('object');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/users/preferences')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('PUT /api/users/preferences', () => {
    const validPreferences = {
      emailNotifications: false,
      pushNotifications: true,
      theme: 'dark',
      language: 'en',
      timezone: 'America/New_York',
      units: 'metric',
      privacy: {
        showEmail: false,
        showLocation: true,
        showVehicles: true
      }
    };

    test('should update user preferences', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .set(createTestAuthHeader(testUser))
        .send(validPreferences)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.preferences).toMatchObject(validPreferences);
    });

    test('should validate preference values', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .set(createTestAuthHeader(testUser))
        .send({
          theme: 'invalid-theme',
          language: 'invalid-language'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .send(validPreferences)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // ADMIN USER MANAGEMENT TESTS
  // ==============================================

  describe('Admin User Management', () => {
    describe('GET /api/users/admin/all', () => {
      test('should allow admin to get all users with private data', async () => {
        const response = await request(app)
          .get('/api/users/admin/all')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items[0]).toHaveProperty('email');
        expect(response.body.data.items[0]).toHaveProperty('isActive');
        expect(response.body.data.items[0]).toHaveProperty('createdAt');
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/users/admin/all')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });
    });

    describe('PUT /api/users/admin/:id/status', () => {
      test('should allow admin to activate/deactivate users', async () => {
        const response = await request(app)
          .put(`/api/users/admin/${testUser.id}/status`)
          .set(createTestAuthHeader(testAdmin))
          .send({ isActive: false })
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user.isActive).toBe(false);

        // Verify in database
        const updatedUser = await getRecordById('users', testUser.id);
        expect(updatedUser.isActive).toBe(false);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .put(`/api/users/admin/${otherUser.id}/status`)
          .set(createTestAuthHeader(testUser))
          .send({ isActive: false })
          .expect(403);

        validateErrorResponse(response.body);
      });

      test('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .put('/api/users/admin/550e8400-e29b-41d4-a716-446655440000/status')
          .set(createTestAuthHeader(testAdmin))
          .send({ isActive: false })
          .expect(404);

        validateErrorResponse(response.body);
      });
    });

    describe('PUT /api/users/admin/:id/role', () => {
      test('should allow admin to change user roles', async () => {
        const response = await request(app)
          .put(`/api/users/admin/${testUser.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send({ role: 'moderator' })
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user.role).toBe('moderator');
      });

      test('should validate role values', async () => {
        const response = await request(app)
          .put(`/api/users/admin/${testUser.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send({ role: 'invalid-role' })
          .expect(400);

        validateErrorResponse(response.body);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .put(`/api/users/admin/${otherUser.id}/role`)
          .set(createTestAuthHeader(testUser))
          .send({ role: 'moderator' })
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // USER DELETION TESTS
  // ==============================================

  describe('DELETE /api/users/account', () => {
    test('should allow user to delete their own account', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set(createTestAuthHeader(testUser))
        .send({ password: 'TestPassword123!' })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('deleted');

      // Verify user is marked as deleted or removed
      const deletedUser = await getRecordById('users', testUser.id);
      expect(deletedUser).toBeNull();
    });

    test('should require password confirmation', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set(createTestAuthHeader(testUser))
        .send({})
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('password');
    });

    test('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set(createTestAuthHeader(testUser))
        .send({ password: 'WrongPassword123!' })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('password');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .send({ password: 'TestPassword123!' })
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // USER STATISTICS TESTS
  // ==============================================

  describe('GET /api/users/stats', () => {
    test('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('postsCount');
      expect(response.body.data.stats).toHaveProperty('vehiclesCount');
      expect(response.body.data.stats).toHaveProperty('joinedDate');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });
});