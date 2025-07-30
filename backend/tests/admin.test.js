// ==============================================
// EV Community Platform - Admin Routes Tests
// ==============================================
// Comprehensive tests for administrative routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  createTestAuthHeader,
  validateApiResponse,
  validateErrorResponse,
  validatePaginationResponse,
  isValidUUID,
  generateRandomString
} = require('./utils');
const {
  getTestDatabase,
  resetTestDatabase,
  createTestUser,
  createTestVehicle,
  createTestForumPost,
  createTestMarketplaceListing,
  createTestChargingSession,
  createTestNotification,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Admin Routes', () => {
  let supabase;
  let testAdmin;
  let testModerator;
  let testUser;
  let otherUser;
  let testVehicle;
  let testPost;
  let testListing;
  let testSession;

  beforeAll(async () => {
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    
    // Create test users with different roles
    testAdmin = await createTestUser(supabase, {
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin',
      isActive: true
    });

    testModerator = await createTestUser(supabase, {
      email: 'moderator@example.com',
      username: 'moderator',
      role: 'moderator',
      isActive: true
    });

    testUser = await createTestUser(supabase, {
      email: 'testuser@example.com',
      username: 'testuser',
      role: 'user',
      isActive: true
    });

    otherUser = await createTestUser(supabase, {
      email: 'otheruser@example.com',
      username: 'otheruser',
      role: 'user',
      isActive: true
    });

    // Create test content
    testVehicle = await createTestVehicle(supabase, testUser.id, {
      make: 'Tesla',
      model: 'Model 3',
      year: 2023
    });

    testPost = await createTestForumPost(supabase, testUser.id, {
      title: 'Test Forum Post',
      content: 'This is a test forum post for admin testing.',
      categoryId: '550e8400-e29b-41d4-a716-446655440001'
    });

    testListing = await createTestMarketplaceListing(supabase, testUser.id, {
      title: 'Test Marketplace Listing',
      description: 'This is a test marketplace listing for admin testing.',
      price: 299.99,
      category: 'accessories',
      condition: 'new'
    });

    testSession = await createTestChargingSession(supabase, testUser.id, testVehicle.id, '550e8400-e29b-41d4-a716-446655440002', {
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      energyDelivered: 45.5,
      cost: 12.75
    });
  });

  // ==============================================
  // ADMIN DASHBOARD TESTS
  // ==============================================

  describe('Admin Dashboard', () => {
    describe('GET /api/admin/dashboard', () => {
      test('should get admin dashboard data', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('dashboard');
        expect(response.body.data.dashboard).toHaveProperty('stats');
        expect(response.body.data.dashboard).toHaveProperty('recentActivity');
        expect(response.body.data.dashboard).toHaveProperty('systemHealth');
        expect(response.body.data.dashboard).toHaveProperty('alerts');
        
        // Check stats structure
        const stats = response.body.data.dashboard.stats;
        expect(stats).toHaveProperty('totalUsers');
        expect(stats).toHaveProperty('activeUsers');
        expect(stats).toHaveProperty('totalVehicles');
        expect(stats).toHaveProperty('totalPosts');
        expect(stats).toHaveProperty('totalListings');
        expect(stats).toHaveProperty('totalSessions');
        expect(stats).toHaveProperty('revenue');
        
        // Check system health
        const health = response.body.data.dashboard.systemHealth;
        expect(health).toHaveProperty('database');
        expect(health).toHaveProperty('storage');
        expect(health).toHaveProperty('email');
        expect(health).toHaveProperty('cache');
      });

      test('should allow moderator access to dashboard', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set(createTestAuthHeader(testModerator))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('dashboard');
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/admin/analytics', () => {
      test('should get platform analytics', async () => {
        const response = await request(app)
          .get('/api/admin/analytics')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('analytics');
        expect(response.body.data.analytics).toHaveProperty('userGrowth');
        expect(response.body.data.analytics).toHaveProperty('contentMetrics');
        expect(response.body.data.analytics).toHaveProperty('engagementMetrics');
        expect(response.body.data.analytics).toHaveProperty('revenueMetrics');
        expect(response.body.data.analytics).toHaveProperty('geographicData');
      });

      test('should support date range filtering', async () => {
        const fromDate = new Date(Date.now() - 86400000 * 30).toISOString(); // 30 days ago
        const toDate = new Date().toISOString();

        const response = await request(app)
          .get(`/api/admin/analytics?fromDate=${fromDate}&toDate=${toDate}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.analytics).toHaveProperty('userGrowth');
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/admin/analytics')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // USER MANAGEMENT TESTS
  // ==============================================

  describe('User Management', () => {
    describe('GET /api/admin/users', () => {
      beforeEach(async () => {
        // Create additional users for testing
        for (let i = 0; i < 10; i++) {
          await createTestUser(supabase, {
            email: `user${i}@example.com`,
            username: `user${i}`,
            role: i % 3 === 0 ? 'moderator' : 'user',
            isActive: i % 4 !== 0
          });
        }
      });

      test('should get all users with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check user structure includes admin fields
        const user = response.body.data.items[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActive');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('lastLoginAt');
        expect(user).toHaveProperty('stats');
      });

      test('should support filtering by role', async () => {
        const response = await request(app)
          .get('/api/admin/users?role=moderator')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(user => {
          expect(user.role).toBe('moderator');
        });
      });

      test('should support filtering by active status', async () => {
        const response = await request(app)
          .get('/api/admin/users?isActive=false')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(user => {
          expect(user.isActive).toBe(false);
        });
      });

      test('should support search by email and username', async () => {
        const response = await request(app)
          .get('/api/admin/users?search=testuser')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(user => {
          expect(
            user.email.toLowerCase().includes('testuser') ||
            user.username.toLowerCase().includes('testuser')
          ).toBe(true);
        });
      });

      test('should support sorting', async () => {
        const response = await request(app)
          .get('/api/admin/users?sortBy=createdAt&sortOrder=desc')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        const dates = response.body.data.items.map(user => new Date(user.createdAt));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/admin/users/:id', () => {
      test('should get detailed user information', async () => {
        const response = await request(app)
          .get(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user).toMatchObject({
          id: testUser.id,
          email: testUser.email,
          username: testUser.username,
          role: testUser.role,
          isActive: testUser.isActive
        });

        // Should include detailed stats and activity
        expect(response.body.data.user).toHaveProperty('stats');
        expect(response.body.data.user).toHaveProperty('recentActivity');
        expect(response.body.data.user).toHaveProperty('loginHistory');
        expect(response.body.data.user).toHaveProperty('preferences');
      });

      test('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/admin/users/550e8400-e29b-41d4-a716-446655440000')
          .set(createTestAuthHeader(testAdmin))
          .expect(404);

        validateErrorResponse(response.body);
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('PATCH /api/admin/users/:id/role', () => {
      const validRoleData = {
        role: 'moderator',
        reason: 'Promoting active community member to moderator'
      };

      test('should allow admin to change user role', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send(validRoleData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user.role).toBe(validRoleData.role);

        // Verify role was updated in database
        const updatedUser = await getRecordById('users', testUser.id);
        expect(updatedUser.role).toBe(validRoleData.role);
      });

      test('should return 400 for invalid role', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            role: 'invalid_role',
            reason: 'Test reason'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('role');
      });

      test('should return 400 for missing reason', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            role: 'moderator'
            // Missing reason
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('reason');
      });

      test('should prevent changing own role', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testAdmin.id}/role`)
          .set(createTestAuthHeader(testAdmin))
          .send(validRoleData)
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('own role');
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/role`)
          .set(createTestAuthHeader(testModerator))
          .send(validRoleData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('PATCH /api/admin/users/:id/status', () => {
      const validStatusData = {
        isActive: false,
        reason: 'Violating community guidelines'
      };

      test('should allow admin to change user status', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/status`)
          .set(createTestAuthHeader(testAdmin))
          .send(validStatusData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user.isActive).toBe(validStatusData.isActive);

        // Verify status was updated in database
        const updatedUser = await getRecordById('users', testUser.id);
        expect(updatedUser.isActive).toBe(validStatusData.isActive);
      });

      test('should allow moderator to deactivate users', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/status`)
          .set(createTestAuthHeader(testModerator))
          .send(validStatusData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.user.isActive).toBe(false);
      });

      test('should return 400 for missing reason when deactivating', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testUser.id}/status`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            isActive: false
            // Missing reason
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('reason');
      });

      test('should prevent changing own status', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${testAdmin.id}/status`)
          .set(createTestAuthHeader(testAdmin))
          .send(validStatusData)
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('own status');
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${otherUser.id}/status`)
          .set(createTestAuthHeader(testUser))
          .send(validStatusData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('DELETE /api/admin/users/:id', () => {
      const validDeletionData = {
        reason: 'Spam account - requested deletion',
        confirmUsername: 'testuser'
      };

      test('should allow admin to delete user account', async () => {
        const response = await request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testAdmin))
          .send(validDeletionData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');

        // Verify user was soft deleted (marked as deleted, not removed)
        const deletedUser = await getRecordById('users', testUser.id);
        expect(deletedUser.isDeleted).toBe(true);
        expect(deletedUser.deletedAt).toBeDefined();
      });

      test('should return 400 for incorrect username confirmation', async () => {
        const response = await request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validDeletionData,
            confirmUsername: 'wrongusername'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('username');
      });

      test('should return 400 for missing reason', async () => {
        const response = await request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            confirmUsername: 'testuser'
            // Missing reason
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('reason');
      });

      test('should prevent deleting own account', async () => {
        const response = await request(app)
          .delete(`/api/admin/users/${testAdmin.id}`)
          .set(createTestAuthHeader(testAdmin))
          .send({
            reason: 'Test deletion',
            confirmUsername: 'admin'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('own account');
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testModerator))
          .send(validDeletionData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // CONTENT MODERATION TESTS
  // ==============================================

  describe('Content Moderation', () => {
    describe('GET /api/admin/reports', () => {
      beforeEach(async () => {
        // Create test reports
        for (let i = 0; i < 5; i++) {
          await supabase.from('reports').insert({
            id: `550e8400-e29b-41d4-a716-44665544000${i}`,
            reporterId: testUser.id,
            reportedUserId: otherUser.id,
            contentType: i % 2 === 0 ? 'forum_post' : 'marketplace_listing',
            contentId: i % 2 === 0 ? testPost.id : testListing.id,
            reason: 'spam',
            description: `Test report ${i}`,
            status: i % 3 === 0 ? 'resolved' : 'pending',
            createdAt: new Date(Date.now() - (i * 3600000))
          });
        }
      });

      test('should get all reports with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/reports')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check report structure
        const report = response.body.data.items[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('reporter');
        expect(report).toHaveProperty('reportedUser');
        expect(report).toHaveProperty('contentType');
        expect(report).toHaveProperty('reason');
        expect(report).toHaveProperty('status');
        expect(report).toHaveProperty('createdAt');
      });

      test('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/admin/reports?status=pending')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(report => {
          expect(report.status).toBe('pending');
        });
      });

      test('should support filtering by content type', async () => {
        const response = await request(app)
          .get('/api/admin/reports?contentType=forum_post')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(report => {
          expect(report.contentType).toBe('forum_post');
        });
      });

      test('should allow moderator access', async () => {
        const response = await request(app)
          .get('/api/admin/reports')
          .set(createTestAuthHeader(testModerator))
          .expect(200);

        validatePaginationResponse(response.body);
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/admin/reports')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('PATCH /api/admin/reports/:id', () => {
      let testReport;

      beforeEach(async () => {
        const { data } = await supabase.from('reports').insert({
          id: '550e8400-e29b-41d4-a716-446655440099',
          reporterId: testUser.id,
          reportedUserId: otherUser.id,
          contentType: 'forum_post',
          contentId: testPost.id,
          reason: 'spam',
          description: 'Test report for moderation',
          status: 'pending'
        }).select().single();
        testReport = data;
      });

      const validResolutionData = {
        status: 'resolved',
        resolution: 'Content removed for violating community guidelines',
        action: 'content_removed'
      };

      test('should allow moderator to resolve report', async () => {
        const response = await request(app)
          .patch(`/api/admin/reports/${testReport.id}`)
          .set(createTestAuthHeader(testModerator))
          .send(validResolutionData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.report.status).toBe('resolved');
        expect(response.body.data.report.resolution).toBe(validResolutionData.resolution);
        expect(response.body.data.report.resolvedBy).toBe(testModerator.id);
        expect(response.body.data.report.resolvedAt).toBeDefined();
      });

      test('should return 400 for invalid status', async () => {
        const response = await request(app)
          .patch(`/api/admin/reports/${testReport.id}`)
          .set(createTestAuthHeader(testModerator))
          .send({
            status: 'invalid_status',
            resolution: 'Test resolution'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('status');
      });

      test('should return 400 for missing resolution when resolving', async () => {
        const response = await request(app)
          .patch(`/api/admin/reports/${testReport.id}`)
          .set(createTestAuthHeader(testModerator))
          .send({
            status: 'resolved'
            // Missing resolution
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('resolution');
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .patch(`/api/admin/reports/${testReport.id}`)
          .set(createTestAuthHeader(testUser))
          .send(validResolutionData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // SYSTEM MANAGEMENT TESTS
  // ==============================================

  describe('System Management', () => {
    describe('GET /api/admin/system/health', () => {
      test('should get system health status', async () => {
        const response = await request(app)
          .get('/api/admin/system/health')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('health');
        expect(response.body.data.health).toHaveProperty('database');
        expect(response.body.data.health).toHaveProperty('storage');
        expect(response.body.data.health).toHaveProperty('email');
        expect(response.body.data.health).toHaveProperty('cache');
        expect(response.body.data.health).toHaveProperty('overallStatus');
        
        // Each service should have status and response time
        Object.values(response.body.data.health).forEach(service => {
          if (typeof service === 'object' && service !== null) {
            expect(service).toHaveProperty('status');
            expect(service).toHaveProperty('responseTime');
          }
        });
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/admin/system/health')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/admin/system/logs', () => {
      test('should get system logs', async () => {
        const response = await request(app)
          .get('/api/admin/system/logs')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        
        // Check log structure if logs exist
        if (response.body.data.items.length > 0) {
          const log = response.body.data.items[0];
          expect(log).toHaveProperty('timestamp');
          expect(log).toHaveProperty('level');
          expect(log).toHaveProperty('message');
          expect(log).toHaveProperty('service');
        }
      });

      test('should support filtering by level', async () => {
        const response = await request(app)
          .get('/api/admin/system/logs?level=error')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(log => {
          expect(log.level).toBe('error');
        });
      });

      test('should support filtering by service', async () => {
        const response = await request(app)
          .get('/api/admin/system/logs?service=auth')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(log => {
          expect(log.service).toBe('auth');
        });
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .get('/api/admin/system/logs')
          .set(createTestAuthHeader(testModerator))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('POST /api/admin/system/maintenance', () => {
      const validMaintenanceData = {
        type: 'scheduled',
        title: 'Database Optimization',
        description: 'Performing routine database optimization and cleanup',
        scheduledStart: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        estimatedDuration: 120, // 2 hours in minutes
        affectedServices: ['database', 'api'],
        notifyUsers: true
      };

      test('should allow admin to schedule maintenance', async () => {
        const response = await request(app)
          .post('/api/admin/system/maintenance')
          .set(createTestAuthHeader(testAdmin))
          .send(validMaintenanceData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.maintenance).toMatchObject({
          type: validMaintenanceData.type,
          title: validMaintenanceData.title,
          description: validMaintenanceData.description,
          affectedServices: validMaintenanceData.affectedServices,
          status: 'scheduled'
        });

        expect(isValidUUID(response.body.data.maintenance.id)).toBe(true);
      });

      test('should return 400 for past scheduled time', async () => {
        const response = await request(app)
          .post('/api/admin/system/maintenance')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validMaintenanceData,
            scheduledStart: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('future');
      });

      test('should return 400 for invalid maintenance type', async () => {
        const response = await request(app)
          .post('/api/admin/system/maintenance')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validMaintenanceData,
            type: 'invalid_type'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('type');
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .post('/api/admin/system/maintenance')
          .set(createTestAuthHeader(testModerator))
          .send(validMaintenanceData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // PLATFORM SETTINGS TESTS
  // ==============================================

  describe('Platform Settings', () => {
    describe('GET /api/admin/settings', () => {
      test('should get platform settings', async () => {
        const response = await request(app)
          .get('/api/admin/settings')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('settings');
        expect(response.body.data.settings).toHaveProperty('general');
        expect(response.body.data.settings).toHaveProperty('security');
        expect(response.body.data.settings).toHaveProperty('email');
        expect(response.body.data.settings).toHaveProperty('features');
        expect(response.body.data.settings).toHaveProperty('limits');
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .get('/api/admin/settings')
          .set(createTestAuthHeader(testModerator))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });

    describe('PUT /api/admin/settings', () => {
      const validSettingsData = {
        general: {
          siteName: 'EV Community Platform',
          siteDescription: 'The premier platform for EV enthusiasts',
          maintenanceMode: false,
          registrationEnabled: true
        },
        security: {
          passwordMinLength: 8,
          requireEmailVerification: true,
          sessionTimeout: 86400,
          maxLoginAttempts: 5
        },
        features: {
          forumEnabled: true,
          marketplaceEnabled: true,
          chargingEnabled: true,
          notificationsEnabled: true
        },
        limits: {
          maxFileSize: 10485760, // 10MB
          maxImagesPerListing: 5,
          maxVehiclesPerUser: 10,
          rateLimitRequests: 100
        }
      };

      test('should allow admin to update settings', async () => {
        const response = await request(app)
          .put('/api/admin/settings')
          .set(createTestAuthHeader(testAdmin))
          .send(validSettingsData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.settings).toMatchObject(validSettingsData);
      });

      test('should return 400 for invalid password length', async () => {
        const response = await request(app)
          .put('/api/admin/settings')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validSettingsData,
            security: {
              ...validSettingsData.security,
              passwordMinLength: 3 // Too short
            }
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('password');
      });

      test('should return 400 for invalid file size limit', async () => {
        const response = await request(app)
          .put('/api/admin/settings')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validSettingsData,
            limits: {
              ...validSettingsData.limits,
              maxFileSize: -1 // Invalid size
            }
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('file size');
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .put('/api/admin/settings')
          .set(createTestAuthHeader(testModerator))
          .send(validSettingsData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // AUDIT LOG TESTS
  // ==============================================

  describe('Audit Logs', () => {
    describe('GET /api/admin/audit', () => {
      beforeEach(async () => {
        // Create test audit logs
        for (let i = 0; i < 10; i++) {
          await supabase.from('audit_logs').insert({
            id: `550e8400-e29b-41d4-a716-44665544010${i}`,
            userId: i % 2 === 0 ? testAdmin.id : testModerator.id,
            action: i % 3 === 0 ? 'user_role_changed' : (i % 3 === 1 ? 'user_deactivated' : 'report_resolved'),
            resourceType: 'user',
            resourceId: testUser.id,
            details: {
              oldValue: 'user',
              newValue: 'moderator',
              reason: `Test action ${i}`
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Test User Agent',
            createdAt: new Date(Date.now() - (i * 3600000))
          });
        }
      });

      test('should get audit logs with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/audit')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check audit log structure
        const log = response.body.data.items[0];
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('user');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('resourceType');
        expect(log).toHaveProperty('resourceId');
        expect(log).toHaveProperty('details');
        expect(log).toHaveProperty('ipAddress');
        expect(log).toHaveProperty('createdAt');
      });

      test('should support filtering by action', async () => {
        const response = await request(app)
          .get('/api/admin/audit?action=user_role_changed')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(log => {
          expect(log.action).toBe('user_role_changed');
        });
      });

      test('should support filtering by user', async () => {
        const response = await request(app)
          .get(`/api/admin/audit?userId=${testAdmin.id}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(log => {
          expect(log.user.id).toBe(testAdmin.id);
        });
      });

      test('should support date range filtering', async () => {
        const fromDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
        const toDate = new Date().toISOString();

        const response = await request(app)
          .get(`/api/admin/audit?fromDate=${fromDate}&toDate=${toDate}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(log => {
          const logDate = new Date(log.createdAt);
          expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
          expect(logDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
        });
      });

      test('should deny access to moderators', async () => {
        const response = await request(app)
          .get('/api/admin/audit')
          .set(createTestAuthHeader(testModerator))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });
});