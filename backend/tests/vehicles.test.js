// ==============================================
// EV Community Platform - Vehicle Routes Tests
// ==============================================
// Comprehensive tests for vehicle management routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestVehicle,
  createTestAuthHeader,
  validateApiResponse,
  validateErrorResponse,
  validatePaginationResponse,
  isValidUUID,
  createTestImage,
  generateRandomString
} = require('./utils');
const {
  getTestDatabase,
  resetTestDatabase,
  createTestUser,
  createTestVehicle,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Vehicle Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;
  let otherUser;
  let testVehicle;
  let otherVehicle;

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

    // Create test vehicles
    testVehicle = await createTestVehicle(supabase, testUser.id, {
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      nickname: 'My Tesla'
    });

    otherVehicle = await createTestVehicle(supabase, otherUser.id, {
      make: 'Nissan',
      model: 'Leaf',
      year: 2022,
      nickname: 'Green Leaf'
    });
  });

  // ==============================================
  // CREATE VEHICLE TESTS
  // ==============================================

  describe('POST /api/vehicles', () => {
    const validVehicleData = {
      make: 'BMW',
      model: 'iX',
      year: 2024,
      trim: 'xDrive50',
      color: 'Storm Bay',
      batteryCapacity: 111.5,
      range: 324,
      efficiency: 3.8,
      chargingType: 'CCS',
      vin: 'WBAJA1C00PCG12345',
      licensePlate: 'BMW-IX-1',
      nickname: 'My BMW iX',
      isPublic: true
    };

    test('should create a new vehicle successfully', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send(validVehicleData)
        .expect(201);

      validateApiResponse(response.body);
      expect(response.body.data.vehicle).toMatchObject({
        make: validVehicleData.make,
        model: validVehicleData.model,
        year: validVehicleData.year,
        trim: validVehicleData.trim,
        color: validVehicleData.color,
        batteryCapacity: validVehicleData.batteryCapacity,
        range: validVehicleData.range,
        efficiency: validVehicleData.efficiency,
        chargingType: validVehicleData.chargingType,
        vin: validVehicleData.vin,
        licensePlate: validVehicleData.licensePlate,
        nickname: validVehicleData.nickname,
        isPublic: validVehicleData.isPublic,
        userId: testUser.id
      });

      expect(isValidUUID(response.body.data.vehicle.id)).toBe(true);
      expect(response.body.data.vehicle.createdAt).toBeDefined();
      expect(response.body.data.vehicle.updatedAt).toBeDefined();

      // Verify vehicle was created in database
      const vehicleExists = await recordExists('vehicles', {
        id: response.body.data.vehicle.id
      });
      expect(vehicleExists).toBe(true);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          make: 'Tesla'
          // Missing other required fields
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should return 400 for invalid year', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validVehicleData,
          year: 1800 // Invalid year
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('year');
    });

    test('should return 400 for invalid battery capacity', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validVehicleData,
          batteryCapacity: -10 // Invalid capacity
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('battery');
    });

    test('should return 400 for invalid VIN format', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validVehicleData,
          vin: 'INVALID-VIN' // Invalid VIN format
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('VIN');
    });

    test('should return 409 for duplicate VIN', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validVehicleData,
          vin: testVehicle.vin
        })
        .expect(409);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('VIN already exists');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(validVehicleData)
        .expect(401);

      validateErrorResponse(response.body);
    });

    test('should sanitize and validate input data', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validVehicleData,
          make: '  BMW  ',
          model: '  iX  ',
          color: '  Storm Bay  ',
          nickname: '  My BMW iX  '
        })
        .expect(201);

      expect(response.body.data.vehicle.make).toBe('BMW');
      expect(response.body.data.vehicle.model).toBe('iX');
      expect(response.body.data.vehicle.color).toBe('Storm Bay');
      expect(response.body.data.vehicle.nickname).toBe('My BMW iX');
    });
  });

  // ==============================================
  // GET VEHICLES TESTS
  // ==============================================

  describe('GET /api/vehicles', () => {
    beforeEach(async () => {
      // Create additional vehicles for pagination testing
      for (let i = 0; i < 15; i++) {
        await createTestVehicle(supabase, testUser.id, {
          make: 'Tesla',
          model: 'Model S',
          year: 2020 + (i % 4),
          nickname: `Vehicle ${i}`
        });
      }
    });

    test('should get user vehicles with pagination', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      
      // All vehicles should belong to the authenticated user
      response.body.data.items.forEach(vehicle => {
        expect(vehicle.userId).toBe(testUser.id);
      });
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/vehicles?page=2&limit=5')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    test('should support filtering by make', async () => {
      const response = await request(app)
        .get('/api/vehicles?make=Tesla')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(vehicle => {
        expect(vehicle.make).toBe('Tesla');
      });
    });

    test('should support filtering by year range', async () => {
      const response = await request(app)
        .get('/api/vehicles?yearFrom=2022&yearTo=2023')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(vehicle => {
        expect(vehicle.year).toBeGreaterThanOrEqual(2022);
        expect(vehicle.year).toBeLessThanOrEqual(2023);
      });
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/vehicles?sortBy=year&sortOrder=desc')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validatePaginationResponse(response.body);
      const years = response.body.data.items.map(vehicle => vehicle.year);
      const sortedYears = [...years].sort((a, b) => b - a);
      expect(years).toEqual(sortedYears);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // GET VEHICLE BY ID TESTS
  // ==============================================

  describe('GET /api/vehicles/:id', () => {
    test('should get own vehicle by ID', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${testVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.vehicle).toMatchObject({
        id: testVehicle.id,
        make: testVehicle.make,
        model: testVehicle.model,
        year: testVehicle.year,
        userId: testUser.id
      });
    });

    test('should get public vehicle by ID from other user', async () => {
      // Update other vehicle to be public
      await supabase
        .from('vehicles')
        .update({ isPublic: true })
        .eq('id', otherVehicle.id);

      const response = await request(app)
        .get(`/api/vehicles/${otherVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.vehicle.id).toBe(otherVehicle.id);
      expect(response.body.data.vehicle.userId).toBe(otherUser.id);
    });

    test('should return 403 for private vehicle from other user', async () => {
      // Ensure other vehicle is private
      await supabase
        .from('vehicles')
        .update({ isPublic: false })
        .eq('id', otherVehicle.id);

      const response = await request(app)
        .get(`/api/vehicles/${otherVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Vehicle not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/vehicles/invalid-id')
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid vehicle ID');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${testVehicle.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // UPDATE VEHICLE TESTS
  // ==============================================

  describe('PUT /api/vehicles/:id', () => {
    const validUpdateData = {
      nickname: 'Updated Nickname',
      color: 'Updated Color',
      batteryCapacity: 80.0,
      range: 400,
      efficiency: 4.0,
      isPublic: false
    };

    test('should update own vehicle successfully', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${testVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.vehicle).toMatchObject({
        id: testVehicle.id,
        nickname: validUpdateData.nickname,
        color: validUpdateData.color,
        batteryCapacity: validUpdateData.batteryCapacity,
        range: validUpdateData.range,
        efficiency: validUpdateData.efficiency,
        isPublic: validUpdateData.isPublic
      });

      // Verify update in database
      const updatedVehicle = await getRecordById('vehicles', testVehicle.id);
      expect(updatedVehicle.nickname).toBe(validUpdateData.nickname);
      expect(updatedVehicle.color).toBe(validUpdateData.color);
    });

    test('should return 403 for updating other user vehicle', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${otherVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .put('/api/vehicles/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${testVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .send({
          batteryCapacity: -10, // Invalid capacity
          year: 1800 // Invalid year
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should not allow updating protected fields', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${testVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .send({
          id: 'new-id',
          userId: 'new-user-id',
          createdAt: new Date().toISOString()
        })
        .expect(200);

      // Verify protected fields weren't changed
      expect(response.body.data.vehicle.id).toBe(testVehicle.id);
      expect(response.body.data.vehicle.userId).toBe(testUser.id);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${testVehicle.id}`)
        .send(validUpdateData)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // DELETE VEHICLE TESTS
  // ==============================================

  describe('DELETE /api/vehicles/:id', () => {
    test('should delete own vehicle successfully', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${testVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('deleted');

      // Verify vehicle was deleted from database
      const deletedVehicle = await getRecordById('vehicles', testVehicle.id);
      expect(deletedVehicle).toBeNull();
    });

    test('should return 403 for deleting other user vehicle', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${otherVehicle.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .delete('/api/vehicles/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${testVehicle.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // VEHICLE IMAGES TESTS
  // ==============================================

  describe('POST /api/vehicles/:id/images', () => {
    test('should upload vehicle images', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/vehicles/${testVehicle.id}/images`)
        .set(createTestAuthHeader(testUser))
        .attach('images', imageBuffer, 'vehicle1.png')
        .attach('images', imageBuffer, 'vehicle2.png')
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.images).toBeInstanceOf(Array);
      expect(response.body.data.images.length).toBe(2);
      response.body.data.images.forEach(image => {
        expect(image).toHaveProperty('url');
        expect(image.url).toMatch(/^https?:\/\/.+/);
      });
    });

    test('should return 400 for missing files', async () => {
      const response = await request(app)
        .post(`/api/vehicles/${testVehicle.id}/images`)
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('file');
    });

    test('should return 403 for other user vehicle', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/vehicles/${otherVehicle.id}/images`)
        .set(createTestAuthHeader(testUser))
        .attach('images', imageBuffer, 'vehicle.png')
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/vehicles/${testVehicle.id}/images`)
        .attach('images', imageBuffer, 'vehicle.png')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('DELETE /api/vehicles/:id/images/:imageId', () => {
    test('should delete vehicle image', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/vehicles/${testVehicle.id}/images/${imageId}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('removed');
    });

    test('should return 403 for other user vehicle', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/vehicles/${otherVehicle.id}/images/${imageId}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/vehicles/${testVehicle.id}/images/${imageId}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // PUBLIC VEHICLES TESTS
  // ==============================================

  describe('GET /api/vehicles/public', () => {
    beforeEach(async () => {
      // Create public vehicles
      for (let i = 0; i < 10; i++) {
        await createTestVehicle(supabase, testUser.id, {
          make: 'Tesla',
          model: 'Model Y',
          year: 2023,
          nickname: `Public Vehicle ${i}`,
          isPublic: true
        });
      }
    });

    test('should get public vehicles without authentication', async () => {
      const response = await request(app)
        .get('/api/vehicles/public')
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // All vehicles should be public
      response.body.data.items.forEach(vehicle => {
        expect(vehicle.isPublic).toBe(true);
      });
    });

    test('should support filtering and pagination', async () => {
      const response = await request(app)
        .get('/api/vehicles/public?make=Tesla&limit=5')
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.limit).toBe(5);
      response.body.data.items.forEach(vehicle => {
        expect(vehicle.make).toBe('Tesla');
        expect(vehicle.isPublic).toBe(true);
      });
    });
  });

  // ==============================================
  // VEHICLE STATISTICS TESTS
  // ==============================================

  describe('GET /api/vehicles/stats', () => {
    test('should get vehicle statistics', async () => {
      const response = await request(app)
        .get('/api/vehicles/stats')
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalVehicles');
      expect(response.body.data.stats).toHaveProperty('averageRange');
      expect(response.body.data.stats).toHaveProperty('popularMakes');
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/vehicles/stats')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // ADMIN VEHICLE MANAGEMENT TESTS
  // ==============================================

  describe('Admin Vehicle Management', () => {
    describe('GET /api/vehicles/admin/all', () => {
      test('should allow admin to get all vehicles', async () => {
        const response = await request(app)
          .get('/api/vehicles/admin/all')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items.length).toBeGreaterThan(0);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/vehicles/admin/all')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });
    });

    describe('DELETE /api/vehicles/admin/:id', () => {
      test('should allow admin to delete any vehicle', async () => {
        const response = await request(app)
          .delete(`/api/vehicles/admin/${testVehicle.id}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');

        // Verify vehicle was deleted
        const deletedVehicle = await getRecordById('vehicles', testVehicle.id);
        expect(deletedVehicle).toBeNull();
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .delete(`/api/vehicles/admin/${otherVehicle.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });
});