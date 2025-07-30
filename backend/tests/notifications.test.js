// ==============================================
// EV Community Platform - Notifications Routes Tests
// ==============================================
// Comprehensive tests for notification management routes

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
  createTestNotification,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Notifications Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;
  let otherUser;
  let testNotification;
  let otherNotification;

  beforeAll(async () => {
    supabase = getTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    
    // Create test users
    testUser = await createTestUser(supabase, {
      email: 'testuser@example.com',
      username: 'testuser',
      role: 'user'
    });

    testAdmin = await createTestUser(supabase, {
      email: 'testadmin@example.com',
      username: 'testadmin',
      role: 'admin'
    });

    otherUser = await createTestUser(supabase, {
      email: 'otheruser@example.com',
      username: 'otheruser',
      role: 'user'
    });

    // Create test notifications
    testNotification = await createTestNotification(supabase, testUser.id, {
      type: 'forum_reply',
      title: 'New Reply to Your Post',
      message: 'Someone replied to your forum post "Best EV Charging Tips"',
      data: {
        postId: '550e8400-e29b-41d4-a716-446655440001',
        replyId: '550e8400-e29b-41d4-a716-446655440002',
        authorName: 'John Doe'
      },
      priority: 'medium',
      isRead: false
    });

    otherNotification = await createTestNotification(supabase, otherUser.id, {
      type: 'system_update',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur on Sunday at 2 AM PST',
      data: {
        maintenanceDate: '2024-01-15T10:00:00Z',
        duration: '2 hours'
      },
      priority: 'high',
      isRead: false
    });
  });

  // ==============================================
  // NOTIFICATIONS RETRIEVAL TESTS
  // ==============================================

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create additional notifications for testing
      for (let i = 0; i < 10; i++) {
        await createTestNotification(supabase, testUser.id, {
          type: i % 2 === 0 ? 'forum_like' : 'marketplace_message',
          title: `Test Notification ${i}`,
          message: `This is test notification number ${i}`,
          data: { testData: `value${i}` },
          priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
          isRead: i % 4 === 0,
          createdAt: new Date(Date.now() - (i * 3600000)) // Spread over hours
        });
      }
    });

    test('should get user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      
      // All notifications should belong to the authenticated user
      response.body.data.items.forEach(notification => {
        expect(notification.userId).toBe(testUser.id);
      });

      // Check notification structure
      const notification = response.body.data.items[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('data');
      expect(notification).toHaveProperty('priority');
      expect(notification).toHaveProperty('isRead');
      expect(notification).toHaveProperty('createdAt');
    });

    test('should support filtering by read status', async () => {
      const response = await request(app)
        .get('/api/notifications?isRead=false')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(notification => {
        expect(notification.isRead).toBe(false);
      });
    });

    test('should support filtering by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=forum_like')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(notification => {
        expect(notification.type).toBe('forum_like');
      });
    });

    test('should support filtering by priority', async () => {
      const response = await request(app)
        .get('/api/notifications?priority=high')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(notification => {
        expect(notification.priority).toBe('high');
      });
    });

    test('should support date range filtering', async () => {
      const fromDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
      const toDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/notifications?fromDate=${fromDate}&toDate=${toDate}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(notification => {
        const notificationDate = new Date(notification.createdAt);
        expect(notificationDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
        expect(notificationDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
      });
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/notifications?sortBy=createdAt&sortOrder=desc')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      const dates = response.body.data.items.map(notification => new Date(notification.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });

    test('should include unread count in response', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      expect(response.body.data).toHaveProperty('unreadCount');
      expect(typeof response.body.data.unreadCount).toBe('number');
      expect(response.body.data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('GET /api/notifications/:id', () => {
    test('should get own notification by ID', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.notification).toMatchObject({
        id: testNotification.id,
        userId: testUser.id,
        type: testNotification.type,
        title: testNotification.title,
        message: testNotification.message,
        priority: testNotification.priority
      });
    });

    test('should return 403 for other user notification', async () => {
      const response = await request(app)
        .get(`/api/notifications/${otherNotification.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/notifications/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/notifications/invalid-id')
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid notification ID');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // NOTIFICATION ACTIONS TESTS
  // ==============================================

  describe('PATCH /api/notifications/:id/read', () => {
    test('should mark notification as read', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.notification.isRead).toBe(true);
      expect(response.body.data.notification.readAt).toBeDefined();

      // Verify notification was updated in database
      const updatedNotification = await getRecordById('notifications', testNotification.id);
      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.readAt).toBeDefined();
    });

    test('should handle already read notification', async () => {
      // Mark as read first
      await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      // Try to mark as read again
      const response = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.notification.isRead).toBe(true);
    });

    test('should return 403 for other user notification', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${otherNotification.id}/read`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .patch('/api/notifications/550e8400-e29b-41d4-a716-446655440000/read')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      for (let i = 0; i < 5; i++) {
        await createTestNotification(supabase, testUser.id, {
          type: 'system_update',
          title: `Unread Notification ${i}`,
          message: `This is unread notification ${i}`,
          isRead: false
        });
      }
    });

    test('should mark all notifications as read', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('updatedCount');
      expect(response.body.data.updatedCount).toBeGreaterThan(0);

      // Verify all user notifications are now read
      const unreadCount = await countRecords('notifications', {
        userId: testUser.id,
        isRead: false
      });
      expect(unreadCount).toBe(0);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('should delete own notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('deleted');

      // Verify notification was deleted from database
      const notificationExists = await recordExists('notifications', {
        id: testNotification.id
      });
      expect(notificationExists).toBe(false);
    });

    test('should return 403 for other user notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${otherNotification.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .delete('/api/notifications/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('DELETE /api/notifications/clear-all', () => {
    beforeEach(async () => {
      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await createTestNotification(supabase, testUser.id, {
          type: 'system_update',
          title: `Notification ${i}`,
          message: `This is notification ${i}`,
          isRead: i % 2 === 0
        });
      }
    });

    test('should clear all notifications', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('deletedCount');
      expect(response.body.data.deletedCount).toBeGreaterThan(0);

      // Verify all user notifications are deleted
      const notificationCount = await countRecords('notifications', {
        userId: testUser.id
      });
      expect(notificationCount).toBe(0);
    });

    test('should support filtering by read status', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all?onlyRead=true')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      
      // Verify only read notifications are deleted
      const remainingNotifications = await countRecords('notifications', {
        userId: testUser.id
      });
      const unreadNotifications = await countRecords('notifications', {
        userId: testUser.id,
        isRead: false
      });
      
      expect(remainingNotifications).toBe(unreadNotifications);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // NOTIFICATION PREFERENCES TESTS
  // ==============================================

  describe('Notification Preferences', () => {
    describe('GET /api/notifications/preferences', () => {
      test('should get user notification preferences', async () => {
        const response = await request(app)
          .get('/api/notifications/preferences')
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('preferences');
        expect(response.body.data.preferences).toHaveProperty('email');
        expect(response.body.data.preferences).toHaveProperty('push');
        expect(response.body.data.preferences).toHaveProperty('inApp');
        expect(response.body.data.preferences).toHaveProperty('types');
        
        // Check notification types preferences
        const types = response.body.data.preferences.types;
        expect(types).toHaveProperty('forum_reply');
        expect(types).toHaveProperty('forum_like');
        expect(types).toHaveProperty('marketplace_message');
        expect(types).toHaveProperty('charging_session');
        expect(types).toHaveProperty('system_update');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/api/notifications/preferences')
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('PUT /api/notifications/preferences', () => {
      const validPreferences = {
        email: {
          enabled: true,
          frequency: 'immediate'
        },
        push: {
          enabled: true,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        },
        inApp: {
          enabled: true
        },
        types: {
          forum_reply: { email: true, push: true, inApp: true },
          forum_like: { email: false, push: true, inApp: true },
          marketplace_message: { email: true, push: true, inApp: true },
          charging_session: { email: true, push: false, inApp: true },
          system_update: { email: true, push: true, inApp: true }
        }
      };

      test('should update notification preferences successfully', async () => {
        const response = await request(app)
          .put('/api/notifications/preferences')
          .set(createTestAuthHeader(testUser))
          .send(validPreferences)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.preferences).toMatchObject(validPreferences);

        // Verify preferences were updated in database
        const userRecord = await getRecordById('users', testUser.id);
        expect(userRecord.notificationPreferences).toMatchObject(validPreferences);
      });

      test('should return 400 for invalid frequency', async () => {
        const response = await request(app)
          .put('/api/notifications/preferences')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPreferences,
            email: {
              enabled: true,
              frequency: 'invalid_frequency'
            }
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('frequency');
      });

      test('should return 400 for invalid quiet hours', async () => {
        const response = await request(app)
          .put('/api/notifications/preferences')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPreferences,
            push: {
              enabled: true,
              quietHours: {
                enabled: true,
                start: '25:00', // Invalid time
                end: '08:00'
              }
            }
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('time');
      });

      test('should return 400 for missing notification types', async () => {
        const response = await request(app)
          .put('/api/notifications/preferences')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPreferences,
            types: {
              forum_reply: { email: true, push: true, inApp: true }
              // Missing other required types
            }
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('types');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .put('/api/notifications/preferences')
          .send(validPreferences)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // NOTIFICATION CREATION TESTS (ADMIN)
  // ==============================================

  describe('POST /api/notifications/send', () => {
    const validNotificationData = {
      type: 'system_announcement',
      title: 'New Feature Available',
      message: 'We have released a new charging analytics feature. Check it out!',
      data: {
        featureName: 'Charging Analytics',
        url: '/charging/analytics'
      },
      priority: 'medium',
      recipients: {
        type: 'all' // or 'users', 'role', 'specific'
      }
    };

    test('should allow admin to send notification to all users', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send(validNotificationData)
        .expect(201);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('sentCount');
      expect(response.body.data.sentCount).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('notificationId');
      expect(isValidUUID(response.body.data.notificationId)).toBe(true);

      // Verify notifications were created for users
      const notificationCount = await countRecords('notifications', {
        type: validNotificationData.type,
        title: validNotificationData.title
      });
      expect(notificationCount).toBeGreaterThan(0);
    });

    test('should allow admin to send notification to specific users', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          ...validNotificationData,
          recipients: {
            type: 'specific',
            userIds: [testUser.id, otherUser.id]
          }
        })
        .expect(201);

      validateApiResponse(response.body);
      expect(response.body.data.sentCount).toBe(2);

      // Verify notifications were created for specific users
      const testUserNotification = await recordExists('notifications', {
        userId: testUser.id,
        type: validNotificationData.type,
        title: validNotificationData.title
      });
      const otherUserNotification = await recordExists('notifications', {
        userId: otherUser.id,
        type: validNotificationData.type,
        title: validNotificationData.title
      });
      
      expect(testUserNotification).toBe(true);
      expect(otherUserNotification).toBe(true);
    });

    test('should allow admin to send notification by role', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          ...validNotificationData,
          recipients: {
            type: 'role',
            role: 'user'
          }
        })
        .expect(201);

      validateApiResponse(response.body);
      expect(response.body.data.sentCount).toBeGreaterThan(0);
    });

    test('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testUser))
        .send(validNotificationData)
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('admin');
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          title: 'Incomplete Notification'
          // Missing other required fields
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should return 400 for invalid priority', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          ...validNotificationData,
          priority: 'invalid_priority'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('priority');
    });

    test('should return 400 for invalid recipient type', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          ...validNotificationData,
          recipients: {
            type: 'invalid_type'
          }
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('recipient');
    });

    test('should return 400 for specific recipients without userIds', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set(createTestAuthHeader(testAdmin))
        .send({
          ...validNotificationData,
          recipients: {
            type: 'specific'
            // Missing userIds
          }
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('userIds');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .send(validNotificationData)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // NOTIFICATION STATISTICS TESTS
  // ==============================================

  describe('GET /api/notifications/stats', () => {
    beforeEach(async () => {
      // Create notifications with different statuses
      for (let i = 0; i < 10; i++) {
        await createTestNotification(supabase, testUser.id, {
          type: i % 2 === 0 ? 'forum_reply' : 'system_update',
          title: `Stat Test Notification ${i}`,
          message: `This is notification ${i}`,
          priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
          isRead: i % 3 === 0,
          createdAt: new Date(Date.now() - (i * 86400000)) // Spread over days
        });
      }
    });

    test('should get user notification statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('total');
      expect(response.body.data.stats).toHaveProperty('unread');
      expect(response.body.data.stats).toHaveProperty('byType');
      expect(response.body.data.stats).toHaveProperty('byPriority');
      expect(response.body.data.stats).toHaveProperty('recentActivity');
      
      // Check statistics structure
      expect(response.body.data.stats.total).toBeGreaterThan(0);
      expect(response.body.data.stats.unread).toBeGreaterThanOrEqual(0);
      expect(response.body.data.stats.byType).toBeInstanceOf(Object);
      expect(response.body.data.stats.byPriority).toBeInstanceOf(Object);
      expect(response.body.data.stats.recentActivity).toBeInstanceOf(Array);
    });

    test('should support date range filtering', async () => {
      const fromDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
      const toDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/notifications/stats?fromDate=${fromDate}&toDate=${toDate}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.stats).toHaveProperty('total');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // ADMIN NOTIFICATION MANAGEMENT TESTS
  // ==============================================

  describe('Admin Notification Management', () => {
    describe('GET /api/notifications/admin/stats', () => {
      test('should allow admin to get global notification statistics', async () => {
        const response = await request(app)
          .get('/api/notifications/admin/stats')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('stats');
        expect(response.body.data.stats).toHaveProperty('totalNotifications');
        expect(response.body.data.stats).toHaveProperty('totalUsers');
        expect(response.body.data.stats).toHaveProperty('deliveryStats');
        expect(response.body.data.stats).toHaveProperty('typeDistribution');
        expect(response.body.data.stats).toHaveProperty('engagementMetrics');
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/notifications/admin/stats')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });
    });

    describe('GET /api/notifications/admin/users/:userId', () => {
      test('should allow admin to get user notifications', async () => {
        const response = await request(app)
          .get(`/api/notifications/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(notification => {
          expect(notification.userId).toBe(testUser.id);
        });
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get(`/api/notifications/admin/users/${testUser.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });
});