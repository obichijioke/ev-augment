const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, forumSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, notFoundError, forbiddenError, validationError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireOwnership, requireModerator } = require('../middleware/auth');
const { buildPagination, isValidUUID } = require('../services/supabaseClient');

const router = express.Router();

// @route   GET /api/forum/categories
// @desc    Get all forum categories
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const { data: categories, error } = await supabaseAdmin
    .from('forum_categories')
    .select(`
      *,
      forum_posts(count)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch forum categories');
  }

  res.json({
    success: true,
    data: {
      categories
    }
  });
}));

// @route   GET /api/forum/posts
// @desc    Get all forum posts
// @access  Public
router.get('/posts', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, category_id, sort, sortBy, q, is_pinned, is_locked } = req.query;
  const { from, to } = buildPagination(page, limit);

  let query = supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role),
      forum_categories(name, slug),
      forum_replies(count)
    `, { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);

  // Apply filters
  if (category_id && isValidUUID(category_id)) {
    query = query.eq('category_id', category_id);
  }
  if (is_pinned === 'true') {
    query = query.eq('is_pinned', true);
  }
  if (is_locked === 'true') {
    query = query.eq('is_locked', true);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  // Apply sorting
  const validSortFields = ['created_at', 'updated_at', 'views', 'title', 'reply_count'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
  const sortOrder = sort === 'asc' ? { ascending: true } : { ascending: false };
  
  // Always sort pinned posts first
  query = query.order('is_pinned', { ascending: false });
  query = query.order(sortField, sortOrder);

  const { data: posts, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch forum posts');
  }

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/forum/posts
// @desc    Create a new forum post
// @access  Private
router.post('/posts', authenticateToken, validate(forumSchemas.createPost), asyncHandler(async (req, res) => {
  const postData = {
    ...req.body,
    author_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Verify category exists
  const { data: category, error: categoryError } = await supabaseAdmin
    .from('forum_categories')
    .select('id')
    .eq('id', postData.category_id)
    .eq('is_active', true)
    .single();

  if (categoryError) {
    throw validationError('Invalid category selected');
  }

  const { data: post, error } = await supabaseAdmin
    .from('forum_posts')
    .insert(postData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role),
      forum_categories(name, slug)
    `)
    .single();

  if (error) {
    throw new Error('Failed to create forum post');
  }

  res.status(201).json({
    success: true,
    message: 'Forum post created successfully',
    data: {
      post
    }
  });
}));

// @route   GET /api/forum/posts/:id
// @desc    Get forum post by ID with replies
// @access  Public
router.get('/posts/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(id)) {
    throw validationError('Invalid post ID format');
  }

  // Get the post
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role, join_date),
      forum_categories(name, slug)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (postError) {
    throw notFoundError('Forum post');
  }

  // Increment view count (only if not the author)
  if (!req.user || req.user.id !== post.author_id) {
    await supabaseAdmin
      .from('forum_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', id);
    
    post.views = (post.views || 0) + 1;
  }

  // Get replies with pagination
  const { data: replies, error: repliesError, count } = await supabaseAdmin
    .from('forum_replies')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role, join_date)
    `, { count: 'exact' })
    .eq('post_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (repliesError) {
    throw new Error('Failed to fetch replies');
  }

  // Get author's post count
  const { count: authorPostCount } = await supabaseAdmin
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', post.author_id)
    .eq('is_active', true);

  res.json({
    success: true,
    data: {
      post: {
        ...post,
        users: {
          ...post.users,
          post_count: authorPostCount || 0
        }
      },
      replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   PUT /api/forum/posts/:id
// @desc    Update forum post
// @access  Private (Author or Moderator)
router.put('/posts/:id', authenticateToken, validate(forumSchemas.updatePost), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid post ID format');
  }

  // Check if post exists and get author
  const { data: existingPost, error: checkError } = await supabaseAdmin
    .from('forum_posts')
    .select('author_id, is_locked')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Forum post');
  }

  // Check permissions (author or moderator)
  const isAuthor = existingPost.author_id === req.user.id;
  const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
  
  if (!isAuthor && !isModerator) {
    throw forbiddenError('You can only edit your own posts');
  }

  // Check if post is locked (only moderators can edit locked posts)
  if (existingPost.is_locked && !isModerator) {
    throw forbiddenError('This post is locked and cannot be edited');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Only moderators can change certain fields
  if (!isModerator) {
    delete updateData.is_pinned;
    delete updateData.is_locked;
    delete updateData.category_id;
  }

  const { data: post, error } = await supabaseAdmin
    .from('forum_posts')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role),
      forum_categories(name, slug)
    `)
    .single();

  if (error) {
    throw new Error('Failed to update forum post');
  }

  res.json({
    success: true,
    message: 'Forum post updated successfully',
    data: {
      post
    }
  });
}));

// @route   DELETE /api/forum/posts/:id
// @desc    Delete forum post
// @access  Private (Author or Moderator)
router.delete('/posts/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid post ID format');
  }

  // Check if post exists and get author
  const { data: existingPost, error: checkError } = await supabaseAdmin
    .from('forum_posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Forum post');
  }

  // Check permissions (author or moderator)
  const isAuthor = existingPost.author_id === req.user.id;
  const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
  
  if (!isAuthor && !isModerator) {
    throw forbiddenError('You can only delete your own posts');
  }

  // Soft delete by setting is_active to false
  const { error } = await supabaseAdmin
    .from('forum_posts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete forum post');
  }

  res.json({
    success: true,
    message: 'Forum post deleted successfully'
  });
}));

// @route   POST /api/forum/posts/:id/replies
// @desc    Create a reply to a forum post
// @access  Private
router.post('/posts/:id/replies', authenticateToken, validate(forumSchemas.createReply), asyncHandler(async (req, res) => {
  const { id: postId } = req.params;

  if (!isValidUUID(postId)) {
    throw validationError('Invalid post ID format');
  }

  // Check if post exists and is not locked
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select('id, is_locked, is_active')
    .eq('id', postId)
    .single();

  if (postError) {
    throw notFoundError('Forum post');
  }

  if (!post.is_active) {
    throw forbiddenError('Cannot reply to an inactive post');
  }

  if (post.is_locked) {
    throw forbiddenError('This post is locked and cannot receive new replies');
  }

  const replyData = {
    ...req.body,
    post_id: postId,
    author_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: reply, error } = await supabaseAdmin
    .from('forum_replies')
    .insert(replyData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role)
    `)
    .single();

  if (error) {
    throw new Error('Failed to create reply');
  }

  // Update post's reply count and last activity
  await supabaseAdmin
    .from('forum_posts')
    .update({
      reply_count: supabaseAdmin.raw('reply_count + 1'),
      last_reply_at: new Date().toISOString(),
      last_reply_by: req.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId);

  res.status(201).json({
    success: true,
    message: 'Reply created successfully',
    data: {
      reply
    }
  });
}));

// @route   PUT /api/forum/replies/:id
// @desc    Update forum reply
// @access  Private (Author or Moderator)
router.put('/replies/:id', authenticateToken, validate(forumSchemas.updateReply), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid reply ID format');
  }

  // Check if reply exists and get author
  const { data: existingReply, error: checkError } = await supabaseAdmin
    .from('forum_replies')
    .select('author_id, post_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Forum reply');
  }

  // Check permissions (author or moderator)
  const isAuthor = existingReply.author_id === req.user.id;
  const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
  
  if (!isAuthor && !isModerator) {
    throw forbiddenError('You can only edit your own replies');
  }

  // Check if parent post is locked (only moderators can edit replies in locked posts)
  const { data: post } = await supabaseAdmin
    .from('forum_posts')
    .select('is_locked')
    .eq('id', existingReply.post_id)
    .single();

  if (post && post.is_locked && !isModerator) {
    throw forbiddenError('Cannot edit replies in a locked post');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: reply, error } = await supabaseAdmin
    .from('forum_replies')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role)
    `)
    .single();

  if (error) {
    throw new Error('Failed to update reply');
  }

  res.json({
    success: true,
    message: 'Reply updated successfully',
    data: {
      reply
    }
  });
}));

// @route   DELETE /api/forum/replies/:id
// @desc    Delete forum reply
// @access  Private (Author or Moderator)
router.delete('/replies/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid reply ID format');
  }

  // Check if reply exists and get author
  const { data: existingReply, error: checkError } = await supabaseAdmin
    .from('forum_replies')
    .select('author_id, post_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Forum reply');
  }

  // Check permissions (author or moderator)
  const isAuthor = existingReply.author_id === req.user.id;
  const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
  
  if (!isAuthor && !isModerator) {
    throw forbiddenError('You can only delete your own replies');
  }

  // Soft delete by setting is_active to false
  const { error } = await supabaseAdmin
    .from('forum_replies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete reply');
  }

  // Update post's reply count
  await supabaseAdmin
    .from('forum_posts')
    .update({
      reply_count: supabaseAdmin.raw('reply_count - 1'),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingReply.post_id);

  res.json({
    success: true,
    message: 'Reply deleted successfully'
  });
}));

// @route   POST /api/forum/posts/:id/pin
// @desc    Pin/unpin a forum post
// @access  Private (Moderator only)
router.post('/posts/:id/pin', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_pinned } = req.body;

  if (!isValidUUID(id)) {
    throw validationError('Invalid post ID format');
  }

  const { data: post, error } = await supabaseAdmin
    .from('forum_posts')
    .update({
      is_pinned: Boolean(is_pinned),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, title, is_pinned')
    .single();

  if (error) {
    throw notFoundError('Forum post');
  }

  res.json({
    success: true,
    message: `Post ${post.is_pinned ? 'pinned' : 'unpinned'} successfully`,
    data: {
      post
    }
  });
}));

// @route   POST /api/forum/posts/:id/lock
// @desc    Lock/unlock a forum post
// @access  Private (Moderator only)
router.post('/posts/:id/lock', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_locked } = req.body;

  if (!isValidUUID(id)) {
    throw validationError('Invalid post ID format');
  }

  const { data: post, error } = await supabaseAdmin
    .from('forum_posts')
    .update({
      is_locked: Boolean(is_locked),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, title, is_locked')
    .single();

  if (error) {
    throw notFoundError('Forum post');
  }

  res.json({
    success: true,
    message: `Post ${post.is_locked ? 'locked' : 'unlocked'} successfully`,
    data: {
      post
    }
  });
}));

// @route   GET /api/forum/search
// @desc    Search forum posts and replies
// @access  Public
router.get('/search', validate(commonSchemas.search, 'query'), asyncHandler(async (req, res) => {
  const { q, category_id, page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!q || q.trim().length < 2) {
    throw validationError('Search query must be at least 2 characters long');
  }

  let query = supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role),
      forum_categories(name, slug)
    `, { count: 'exact' })
    .eq('is_active', true)
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (category_id && isValidUUID(category_id)) {
    query = query.eq('category_id', category_id);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    throw new Error('Failed to search forum posts');
  }

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      query: q
    }
  });
}));

// @route   GET /api/forum/user/:userId/posts
// @desc    Get user's forum posts
// @access  Public
router.get('/user/:userId/posts', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  const { data: posts, error, count } = await supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, role),
      forum_categories(name, slug)
    `, { count: 'exact' })
    .eq('author_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch user posts');
  }

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

module.exports = router;