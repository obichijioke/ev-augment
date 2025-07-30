// ==============================================
// EV Community Platform - Charging Routes Tests
// ==============================================
// Comprehensive tests for charging management routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestChargingSession,
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
  createTestChargingStation,
  createTestChargingSession,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Charging Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;
  let otherUser;
  let testVehicle;
  let testStation;
  let testSession;
  let otherSession;

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

    // Create test vehicle
    testVehicle = await createTestVehicle(supabase, testUser.id, {
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      batteryCapacity: 75
    });

    // Create test charging station
    testStation = await createTestChargingStation(supabase, {
      name: 'Test Supercharger',
      address: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      type: 'supercharger',
      powerOutput: 150,
      connectorTypes: ['CCS', 'CHAdeMO'],
      amenities: ['wifi', 'restroom'],
      operatingHours: '24/7'
    });

    // Create test charging sessions
    testSession = await createTestChargingSession(supabase, testUser.id, testVehicle.id, testStation.id, {
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(),
      energyDelivered: 45.5,
      cost: 12.75,
      startBatteryLevel: 20,
      endBatteryLevel: 80
    });

    otherSession = await createTestChargingSession(supabase, otherUser.id, null, testStation.id, {
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 3600000), // 1 hour ago
      energyDelivered: 30.0,
      cost: 8.50,
      startBatteryLevel: 30,
      endBatteryLevel: 70
    });
  });

  // ==============================================
  // CHARGING STATIONS TESTS
  // ==============================================

  describe('Charging Stations', () => {
    describe('GET /api/charging/stations', () => {
      beforeEach(async () => {
        // Create additional stations for testing
        for (let i = 0; i < 10; i++) {
          await createTestChargingStation(supabase, {
            name: `Test Station ${i}`,
            address: `${100 + i} Test St, Test City, CA`,
            latitude: 37.7749 + (i * 0.01),
            longitude: -122.4194 + (i * 0.01),
            type: i % 2 === 0 ? 'supercharger' : 'level2',
            powerOutput: i % 2 === 0 ? 150 : 22,
            connectorTypes: ['CCS'],
            amenities: ['wifi']
          });
        }
      });

      test('should get charging stations with pagination', async () => {
        const response = await request(app)
          .get('/api/charging/stations')
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check station structure
        const station = response.body.data.items[0];
        expect(station).toHaveProperty('id');
        expect(station).toHaveProperty('name');
        expect(station).toHaveProperty('address');
        expect(station).toHaveProperty('latitude');
        expect(station).toHaveProperty('longitude');
        expect(station).toHaveProperty('type');
        expect(station).toHaveProperty('powerOutput');
        expect(station).toHaveProperty('connectorTypes');
        expect(station).toHaveProperty('amenities');
        expect(station).toHaveProperty('status');
      });

      test('should support location-based filtering', async () => {
        const response = await request(app)
          .get('/api/charging/stations?lat=37.7749&lng=-122.4194&radius=10')
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        
        // All stations should be within the specified radius
        response.body.data.items.forEach(station => {
          const distance = calculateDistance(
            37.7749, -122.4194,
            station.latitude, station.longitude
          );
          expect(distance).toBeLessThanOrEqual(10);
        });
      });

      test('should support filtering by type', async () => {
        const response = await request(app)
          .get('/api/charging/stations?type=supercharger')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(station => {
          expect(station.type).toBe('supercharger');
        });
      });

      test('should support filtering by connector type', async () => {
        const response = await request(app)
          .get('/api/charging/stations?connectorType=CCS')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(station => {
          expect(station.connectorTypes).toContain('CCS');
        });
      });

      test('should support filtering by amenities', async () => {
        const response = await request(app)
          .get('/api/charging/stations?amenities=wifi')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(station => {
          expect(station.amenities).toContain('wifi');
        });
      });

      test('should support power output filtering', async () => {
        const response = await request(app)
          .get('/api/charging/stations?minPower=100')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(station => {
          expect(station.powerOutput).toBeGreaterThanOrEqual(100);
        });
      });

      test('should support search by name and address', async () => {
        const response = await request(app)
          .get('/api/charging/stations?search=Test Supercharger')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(station => {
          expect(
            station.name.toLowerCase().includes('test supercharger') ||
            station.address.toLowerCase().includes('test supercharger')
          ).toBe(true);
        });
      });
    });

    describe('GET /api/charging/stations/:id', () => {
      test('should get charging station by ID', async () => {
        const response = await request(app)
          .get(`/api/charging/stations/${testStation.id}`)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.station).toMatchObject({
          id: testStation.id,
          name: testStation.name,
          address: testStation.address,
          latitude: testStation.latitude,
          longitude: testStation.longitude,
          type: testStation.type,
          powerOutput: testStation.powerOutput,
          connectorTypes: testStation.connectorTypes,
          amenities: testStation.amenities
        });
      });

      test('should include station statistics', async () => {
        const response = await request(app)
          .get(`/api/charging/stations/${testStation.id}`)
          .expect(200);

        expect(response.body.data.station).toHaveProperty('totalSessions');
        expect(response.body.data.station).toHaveProperty('averageSessionDuration');
        expect(response.body.data.station).toHaveProperty('averageEnergyDelivered');
        expect(response.body.data.station).toHaveProperty('rating');
      });

      test('should return 404 for non-existent station', async () => {
        const response = await request(app)
          .get('/api/charging/stations/550e8400-e29b-41d4-a716-446655440000')
          .expect(404);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('Station not found');
      });

      test('should return 400 for invalid UUID format', async () => {
        const response = await request(app)
          .get('/api/charging/stations/invalid-id')
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('Invalid station ID');
      });
    });

    describe('POST /api/charging/stations', () => {
      const validStationData = {
        name: 'New Charging Station',
        address: '456 Oak Ave, Los Angeles, CA',
        latitude: 34.0522,
        longitude: -118.2437,
        type: 'level2',
        powerOutput: 22,
        connectorTypes: ['Type2', 'CCS'],
        amenities: ['wifi', 'restroom', 'shopping'],
        operatingHours: '6:00 AM - 10:00 PM',
        pricing: {
          perKwh: 0.28,
          sessionFee: 1.00
        }
      };

      test('should allow admin to create charging station', async () => {
        const response = await request(app)
          .post('/api/charging/stations')
          .set(createTestAuthHeader(testAdmin))
          .send(validStationData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.station).toMatchObject({
          name: validStationData.name,
          address: validStationData.address,
          latitude: validStationData.latitude,
          longitude: validStationData.longitude,
          type: validStationData.type,
          powerOutput: validStationData.powerOutput,
          connectorTypes: validStationData.connectorTypes,
          amenities: validStationData.amenities,
          operatingHours: validStationData.operatingHours
        });

        expect(isValidUUID(response.body.data.station.id)).toBe(true);
        expect(response.body.data.station.status).toBe('active');

        // Verify station was created in database
        const stationExists = await recordExists('charging_stations', {
          id: response.body.data.station.id
        });
        expect(stationExists).toBe(true);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .post('/api/charging/stations')
          .set(createTestAuthHeader(testUser))
          .send(validStationData)
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/charging/stations')
          .set(createTestAuthHeader(testAdmin))
          .send({
            name: 'Incomplete Station'
            // Missing other required fields
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('validation');
      });

      test('should return 400 for invalid coordinates', async () => {
        const response = await request(app)
          .post('/api/charging/stations')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validStationData,
            latitude: 200, // Invalid latitude
            longitude: -200 // Invalid longitude
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('coordinates');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post('/api/charging/stations')
          .send(validStationData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // CHARGING SESSIONS TESTS
  // ==============================================

  describe('Charging Sessions', () => {
    describe('GET /api/charging/sessions', () => {
      beforeEach(async () => {
        // Create additional sessions for testing
        for (let i = 0; i < 10; i++) {
          await createTestChargingSession(supabase, testUser.id, testVehicle.id, testStation.id, {
            startTime: new Date(Date.now() - (i + 1) * 3600000),
            endTime: new Date(Date.now() - i * 3600000),
            energyDelivered: 20 + (i * 5),
            cost: 5 + (i * 2),
            startBatteryLevel: 20,
            endBatteryLevel: 80
          });
        }
      });

      test('should get user charging sessions with pagination', async () => {
        const response = await request(app)
          .get('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // All sessions should belong to the authenticated user
        response.body.data.items.forEach(session => {
          expect(session.userId).toBe(testUser.id);
        });

        // Check session structure
        const session = response.body.data.items[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('startTime');
        expect(session).toHaveProperty('endTime');
        expect(session).toHaveProperty('energyDelivered');
        expect(session).toHaveProperty('cost');
        expect(session).toHaveProperty('startBatteryLevel');
        expect(session).toHaveProperty('endBatteryLevel');
        expect(session).toHaveProperty('station');
        expect(session).toHaveProperty('vehicle');
      });

      test('should support filtering by date range', async () => {
        const fromDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
        const toDate = new Date().toISOString();

        const response = await request(app)
          .get(`/api/charging/sessions?fromDate=${fromDate}&toDate=${toDate}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(session => {
          const sessionDate = new Date(session.startTime);
          expect(sessionDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
          expect(sessionDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
        });
      });

      test('should support filtering by vehicle', async () => {
        const response = await request(app)
          .get(`/api/charging/sessions?vehicleId=${testVehicle.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(session => {
          expect(session.vehicleId).toBe(testVehicle.id);
        });
      });

      test('should support filtering by station', async () => {
        const response = await request(app)
          .get(`/api/charging/sessions?stationId=${testStation.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(session => {
          expect(session.stationId).toBe(testStation.id);
        });
      });

      test('should support sorting', async () => {
        const response = await request(app)
          .get('/api/charging/sessions?sortBy=startTime&sortOrder=desc')
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validatePaginationResponse(response.body);
        const dates = response.body.data.items.map(session => new Date(session.startTime));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/api/charging/sessions')
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('POST /api/charging/sessions', () => {
      const validSessionData = {
        stationId: null, // Will be set in test
        vehicleId: null, // Will be set in test
        startTime: new Date().toISOString(),
        startBatteryLevel: 25,
        connectorType: 'CCS'
      };

      beforeEach(() => {
        validSessionData.stationId = testStation.id;
        validSessionData.vehicleId = testVehicle.id;
      });

      test('should start a new charging session successfully', async () => {
        const response = await request(app)
          .post('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .send(validSessionData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.session).toMatchObject({
          stationId: validSessionData.stationId,
          vehicleId: validSessionData.vehicleId,
          startBatteryLevel: validSessionData.startBatteryLevel,
          connectorType: validSessionData.connectorType,
          userId: testUser.id,
          status: 'active'
        });

        expect(isValidUUID(response.body.data.session.id)).toBe(true);
        expect(response.body.data.session.startTime).toBeDefined();
        expect(response.body.data.session.endTime).toBeNull();

        // Verify session was created in database
        const sessionExists = await recordExists('charging_sessions', {
          id: response.body.data.session.id
        });
        expect(sessionExists).toBe(true);
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .send({
            stationId: testStation.id
            // Missing other required fields
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('validation');
      });

      test('should return 400 for invalid battery level', async () => {
        const response = await request(app)
          .post('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validSessionData,
            startBatteryLevel: 150 // Invalid battery level
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('battery level');
      });

      test('should return 400 for non-existent station', async () => {
        const response = await request(app)
          .post('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validSessionData,
            stationId: '550e8400-e29b-41d4-a716-446655440000'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('station');
      });

      test('should return 400 for non-owned vehicle', async () => {
        const otherVehicle = await createTestVehicle(supabase, otherUser.id, {
          make: 'Nissan',
          model: 'Leaf',
          year: 2022
        });

        const response = await request(app)
          .post('/api/charging/sessions')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validSessionData,
            vehicleId: otherVehicle.id
          })
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('vehicle');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post('/api/charging/sessions')
          .send(validSessionData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/charging/sessions/:id', () => {
      test('should get own charging session by ID', async () => {
        const response = await request(app)
          .get(`/api/charging/sessions/${testSession.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.session).toMatchObject({
          id: testSession.id,
          userId: testUser.id,
          stationId: testStation.id,
          vehicleId: testVehicle.id
        });

        // Should include station and vehicle details
        expect(response.body.data.session.station).toHaveProperty('name');
        expect(response.body.data.session.vehicle).toHaveProperty('make');
      });

      test('should return 403 for other user session', async () => {
        const response = await request(app)
          .get(`/api/charging/sessions/${otherSession.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('access');
      });

      test('should return 404 for non-existent session', async () => {
        const response = await request(app)
          .get('/api/charging/sessions/550e8400-e29b-41d4-a716-446655440000')
          .set(createTestAuthHeader(testUser))
          .expect(404);

        validateErrorResponse(response.body);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get(`/api/charging/sessions/${testSession.id}`)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('PATCH /api/charging/sessions/:id/end', () => {
      let activeSession;

      beforeEach(async () => {
        // Create an active session
        activeSession = await createTestChargingSession(supabase, testUser.id, testVehicle.id, testStation.id, {
          startTime: new Date(Date.now() - 1800000), // 30 minutes ago
          endTime: null, // Active session
          startBatteryLevel: 30,
          status: 'active'
        });
      });

      const validEndData = {
        endBatteryLevel: 85,
        energyDelivered: 42.5,
        cost: 11.90
      };

      test('should end charging session successfully', async () => {
        const response = await request(app)
          .patch(`/api/charging/sessions/${activeSession.id}/end`)
          .set(createTestAuthHeader(testUser))
          .send(validEndData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.session).toMatchObject({
          id: activeSession.id,
          endBatteryLevel: validEndData.endBatteryLevel,
          energyDelivered: validEndData.energyDelivered,
          cost: validEndData.cost,
          status: 'completed'
        });

        expect(response.body.data.session.endTime).toBeDefined();
        expect(response.body.data.session.duration).toBeGreaterThan(0);

        // Verify session was updated in database
        const updatedSession = await getRecordById('charging_sessions', activeSession.id);
        expect(updatedSession.status).toBe('completed');
        expect(updatedSession.endTime).toBeDefined();
      });

      test('should return 400 for already completed session', async () => {
        const response = await request(app)
          .patch(`/api/charging/sessions/${testSession.id}/end`)
          .set(createTestAuthHeader(testUser))
          .send(validEndData)
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('already completed');
      });

      test('should return 400 for invalid end battery level', async () => {
        const response = await request(app)
          .patch(`/api/charging/sessions/${activeSession.id}/end`)
          .set(createTestAuthHeader(testUser))
          .send({
            ...validEndData,
            endBatteryLevel: 20 // Less than start level
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('battery level');
      });

      test('should return 403 for other user session', async () => {
        const response = await request(app)
          .patch(`/api/charging/sessions/${activeSession.id}/end`)
          .set(createTestAuthHeader(otherUser))
          .send(validEndData)
          .expect(403);

        validateErrorResponse(response.body);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .patch(`/api/charging/sessions/${activeSession.id}/end`)
          .send(validEndData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // CHARGING ANALYTICS TESTS
  // ==============================================

  describe('Charging Analytics', () => {
    describe('GET /api/charging/analytics', () => {
      test('should get user charging analytics', async () => {
        const response = await request(app)
          .get('/api/charging/analytics')
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('analytics');
        expect(response.body.data.analytics).toHaveProperty('totalSessions');
        expect(response.body.data.analytics).toHaveProperty('totalEnergyDelivered');
        expect(response.body.data.analytics).toHaveProperty('totalCost');
        expect(response.body.data.analytics).toHaveProperty('averageSessionDuration');
        expect(response.body.data.analytics).toHaveProperty('averageEnergyPerSession');
        expect(response.body.data.analytics).toHaveProperty('mostUsedStations');
        expect(response.body.data.analytics).toHaveProperty('chargingTrends');
      });

      test('should support date range filtering', async () => {
        const fromDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
        const toDate = new Date().toISOString();

        const response = await request(app)
          .get(`/api/charging/analytics?fromDate=${fromDate}&toDate=${toDate}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.analytics).toHaveProperty('totalSessions');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/api/charging/analytics')
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/charging/analytics/stations/:id', () => {
      test('should get station analytics', async () => {
        const response = await request(app)
          .get(`/api/charging/analytics/stations/${testStation.id}`)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data).toHaveProperty('analytics');
        expect(response.body.data.analytics).toHaveProperty('totalSessions');
        expect(response.body.data.analytics).toHaveProperty('totalEnergyDelivered');
        expect(response.body.data.analytics).toHaveProperty('averageSessionDuration');
        expect(response.body.data.analytics).toHaveProperty('peakUsageHours');
        expect(response.body.data.analytics).toHaveProperty('utilizationRate');
      });

      test('should return 404 for non-existent station', async () => {
        const response = await request(app)
          .get('/api/charging/analytics/stations/550e8400-e29b-41d4-a716-446655440000')
          .expect(404);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // CHARGING STATION REVIEWS TESTS
  // ==============================================

  describe('Charging Station Reviews', () => {
    describe('POST /api/charging/stations/:id/reviews', () => {
      const validReviewData = {
        rating: 4,
        comment: 'Great charging station with fast charging speeds and clean facilities.',
        tags: ['fast', 'clean', 'reliable']
      };

      test('should create station review successfully', async () => {
        const response = await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .set(createTestAuthHeader(testUser))
          .send(validReviewData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.review).toMatchObject({
          rating: validReviewData.rating,
          comment: validReviewData.comment,
          tags: validReviewData.tags,
          stationId: testStation.id,
          userId: testUser.id
        });

        expect(isValidUUID(response.body.data.review.id)).toBe(true);
        expect(response.body.data.review.createdAt).toBeDefined();
      });

      test('should return 400 for invalid rating', async () => {
        const response = await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .set(createTestAuthHeader(testUser))
          .send({
            ...validReviewData,
            rating: 6 // Invalid rating (should be 1-5)
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('rating');
      });

      test('should return 400 for comment too short', async () => {
        const response = await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .set(createTestAuthHeader(testUser))
          .send({
            ...validReviewData,
            comment: 'Too short'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('comment');
      });

      test('should return 409 for duplicate review', async () => {
        // First review
        await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .set(createTestAuthHeader(testUser))
          .send(validReviewData)
          .expect(201);

        // Duplicate review
        const response = await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .set(createTestAuthHeader(testUser))
          .send(validReviewData)
          .expect(409);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('already reviewed');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post(`/api/charging/stations/${testStation.id}/reviews`)
          .send(validReviewData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/charging/stations/:id/reviews', () => {
      test('should get station reviews', async () => {
        const response = await request(app)
          .get(`/api/charging/stations/${testStation.id}/reviews`)
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
      });

      test('should support pagination and sorting', async () => {
        const response = await request(app)
          .get(`/api/charging/stations/${testStation.id}/reviews?page=1&limit=5&sortBy=createdAt&sortOrder=desc`)
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
      });
    });
  });

  // ==============================================
  // ADMIN CHARGING MANAGEMENT TESTS
  // ==============================================

  describe('Admin Charging Management', () => {
    describe('GET /api/charging/admin/sessions', () => {
      test('should allow admin to get all sessions', async () => {
        const response = await request(app)
          .get('/api/charging/admin/sessions')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items.length).toBeGreaterThan(0);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/charging/admin/sessions')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });
    });

    describe('PUT /api/charging/admin/stations/:id', () => {
      const validUpdateData = {
        name: 'Updated Station Name',
        status: 'maintenance',
        powerOutput: 175
      };

      test('should allow admin to update station', async () => {
        const response = await request(app)
          .put(`/api/charging/admin/stations/${testStation.id}`)
          .set(createTestAuthHeader(testAdmin))
          .send(validUpdateData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.station.name).toBe(validUpdateData.name);
        expect(response.body.data.station.status).toBe(validUpdateData.status);
        expect(response.body.data.station.powerOutput).toBe(validUpdateData.powerOutput);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .put(`/api/charging/admin/stations/${testStation.id}`)
          .set(createTestAuthHeader(testUser))
          .send(validUpdateData)
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });
});

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}