import express, { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';
import { validate, userSchemas, commonSchemas } from '../middleware/validation';
import { asyncHandler, notFoundError, forbiddenError, validationError } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth, requireOwnership, AuthenticatedRequest, OptionalAuthRequest } from '../middleware/auth';
import { buildPagination, isValidUUID } from '../services/supabaseClient';
import { toString, toNumber } from '../utils/typeUtils';

// User interfaces
interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  privacy_settings?: Record<string, any>;
  notification_settings?: Record<string, any>;
}

interface PaginationQuery {
  page?: string;
  limit?: string;
  q?: string;
}

interface UserStats {
  vehicles_count: number;
  posts_count: number;
  reviews_count: number;
}

const router: Router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { data: userProfile, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw notFoundError('User profile');
  }

  res.json({
    success: true,
    data: {
      user: userProfile
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', authenticateToken, validate(userSchemas.updateProfile), asyncHandler(async (req: AuthenticatedRequest<{}, {}, UpdateProfileRequest>, res: express.Response) => {
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Check if username is being changed and if it's available
  if (req.body.username) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', req.body.username)
      .neq('id', req.user.id)
      .single();

    if (existingUser) {
      throw validationError('Username is already taken');
    }
  }

  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update profile');
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get('/:username', optionalAuth, asyncHandler(async (req: OptionalAuthRequest<{ username: string }>, res: express.Response) => {
  const { username } = req.params;

  const { data: userProfile, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      location,
      website,
      is_verified,
      is_business,
      business_name,
      business_type,
      join_date,
      last_active
    `)
    .eq('username', username)
    .single();

  if (error) {
    throw notFoundError('User');
  }

  // Check privacy settings
  const isOwnProfile = req.user && req.user.id === userProfile.id;
  
  if (!isOwnProfile) {
    // Get privacy settings
    const { data: privacyData } = await supabaseAdmin
      .from('users')
      .select('privacy_settings')
      .eq('id', userProfile.id)
      .single();

    const privacySettings = privacyData?.privacy_settings || {};
    
    // Apply privacy filters
    if (privacySettings.hide_last_active) {
      delete userProfile.last_active;
    }
    
    if (privacySettings.hide_location) {
      delete userProfile.location;
    }
  }

  // Get user statistics
  const [vehiclesCount, postsCount, reviewsCount] = await Promise.all([
    supabaseAdmin
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('owner_id', userProfile.id)
      .eq('is_public', true),
    
    supabaseAdmin
      .from('forum_posts')
      .select('id', { count: 'exact' })
      .eq('author_id', userProfile.id),
    
    supabaseAdmin
      .from('reviews')
      .select('id', { count: 'exact' })
      .eq('reviewer_id', userProfile.id)
  ]);

  res.json({
    success: true,
    data: {
      user: {
        ...userProfile,
        stats: {
          vehicles_count: vehiclesCount.count || 0,
          posts_count: postsCount.count || 0,
          reviews_count: reviewsCount.count || 0
        }
      }
    }
  });
}));

// @route   GET /api/users/:username/vehicles
// @desc    Get user's vehicles
// @access  Public
router.get('/:username/vehicles', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: OptionalAuthRequest<{ username: string }>, res: express.Response) => {
  const { username } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(toNumber(page, 1), toNumber(limit, 20));

  // Get user ID from username
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (userError) {
    throw notFoundError('User');
  }

  const isOwnProfile = req.user && req.user.id === user.id;
  
  let query = supabaseAdmin
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  // Only show public vehicles for other users
  if (!isOwnProfile) {
    query = query.eq('is_public', true);
  }

  const { data: vehicles, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch vehicles');
  }

  res.json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   GET /api/users/:username/posts
// @desc    Get user's forum posts
// @access  Public
router.get('/:username/posts', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: OptionalAuthRequest<{ username: string }>, res: express.Response) => {
  const { username } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(toNumber(page, 1), toNumber(limit, 20));

  // Get user ID from username
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (userError) {
    throw notFoundError('User');
  }

  const { data: posts, error, count } = await supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      forum_categories(name, slug),
      users(username, avatar_url)
    `, { count: 'exact' })
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch posts');
  }

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   GET /api/users/:username/reviews
// @desc    Get user's reviews
// @access  Public
router.get('/:username/reviews', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: OptionalAuthRequest<{ username: string }>, res: express.Response) => {
  const { username } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(toNumber(page, 1), toNumber(limit, 20));

  // Get user ID from username
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (userError) {
    throw notFoundError('User');
  }

  const { data: reviews, error, count } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      users(username, avatar_url)
    `, { count: 'exact' })
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch reviews');
  }

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  // This will be implemented with the upload middleware
  // For now, return a placeholder response
  res.json({
    success: true,
    message: 'Avatar upload endpoint - to be implemented with file upload middleware'
  });
}));

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user.id;

  // Start a transaction-like operation
  try {
    // Delete user data in order (respecting foreign key constraints)
    await Promise.all([
      // Delete user's likes
      supabaseAdmin.from('likes').delete().eq('user_id', userId),
      // Delete user's messages
      supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
      // Delete user's reviews
      supabaseAdmin.from('reviews').delete().eq('reviewer_id', userId),
      // Delete user's blog comments
      supabaseAdmin.from('blog_comments').delete().eq('author_id', userId),
      // Delete user's forum replies
      supabaseAdmin.from('forum_replies').delete().eq('author_id', userId)
    ]);

    // Delete user's content
    await Promise.all([
      // Delete user's blog posts
      supabaseAdmin.from('blog_posts').delete().eq('author_id', userId),
      // Delete user's forum posts
      supabaseAdmin.from('forum_posts').delete().eq('author_id', userId),
      // Delete user's marketplace listings
      supabaseAdmin.from('marketplace_listings').delete().eq('seller_id', userId),
      // Delete user's wanted ads
      supabaseAdmin.from('wanted_ads').delete().eq('user_id', userId),
      // Delete user's vehicles
      supabaseAdmin.from('vehicles').delete().eq('owner_id', userId),
      // Delete user's directory businesses
      supabaseAdmin.from('directory_businesses').delete().eq('owner_id', userId)
    ]);

    // Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw new Error('Failed to delete user profile');
    }

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error('Failed to delete user authentication');
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}));

// @route   GET /api/users
// @desc    Get users list (for admin/search purposes)
// @access  Public
router.get('/', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: express.Request<{}, {}, {}, PaginationQuery>, res: express.Response) => {
  const { page, limit, q } = req.query;
  const { from, to } = buildPagination(toNumber(page, 1), toNumber(limit, 20));

  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      location,
      is_verified,
      is_business,
      business_name,
      join_date
    `, { count: 'exact' })
    .order('join_date', { ascending: false })
    .range(from, to);

  // Add search filter if query provided
  if (q) {
    query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%,business_name.ilike.%${q}%`);
  }

  const { data: users, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch users');
  }

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

export default router;