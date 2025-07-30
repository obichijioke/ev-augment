// ==============================================
// EV Community Platform - Forum Routes Tests
// ==============================================
// Comprehensive tests for forum management routes

const request = require('supertest');
const app = require('../src/app');
const {
  generateTestUser,
  generateTestForumPost,
  generateTestComment,
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
  createTestForumCategory,
  createTestForumPost,
  createTestComment,
  recordExists,
  getRecordById,
  countRecords
} = require('./database');

// ==============================================
// TEST SETUP
// ==============================================

describe('Forum Routes', () => {
  let supabase;
  let testUser;
  let testModerator;
  let testAdmin;
  let otherUser;
  let testCategory;
  let testPost;
  let otherPost;
  let testComment;

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

    testModerator = await createTestUser(supabase, {
      email: 'moderator@example.com',
      username: 'moderator',
      role: 'moderator'
    });

    testAdmin = await createTestUser(supabase, {
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin'
    });

    otherUser = await createTestUser(supabase, {
      email: 'otheruser@example.com',
      username: 'otheruser',
      role: 'user'
    });

    // Create test forum category
    testCategory = await createTestForumCategory(supabase, {
      name: 'General Discussion',
      description: 'General EV discussions',
      slug: 'general-discussion'
    });

    // Create test posts
    testPost = await createTestForumPost(supabase, testUser.id, testCategory.id, {
      title: 'Test Post',
      content: 'This is a test post content',
      tags: ['test', 'discussion']
    });

    otherPost = await createTestForumPost(supabase, otherUser.id, testCategory.id, {
      title: 'Other User Post',
      content: 'This is another test post',
      tags: ['other', 'test']
    });

    // Create test comment
    testComment = await createTestComment(supabase, testUser.id, testPost.id, {
      content: 'This is a test comment'
    });
  });

  // ==============================================
  // FORUM CATEGORIES TESTS
  // ==============================================

  describe('Forum Categories', () => {
    describe('GET /api/forum/categories', () => {
      test('should get all forum categories', async () => {
        const response = await request(app)
          .get('/api/forum/categories')
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.categories).toBeInstanceOf(Array);
        expect(response.body.data.categories.length).toBeGreaterThan(0);
        
        const category = response.body.data.categories.find(c => c.id === testCategory.id);
        expect(category).toMatchObject({
          id: testCategory.id,
          name: testCategory.name,
          description: testCategory.description,
          slug: testCategory.slug
        });
      });

      test('should include post counts in categories', async () => {
        const response = await request(app)
          .get('/api/forum/categories')
          .expect(200);

        const category = response.body.data.categories.find(c => c.id === testCategory.id);
        expect(category).toHaveProperty('postCount');
        expect(typeof category.postCount).toBe('number');
      });
    });

    describe('POST /api/forum/categories', () => {
      const validCategoryData = {
        name: 'New Category',
        description: 'A new forum category',
        slug: 'new-category'
      };

      test('should allow admin to create category', async () => {
        const response = await request(app)
          .post('/api/forum/categories')
          .set(createTestAuthHeader(testAdmin))
          .send(validCategoryData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.category).toMatchObject(validCategoryData);
        expect(isValidUUID(response.body.data.category.id)).toBe(true);

        // Verify category was created in database
        const categoryExists = await recordExists('forum_categories', {
          id: response.body.data.category.id
        });
        expect(categoryExists).toBe(true);
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .post('/api/forum/categories')
          .set(createTestAuthHeader(testUser))
          .send(validCategoryData)
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('admin');
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/forum/categories')
          .set(createTestAuthHeader(testAdmin))
          .send({
            name: 'Incomplete Category'
            // Missing description and slug
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('validation');
      });

      test('should return 409 for duplicate slug', async () => {
        const response = await request(app)
          .post('/api/forum/categories')
          .set(createTestAuthHeader(testAdmin))
          .send({
            ...validCategoryData,
            slug: testCategory.slug
          })
          .expect(409);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('slug already exists');
      });
    });
  });

  // ==============================================
  // FORUM POSTS TESTS
  // ==============================================

  describe('Forum Posts', () => {
    describe('GET /api/forum/posts', () => {
      beforeEach(async () => {
        // Create additional posts for pagination testing
        for (let i = 0; i < 15; i++) {
          await createTestForumPost(supabase, testUser.id, testCategory.id, {
            title: `Test Post ${i}`,
            content: `Content for test post ${i}`,
            tags: ['test', `tag${i}`]
          });
        }
      });

      test('should get forum posts with pagination', async () => {
        const response = await request(app)
          .get('/api/forum/posts')
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check post structure
        const post = response.body.data.items[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post).toHaveProperty('category');
        expect(post).toHaveProperty('createdAt');
        expect(post).toHaveProperty('commentCount');
        expect(post).toHaveProperty('likeCount');
      });

      test('should support filtering by category', async () => {
        const response = await request(app)
          .get(`/api/forum/posts?categoryId=${testCategory.id}`)
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(post => {
          expect(post.categoryId).toBe(testCategory.id);
        });
      });

      test('should support filtering by tags', async () => {
        const response = await request(app)
          .get('/api/forum/posts?tags=test')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(post => {
          expect(post.tags).toContain('test');
        });
      });

      test('should support search by title and content', async () => {
        const response = await request(app)
          .get('/api/forum/posts?search=Test Post')
          .expect(200);

        validatePaginationResponse(response.body);
        response.body.data.items.forEach(post => {
          expect(
            post.title.toLowerCase().includes('test post') ||
            post.content.toLowerCase().includes('test post')
          ).toBe(true);
        });
      });

      test('should support sorting', async () => {
        const response = await request(app)
          .get('/api/forum/posts?sortBy=createdAt&sortOrder=desc')
          .expect(200);

        validatePaginationResponse(response.body);
        const dates = response.body.data.items.map(post => new Date(post.createdAt));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      });
    });

    describe('POST /api/forum/posts', () => {
      const validPostData = {
        title: 'New Forum Post',
        content: 'This is the content of the new forum post. It should be long enough to meet minimum requirements.',
        categoryId: null, // Will be set in test
        tags: ['new', 'discussion', 'test']
      };

      beforeEach(() => {
        validPostData.categoryId = testCategory.id;
      });

      test('should create a new forum post successfully', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .set(createTestAuthHeader(testUser))
          .send(validPostData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.post).toMatchObject({
          title: validPostData.title,
          content: validPostData.content,
          categoryId: validPostData.categoryId,
          tags: validPostData.tags,
          authorId: testUser.id
        });

        expect(isValidUUID(response.body.data.post.id)).toBe(true);
        expect(response.body.data.post.createdAt).toBeDefined();

        // Verify post was created in database
        const postExists = await recordExists('forum_posts', {
          id: response.body.data.post.id
        });
        expect(postExists).toBe(true);
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .set(createTestAuthHeader(testUser))
          .send({
            title: 'Incomplete Post'
            // Missing content and categoryId
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('validation');
      });

      test('should return 400 for content too short', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPostData,
            content: 'Too short' // Content too short
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('content');
      });

      test('should return 400 for invalid category', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPostData,
            categoryId: '550e8400-e29b-41d4-a716-446655440000' // Non-existent category
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('category');
      });

      test('should sanitize input data', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .set(createTestAuthHeader(testUser))
          .send({
            ...validPostData,
            title: '  New Forum Post  ',
            content: '  This is the content with extra spaces.  ',
            tags: ['  new  ', '  discussion  ']
          })
          .expect(201);

        expect(response.body.data.post.title).toBe('New Forum Post');
        expect(response.body.data.post.content).toBe('This is the content with extra spaces.');
        expect(response.body.data.post.tags).toEqual(['new', 'discussion']);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post('/api/forum/posts')
          .send(validPostData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/forum/posts/:id', () => {
      test('should get forum post by ID', async () => {
        const response = await request(app)
          .get(`/api/forum/posts/${testPost.id}`)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.post).toMatchObject({
          id: testPost.id,
          title: testPost.title,
          content: testPost.content,
          authorId: testUser.id
        });

        // Should include author and category details
        expect(response.body.data.post.author).toHaveProperty('username');
        expect(response.body.data.post.category).toHaveProperty('name');
      });

      test('should increment view count', async () => {
        const initialResponse = await request(app)
          .get(`/api/forum/posts/${testPost.id}`)
          .expect(200);

        const initialViews = initialResponse.body.data.post.viewCount || 0;

        const secondResponse = await request(app)
          .get(`/api/forum/posts/${testPost.id}`)
          .expect(200);

        expect(secondResponse.body.data.post.viewCount).toBe(initialViews + 1);
      });

      test('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .get('/api/forum/posts/550e8400-e29b-41d4-a716-446655440000')
          .expect(404);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('Post not found');
      });

      test('should return 400 for invalid UUID format', async () => {
        const response = await request(app)
          .get('/api/forum/posts/invalid-id')
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('Invalid post ID');
      });
    });

    describe('PUT /api/forum/posts/:id', () => {
      const validUpdateData = {
        title: 'Updated Post Title',
        content: 'This is the updated content of the forum post. It should be long enough to meet minimum requirements.',
        tags: ['updated', 'test']
      };

      test('should update own post successfully', async () => {
        const response = await request(app)
          .put(`/api/forum/posts/${testPost.id}`)
          .set(createTestAuthHeader(testUser))
          .send(validUpdateData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.post).toMatchObject({
          id: testPost.id,
          title: validUpdateData.title,
          content: validUpdateData.content,
          tags: validUpdateData.tags
        });

        // Verify update in database
        const updatedPost = await getRecordById('forum_posts', testPost.id);
        expect(updatedPost.title).toBe(validUpdateData.title);
        expect(updatedPost.content).toBe(validUpdateData.content);
      });

      test('should return 403 for updating other user post', async () => {
        const response = await request(app)
          .put(`/api/forum/posts/${otherPost.id}`)
          .set(createTestAuthHeader(testUser))
          .send(validUpdateData)
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('access');
      });

      test('should allow moderator to update any post', async () => {
        const response = await request(app)
          .put(`/api/forum/posts/${otherPost.id}`)
          .set(createTestAuthHeader(testModerator))
          .send(validUpdateData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.post.title).toBe(validUpdateData.title);
      });

      test('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .put('/api/forum/posts/550e8400-e29b-41d4-a716-446655440000')
          .set(createTestAuthHeader(testUser))
          .send(validUpdateData)
          .expect(404);

        validateErrorResponse(response.body);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .put(`/api/forum/posts/${testPost.id}`)
          .send(validUpdateData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('DELETE /api/forum/posts/:id', () => {
      test('should delete own post successfully', async () => {
        const response = await request(app)
          .delete(`/api/forum/posts/${testPost.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');

        // Verify post was deleted from database
        const deletedPost = await getRecordById('forum_posts', testPost.id);
        expect(deletedPost).toBeNull();
      });

      test('should return 403 for deleting other user post', async () => {
        const response = await request(app)
          .delete(`/api/forum/posts/${otherPost.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('access');
      });

      test('should allow moderator to delete any post', async () => {
        const response = await request(app)
          .delete(`/api/forum/posts/${otherPost.id}`)
          .set(createTestAuthHeader(testModerator))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .delete(`/api/forum/posts/${testPost.id}`)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // FORUM COMMENTS TESTS
  // ==============================================

  describe('Forum Comments', () => {
    describe('GET /api/forum/posts/:id/comments', () => {
      beforeEach(async () => {
        // Create additional comments for testing
        for (let i = 0; i < 10; i++) {
          await createTestComment(supabase, testUser.id, testPost.id, {
            content: `Test comment ${i}`
          });
        }
      });

      test('should get post comments with pagination', async () => {
        const response = await request(app)
          .get(`/api/forum/posts/${testPost.id}/comments`)
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
        expect(response.body.data.items.length).toBeGreaterThan(0);
        
        // Check comment structure
        const comment = response.body.data.items[0];
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('author');
        expect(comment).toHaveProperty('createdAt');
        expect(comment.postId).toBe(testPost.id);
      });

      test('should support pagination parameters', async () => {
        const response = await request(app)
          .get(`/api/forum/posts/${testPost.id}/comments?page=1&limit=5`)
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
        expect(response.body.data.items.length).toBeLessThanOrEqual(5);
      });

      test('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .get('/api/forum/posts/550e8400-e29b-41d4-a716-446655440000/comments')
          .expect(404);

        validateErrorResponse(response.body);
      });
    });

    describe('POST /api/forum/posts/:id/comments', () => {
      const validCommentData = {
        content: 'This is a test comment with sufficient content length.'
      };

      test('should create a new comment successfully', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/comments`)
          .set(createTestAuthHeader(testUser))
          .send(validCommentData)
          .expect(201);

        validateApiResponse(response.body);
        expect(response.body.data.comment).toMatchObject({
          content: validCommentData.content,
          postId: testPost.id,
          authorId: testUser.id
        });

        expect(isValidUUID(response.body.data.comment.id)).toBe(true);
        expect(response.body.data.comment.createdAt).toBeDefined();

        // Verify comment was created in database
        const commentExists = await recordExists('forum_comments', {
          id: response.body.data.comment.id
        });
        expect(commentExists).toBe(true);
      });

      test('should return 400 for missing content', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/comments`)
          .set(createTestAuthHeader(testUser))
          .send({})
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('content');
      });

      test('should return 400 for content too short', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/comments`)
          .set(createTestAuthHeader(testUser))
          .send({
            content: 'Too short'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('content');
      });

      test('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .post('/api/forum/posts/550e8400-e29b-41d4-a716-446655440000/comments')
          .set(createTestAuthHeader(testUser))
          .send(validCommentData)
          .expect(404);

        validateErrorResponse(response.body);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/comments`)
          .send(validCommentData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('PUT /api/forum/comments/:id', () => {
      const validUpdateData = {
        content: 'This is the updated comment content with sufficient length.'
      };

      test('should update own comment successfully', async () => {
        const response = await request(app)
          .put(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(testUser))
          .send(validUpdateData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.comment).toMatchObject({
          id: testComment.id,
          content: validUpdateData.content
        });

        // Verify update in database
        const updatedComment = await getRecordById('forum_comments', testComment.id);
        expect(updatedComment.content).toBe(validUpdateData.content);
      });

      test('should return 403 for updating other user comment', async () => {
        const response = await request(app)
          .put(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(otherUser))
          .send(validUpdateData)
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('access');
      });

      test('should allow moderator to update any comment', async () => {
        const response = await request(app)
          .put(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(testModerator))
          .send(validUpdateData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.comment.content).toBe(validUpdateData.content);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .put(`/api/forum/comments/${testComment.id}`)
          .send(validUpdateData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('DELETE /api/forum/comments/:id', () => {
      test('should delete own comment successfully', async () => {
        const response = await request(app)
          .delete(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');

        // Verify comment was deleted from database
        const deletedComment = await getRecordById('forum_comments', testComment.id);
        expect(deletedComment).toBeNull();
      });

      test('should return 403 for deleting other user comment', async () => {
        const response = await request(app)
          .delete(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(otherUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('access');
      });

      test('should allow moderator to delete any comment', async () => {
        const response = await request(app)
          .delete(`/api/forum/comments/${testComment.id}`)
          .set(createTestAuthHeader(testModerator))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('deleted');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .delete(`/api/forum/comments/${testComment.id}`)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // FORUM LIKES TESTS
  // ==============================================

  describe('Forum Likes', () => {
    describe('POST /api/forum/posts/:id/like', () => {
      test('should like a post successfully', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.liked).toBe(true);
        expect(response.body.data.likeCount).toBeGreaterThan(0);
      });

      test('should unlike a post when already liked', async () => {
        // First like the post
        await request(app)
          .post(`/api/forum/posts/${testPost.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        // Then unlike it
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.liked).toBe(false);
      });

      test('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .post('/api/forum/posts/550e8400-e29b-41d4-a716-446655440000/like')
          .set(createTestAuthHeader(testUser))
          .expect(404);

        validateErrorResponse(response.body);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/like`)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('POST /api/forum/comments/:id/like', () => {
      test('should like a comment successfully', async () => {
        const response = await request(app)
          .post(`/api/forum/comments/${testComment.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.liked).toBe(true);
        expect(response.body.data.likeCount).toBeGreaterThan(0);
      });

      test('should unlike a comment when already liked', async () => {
        // First like the comment
        await request(app)
          .post(`/api/forum/comments/${testComment.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        // Then unlike it
        const response = await request(app)
          .post(`/api/forum/comments/${testComment.id}/like`)
          .set(createTestAuthHeader(testUser))
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.data.liked).toBe(false);
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post(`/api/forum/comments/${testComment.id}/like`)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });
  });

  // ==============================================
  // FORUM MODERATION TESTS
  // ==============================================

  describe('Forum Moderation', () => {
    describe('POST /api/forum/posts/:id/report', () => {
      const validReportData = {
        reason: 'spam',
        description: 'This post contains spam content'
      };

      test('should report a post successfully', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/report`)
          .set(createTestAuthHeader(testUser))
          .send(validReportData)
          .expect(200);

        validateApiResponse(response.body);
        expect(response.body.message).toContain('reported');
      });

      test('should return 400 for missing reason', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/report`)
          .set(createTestAuthHeader(testUser))
          .send({
            description: 'Missing reason'
          })
          .expect(400);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('reason');
      });

      test('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post(`/api/forum/posts/${testPost.id}/report`)
          .send(validReportData)
          .expect(401);

        validateErrorResponse(response.body);
      });
    });

    describe('GET /api/forum/moderation/reports', () => {
      test('should allow moderator to view reports', async () => {
        const response = await request(app)
          .get('/api/forum/moderation/reports')
          .set(createTestAuthHeader(testModerator))
          .expect(200);

        validatePaginationResponse(response.body);
        expect(response.body.data.items).toBeInstanceOf(Array);
      });

      test('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/forum/moderation/reports')
          .set(createTestAuthHeader(testUser))
          .expect(403);

        validateErrorResponse(response.body);
        expect(response.body.message).toContain('moderator');
      });
    });
  });

  // ==============================================
  // FORUM STATISTICS TESTS
  // ==============================================

  describe('GET /api/forum/stats', () => {
    test('should get forum statistics', async () => {
      const response = await request(app)
        .get('/api/forum/stats')
        .expect(200);

      validateApiResponse(response.body);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalPosts');
      expect(response.body.data.stats).toHaveProperty('totalComments');
      expect(response.body.data.stats).toHaveProperty('totalUsers');
      expect(response.body.data.stats).toHaveProperty('popularTags');
    });
  });
});