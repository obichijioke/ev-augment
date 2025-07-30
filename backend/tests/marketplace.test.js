// ==============================================
// EV Community Platform - Marketplace Routes Tests
// ==============================================
// Comprehensive tests for marketplace management routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestMarketplaceListing,
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
  createTestMarketplaceListing,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Marketplace Routes', () => {
  let supabase;
  let testUser;
  let testAdmin;
  let otherUser;
  let testListing;
  let otherListing;

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

    // Create test listings
    testListing = await createTestMarketplaceListing(supabase, testUser.id, {
      title: 'Tesla Model 3 Charger',
      description: 'Portable Tesla charger in excellent condition',
      price: 299.99,
      category: 'charging',
      condition: 'excellent',
      location: 'San Francisco, CA'
    });

    otherListing = await createTestMarketplaceListing(supabase, otherUser.id, {
      title: 'EV Charging Cable',
      description: 'Type 2 charging cable, 5 meters',
      price: 89.99,
      category: 'charging',
      condition: 'good',
      location: 'Los Angeles, CA'
    });
  });

  // ==============================================
  // CREATE LISTING TESTS
  // ==============================================

  describe('POST /api/marketplace/listings', () => {
    const validListingData = {
      title: 'BMW i3 Charging Station',
      description: 'Home charging station for BMW i3. Includes installation guide and all necessary cables. Used for 2 years but in excellent working condition.',
      price: 599.99,
      category: 'charging',
      condition: 'excellent',
      location: 'New York, NY',
      tags: ['bmw', 'charging', 'home'],
      contactMethod: 'email',
      isNegotiable: true
    };

    test('should create a new listing successfully', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send(validListingData)
        .expect(201);

      validateApiResponse(response.body);
      expect(response.body.data.listing).toMatchObject({
        title: validListingData.title,
        description: validListingData.description,
        price: validListingData.price,
        category: validListingData.category,
        condition: validListingData.condition,
        location: validListingData.location,
        tags: validListingData.tags,
        contactMethod: validListingData.contactMethod,
        isNegotiable: validListingData.isNegotiable,
        sellerId: testUser.id,
        status: 'active'
      });

      expect(isValidUUID(response.body.data.listing.id)).toBe(true);
      expect(response.body.data.listing.createdAt).toBeDefined();
      expect(response.body.data.listing.updatedAt).toBeDefined();

      // Verify listing was created in database
      const listingExists = await recordExists('marketplace_listings', {
        id: response.body.data.listing.id
      });
      expect(listingExists).toBe(true);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          title: 'Incomplete Listing'
          // Missing other required fields
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should return 400 for invalid price', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validListingData,
          price: -10 // Invalid price
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('price');
    });

    test('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validListingData,
          category: 'invalid-category'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('category');
    });

    test('should return 400 for invalid condition', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validListingData,
          condition: 'invalid-condition'
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('condition');
    });

    test('should return 400 for description too short', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validListingData,
          description: 'Too short' // Description too short
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('description');
    });

    test('should sanitize and validate input data', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .set(createTestAuthHeader(testUser))
        .send({
          ...validListingData,
          title: '  BMW i3 Charging Station  ',
          location: '  New York, NY  ',
          tags: ['  bmw  ', '  charging  ']
        })
        .expect(201);

      expect(response.body.data.listing.title).toBe('BMW i3 Charging Station');
      expect(response.body.data.listing.location).toBe('New York, NY');
      expect(response.body.data.listing.tags).toEqual(['bmw', 'charging']);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/marketplace/listings')
        .send(validListingData)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // GET LISTINGS TESTS
  // ==============================================

  describe('GET /api/marketplace/listings', () => {
    beforeEach(async () => {
      // Create additional listings for pagination testing
      for (let i = 0; i < 15; i++) {
        await createTestMarketplaceListing(supabase, testUser.id, {
          title: `Test Listing ${i}`,
          description: `Description for test listing ${i}. This is a detailed description.`,
          price: 100 + (i * 10),
          category: i % 2 === 0 ? 'charging' : 'accessories',
          condition: i % 3 === 0 ? 'new' : 'excellent',
          location: 'Test City, ST'
        });
      }
    });

    test('should get marketplace listings with pagination', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings')
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      
      // Check listing structure
      const listing = response.body.data.items[0];
      expect(listing).toHaveProperty('id');
      expect(listing).toHaveProperty('title');
      expect(listing).toHaveProperty('description');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('category');
      expect(listing).toHaveProperty('condition');
      expect(listing).toHaveProperty('location');
      expect(listing).toHaveProperty('seller');
      expect(listing).toHaveProperty('createdAt');
      expect(listing).toHaveProperty('status');
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?page=2&limit=5')
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    test('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?category=charging')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.category).toBe('charging');
      });
    });

    test('should support filtering by condition', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?condition=excellent')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.condition).toBe('excellent');
      });
    });

    test('should support price range filtering', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?minPrice=100&maxPrice=200')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.price).toBeGreaterThanOrEqual(100);
        expect(listing.price).toBeLessThanOrEqual(200);
      });
    });

    test('should support location filtering', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?location=San Francisco')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.location.toLowerCase()).toContain('san francisco');
      });
    });

    test('should support search by title and description', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?search=Tesla')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(
          listing.title.toLowerCase().includes('tesla') ||
          listing.description.toLowerCase().includes('tesla')
        ).toBe(true);
      });
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings?sortBy=price&sortOrder=desc')
        .expect(200);

      validatePaginationResponse(response.body);
      const prices = response.body.data.items.map(listing => listing.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i-1]).toBeGreaterThanOrEqual(prices[i]);
      }
    });

    test('should only show active listings by default', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.status).toBe('active');
      });
    });
  });

  // ==============================================
  // GET LISTING BY ID TESTS
  // ==============================================

  describe('GET /api/marketplace/listings/:id', () => {
    test('should get listing by ID', async () => {
      const response = await request(app)
        .get(`/api/marketplace/listings/${testListing.id}`)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.listing).toMatchObject({
        id: testListing.id,
        title: testListing.title,
        description: testListing.description,
        price: testListing.price,
        category: testListing.category,
        condition: testListing.condition,
        location: testListing.location
      });

      // Should include seller details
      expect(response.body.data.listing.seller).toHaveProperty('username');
      expect(response.body.data.listing.seller).toHaveProperty('avatar');
      expect(response.body.data.listing.seller).not.toHaveProperty('email');
    });

    test('should increment view count', async () => {
      const initialResponse = await request(app)
        .get(`/api/marketplace/listings/${testListing.id}`)
        .expect(200);

      const initialViews = initialResponse.body.data.listing.viewCount || 0;

      const secondResponse = await request(app)
        .get(`/api/marketplace/listings/${testListing.id}`)
        .expect(200);

      expect(secondResponse.body.data.listing.viewCount).toBe(initialViews + 1);
    });

    test('should return 404 for non-existent listing', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Listing not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/marketplace/listings/invalid-id')
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('Invalid listing ID');
    });

    test('should not show inactive listings to non-owners', async () => {
      // Mark listing as inactive
      await supabase
        .from('marketplace_listings')
        .update({ status: 'inactive' })
        .eq('id', testListing.id);

      const response = await request(app)
        .get(`/api/marketplace/listings/${testListing.id}`)
        .expect(404);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // UPDATE LISTING TESTS
  // ==============================================

  describe('PUT /api/marketplace/listings/:id', () => {
    const validUpdateData = {
      title: 'Updated Tesla Charger',
      description: 'Updated description for the Tesla charger. Now includes additional accessories.',
      price: 349.99,
      condition: 'good',
      location: 'Updated Location, CA',
      isNegotiable: false
    };

    test('should update own listing successfully', async () => {
      const response = await request(app)
        .put(`/api/marketplace/listings/${testListing.id}`)
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.listing).toMatchObject({
        id: testListing.id,
        title: validUpdateData.title,
        description: validUpdateData.description,
        price: validUpdateData.price,
        condition: validUpdateData.condition,
        location: validUpdateData.location,
        isNegotiable: validUpdateData.isNegotiable
      });

      // Verify update in database
      const updatedListing = await getRecordById('marketplace_listings', testListing.id);
      expect(updatedListing.title).toBe(validUpdateData.title);
      expect(updatedListing.price).toBe(validUpdateData.price);
    });

    test('should return 403 for updating other user listing', async () => {
      const response = await request(app)
        .put(`/api/marketplace/listings/${otherListing.id}`)
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent listing', async () => {
      const response = await request(app)
        .put('/api/marketplace/listings/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .send(validUpdateData)
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put(`/api/marketplace/listings/${testListing.id}`)
        .set(createTestAuthHeader(testUser))
        .send({
          price: -10, // Invalid price
          condition: 'invalid-condition' // Invalid condition
        })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('validation');
    });

    test('should not allow updating protected fields', async () => {
      const response = await request(app)
        .put(`/api/marketplace/listings/${testListing.id}`)
        .set(createTestAuthHeader(testUser))
        .send({
          id: 'new-id',
          sellerId: 'new-seller-id',
          createdAt: new Date().toISOString()
        })
        .expect(200);

      // Verify protected fields weren't changed
      expect(response.body.data.listing.id).toBe(testListing.id);
      expect(response.body.data.listing.sellerId).toBe(testUser.id);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put(`/api/marketplace/listings/${testListing.id}`)
        .send(validUpdateData)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // DELETE LISTING TESTS
  // ==============================================

  describe('DELETE /api/marketplace/listings/:id', () => {
    test('should delete own listing successfully', async () => {
      const response = await request(app)
        .delete(`/api/marketplace/listings/${testListing.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('deleted');

      // Verify listing was deleted from database
      const deletedListing = await getRecordById('marketplace_listings', testListing.id);
      expect(deletedListing).toBeNull();
    });

    test('should return 403 for deleting other user listing', async () => {
      const response = await request(app)
        .delete(`/api/marketplace/listings/${otherListing.id}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('access');
    });

    test('should return 404 for non-existent listing', async () => {
      const response = await request(app)
        .delete('/api/marketplace/listings/550e8400-e29b-41d4-a716-446655440000')
        .set(createTestAuthHeader(testUser))
        .expect(404);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete(`/api/marketplace/listings/${testListing.id}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // LISTING STATUS TESTS
  // ==============================================

  describe('PATCH /api/marketplace/listings/:id/status', () => {
    test('should update listing status successfully', async () => {
      const response = await request(app)
        .patch(`/api/marketplace/listings/${testListing.id}/status`)
        .set(createTestAuthHeader(testUser))
        .send({ status: 'sold' })
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.listing.status).toBe('sold');

      // Verify status update in database
      const updatedListing = await getRecordById('marketplace_listings', testListing.id);
      expect(updatedListing.status).toBe('sold');
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/marketplace/listings/${testListing.id}/status`)
        .set(createTestAuthHeader(testUser))
        .send({ status: 'invalid-status' })
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('status');
    });

    test('should return 403 for updating other user listing status', async () => {
      const response = await request(app)
        .patch(`/api/marketplace/listings/${otherListing.id}/status`)
        .set(createTestAuthHeader(testUser))
        .send({ status: 'sold' })
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .patch(`/api/marketplace/listings/${testListing.id}/status`)
        .send({ status: 'sold' })
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // LISTING IMAGES TESTS
  // ==============================================

  describe('POST /api/marketplace/listings/:id/images', () => {
    test('should upload listing images', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/marketplace/listings/${testListing.id}/images`)
        .set(createTestAuthHeader(testUser))
        .attach('images', imageBuffer, 'listing1.png')
        .attach('images', imageBuffer, 'listing2.png')
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
        .post(`/api/marketplace/listings/${testListing.id}/images`)
        .set(createTestAuthHeader(testUser))
        .expect(400);

      validateErrorResponse(response.body);
      expect(response.body.message).toContain('file');
    });

    test('should return 403 for other user listing', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/marketplace/listings/${otherListing.id}/images`)
        .set(createTestAuthHeader(testUser))
        .attach('images', imageBuffer, 'listing.png')
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const imageBuffer = createTestImage();
      
      const response = await request(app)
        .post(`/api/marketplace/listings/${testListing.id}/images`)
        .attach('images', imageBuffer, 'listing.png')
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  describe('DELETE /api/marketplace/listings/:id/images/:imageId', () => {
    test('should delete listing image', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/marketplace/listings/${testListing.id}/images/${imageId}`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.message).toContain('removed');
    });

    test('should return 403 for other user listing', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/marketplace/listings/${otherListing.id}/images/${imageId}`)
        .set(createTestAuthHeader(testUser))
        .expect(403);

      validateErrorResponse(response.body);
    });

    test('should return 401 for missing authentication', async () => {
      const imageId = 'test-image-id';
      
      const response = await request(app)
        .delete(`/api/marketplace/listings/${testListing.id}/images/${imageId}`)
        .expect(401);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // USER LISTINGS TESTS
  // ==============================================

  describe('GET /api/marketplace/users/:userId/listings', () => {
    test('should get user listings', async () => {
      const response = await request(app)
        .get(`/api/marketplace/users/${testUser.id}/listings`)
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // All listings should belong to the specified user
      response.body.data.items.forEach(listing => {
        expect(listing.sellerId).toBe(testUser.id);
      });
    });

    test('should only show active listings for other users', async () => {
      // Mark one listing as inactive
      await supabase
        .from('marketplace_listings')
        .update({ status: 'inactive' })
        .eq('id', testListing.id);

      const response = await request(app)
        .get(`/api/marketplace/users/${testUser.id}/listings`)
        .set(createTestAuthHeader(otherUser))
        .expect(200);

      // Should not include inactive listing
      response.body.data.items.forEach(listing => {
        expect(listing.status).toBe('active');
      });
    });

    test('should show all listings for own profile', async () => {
      // Mark one listing as inactive
      await supabase
        .from('marketplace_listings')
        .update({ status: 'inactive' })
        .eq('id', testListing.id);

      const response = await request(app)
        .get(`/api/marketplace/users/${testUser.id}/listings`)
        .set(createTestAuthHeader(testUser))
        .expect(200);

      // Should include inactive listing for own profile
      const inactiveListing = response.body.data.items.find(l => l.id === testListing.id);
      expect(inactiveListing).toBeDefined();
      expect(inactiveListing.status).toBe('inactive');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/marketplace/users/550e8400-e29b-41d4-a716-446655440000/listings')
        .expect(404);

      validateErrorResponse(response.body);
    });
  });

  // ==============================================
  // MARKETPLACE CATEGORIES TESTS
  // ==============================================

  describe('GET /api/marketplace/categories', () => {
    test('should get marketplace categories', async () => {
      const response = await request(app)
        .get('/api/marketplace/categories')
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      
      // Check category structure
      const category = response.body.data.categories[0];
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('listingCount');
    });

    test('should include listing counts in categories', async () => {
      const response = await request(app)
        .get('/api/marketplace/categories')
        .expect(200);

      response.body.data.categories.forEach(category => {
        expect(typeof category.listingCount).toBe('number');
        expect(category.listingCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==============================================
  // MARKETPLACE SEARCH TESTS
  // ==============================================

  describe('GET /api/marketplace/search', () => {
    test('should search listings by query', async () => {
      const response = await request(app)
        .get('/api/marketplace/search?q=Tesla')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(
          listing.title.toLowerCase().includes('tesla') ||
          listing.description.toLowerCase().includes('tesla') ||
          listing.tags.some(tag => tag.toLowerCase().includes('tesla'))
        ).toBe(true);
      });
    });

    test('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/marketplace/search?q=nonexistentitem')
        .expect(200);

      validatePaginationResponse(response.body);
      expect(response.body.data.items).toHaveLength(0);
    });

    test('should support filters in search', async () => {
      const response = await request(app)
        .get('/api/marketplace/search?q=charger&category=charging&maxPrice=500')
        .expect(200);

      validatePaginationResponse(response.body);
      response.body.data.items.forEach(listing => {
        expect(listing.category).toBe('charging');
        expect(listing.price).toBeLessThanOrEqual(500);
      });
    });
  });

  // ==============================================
  // MARKETPLACE STATISTICS TESTS
  // ==============================================

  describe('GET /api/marketplace/stats', () => {
    test('should get marketplace statistics', async () => {
      const response = await request(app)
        .get('/api/marketplace/stats')
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalListings');
      expect(response.body.data.stats).toHaveProperty('activeListings');
      expect(response.body.data.stats).toHaveProperty('averagePrice');
      expect(response.body.data.stats).toHaveProperty('popularCategories');
      expect(response.body.data.stats).toHaveProperty('recentListings');
    });
  });

  // ==============================================
  // ADMIN MARKETPLACE MANAGEMENT TESTS
  // ==============================================

  describe('Admin Marketplace Management', () => {
    describe('GET /api/marketplace/admin/listings', () => {
      test('should allow admin to get all listings', async () => {
        const response = await request(app)
          .get('/api/marketplace/admin/listings')
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items.length).toBeGreaterThan(0);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/marketplace/admin/listings')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });
    });

    describe('DELETE /api/marketplace/admin/listings/:id', () => {
      test('should allow admin to delete any listing', async () => {
        const response = await request(app)
          .delete(`/api/marketplace/admin/listings/${testListing.id}`)
          .set(createTestAuthHeader(testAdmin))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');

        // Verify listing was deleted
        const deletedListing = await getRecordById('marketplace_listings', testListing.id);
        expect(deletedListing).toBeNull();
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .delete(`/api/marketplace/admin/listings/${otherListing.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
      });
    });
  });
});