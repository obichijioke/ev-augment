import express, { Request, Response, Router } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';
import { validate, likeSchemas, commonSchemas } from '../middleware/validation';
import { asyncHandler, notFoundError, forbiddenError, validationError } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { buildPagination, isValidUUID } from '../services/supabaseClient';
import { toString, toNumber } from '../utils/typeUtils';

// TypeScript interfaces
interface CreateLikeRequest {
  entity_type: string;
  entity_id: string;
}

interface LikesQuery {
  page?: string;
  limit?: string;
  entity_type?: string;
  timeframe?: string;
}

interface EntityLikesParams {
  entityType: string;
  entityId: string;
}

interface UserLikesParams {
  userId: string;
}

interface LikeParams {
  id: string;
}

const router: Router = express.Router();

// @route   POST /api/likes
// @desc    Like or unlike content
// @access  Private
router.post('/', authenticateToken, validate(likeSchemas.create), asyncHandler(async (req: Request, res: Response) => {
  const { entity_type, entity_id } = req.body;

  // Validate entity_id format
  if (!isValidUUID(entity_id)) {
    throw validationError('Invalid entity ID format');
  }

  // Check if the entity exists based on entity_type
  let entityExists = false;
  let entityOwner = null;
  
  switch (entity_type) {
    case 'forum_post':
      const { data: post } = await supabaseAdmin
        .from('forum_posts')
        .select('id, author_id')
        .eq('id', entity_id)
        .eq('is_active', true)
        .single();
      entityExists = !!post;
      entityOwner = post?.author_id;
      break;
      
    case 'forum_reply':
      const { data: reply } = await supabaseAdmin
        .from('forum_replies')
        .select('id, author_id')
        .eq('id', entity_id)
        .eq('is_active', true)
        .single();
      entityExists = !!reply;
      entityOwner = reply?.author_id;
      break;
      
    case 'blog_post':
      const { data: blogPost } = await supabaseAdmin
        .from('blog_posts')
        .select('id, author_id')
        .eq('id', entity_id)
        .eq('is_published', true)
        .single();
      entityExists = !!blogPost;
      entityOwner = blogPost?.author_id;
      break;
      
    case 'blog_comment':
      const { data: comment } = await supabaseAdmin
        .from('blog_comments')
        .select('id, author_id')
        .eq('id', entity_id)
        .eq('is_active', true)
        .single();
      entityExists = !!comment;
      entityOwner = comment?.author_id;
      break;
      
    case 'marketplace_listing':
      const { data: listing } = await supabaseAdmin
        .from('marketplace_listings')
        .select('id, seller_id')
        .eq('id', entity_id)
        .eq('is_active', true)
        .single();
      entityExists = !!listing;
      entityOwner = listing?.seller_id;
      break;
      
    case 'wanted_ad':
      const { data: wantedAd } = await supabaseAdmin
        .from('wanted_ads')
        .select('id, user_id')
        .eq('id', entity_id)
        .eq('is_active', true)
        .single();
      entityExists = !!wantedAd;
      entityOwner = wantedAd?.user_id;
      break;
      
    case 'vehicle':
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id, owner_id')
        .eq('id', entity_id)
        .eq('is_public', true)
        .single();
      entityExists = !!vehicle;
      entityOwner = vehicle?.owner_id;
      break;
      
    default:
      throw validationError('Invalid entity type');
  }

  if (!entityExists) {
    throw notFoundError('Content to like');
  }

  // Check if user has already liked this content
  const { data: existingLike, error: likeCheckError } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .eq('user_id', (req as any).user.id)
    .single();

  let result;
  
  if (existingLike) {
    // Unlike - remove the like
    const { error: deleteError } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('id', existingLike.id);
    
    if (deleteError) {
      throw new Error('Failed to remove like');
    }
    
    result = { action: 'unliked', liked: false };
  } else {
    // Like - create new like
    const { data: newLike, error: createError } = await supabaseAdmin
      .from('likes')
      .insert({
        entity_type,
        entity_id,
        user_id: (req as any).user.id,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (createError) {
      throw new Error('Failed to create like');
    }
    
    result = { action: 'liked', liked: true, like: newLike };
  }

  // Update like count on the entity
  const { data: likeCounts } = await supabaseAdmin
    .from('likes')
    .select('id', { count: 'exact' })
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id);

  const likeCount = likeCounts?.length || 0;

  // Update the like count in the appropriate table
  let updateTable;
  let updateField = 'likes_count';
  
  switch (entity_type) {
    case 'forum_post':
      updateTable = 'forum_posts';
      break;
    case 'forum_reply':
      updateTable = 'forum_replies';
      break;
    case 'blog_post':
      updateTable = 'blog_posts';
      break;
    case 'blog_comment':
      updateTable = 'blog_comments';
      break;
    case 'marketplace_listing':
      updateTable = 'marketplace_listings';
      break;
    case 'wanted_ad':
      updateTable = 'wanted_ads';
      break;
    case 'vehicle':
      updateTable = 'vehicles';
      break;
  }

  if (updateTable) {
    await supabaseAdmin
      .from(updateTable)
      .update({ 
        [updateField]: likeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', entity_id);
  }

  res.json({
    success: true,
    message: `Content ${result.action} successfully`,
    data: {
      action: result.action,
      liked: result.liked,
      like_count: likeCount
    }
  });
}));

// @route   GET /api/likes/entity/:entityType/:entityId
// @desc    Get likes for a specific entity
// @access  Public
router.get('/entity/:entityType/:entityId', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(parseInt(page as string), parseInt(limit as string));

  if (!isValidUUID(entityId)) {
    throw validationError('Invalid entity ID format');
  }

  const validEntityTypes = [
    'forum_post', 'forum_reply', 'blog_post', 'blog_comment', 
    'marketplace_listing', 'wanted_ad', 'vehicle'
  ];
  
  if (!validEntityTypes.includes(entityType)) {
    throw validationError('Invalid entity type');
  }

  const { data: likes, error, count } = await supabaseAdmin
    .from('likes')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch likes');
  }

  // Check if current user has liked this content
  let userHasLiked = false;
  if (req.user) {
    const userLike = likes.find(like => like.user_id === req.user.id);
    userHasLiked = !!userLike;
  }

  res.json({
    success: true,
    data: {
      likes,
      user_has_liked: userHasLiked,
      total_likes: count,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   GET /api/likes/user/:userId
// @desc    Get likes by a specific user
// @access  Public
router.get('/user/:userId', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit, entity_type } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  let query = supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (entity_type) {
    const validEntityTypes = [
      'forum_post', 'forum_reply', 'blog_post', 'blog_comment', 
      'marketplace_listing', 'wanted_ad', 'vehicle'
    ];
    
    if (validEntityTypes.includes(entity_type)) {
      query = query.eq('entity_type', entity_type);
    }
  }

  const { data: likes, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch user likes');
  }

  // Get additional details for each liked entity
  const likesWithDetails = await Promise.all(
    likes.map(async (like) => {
      let entityDetails = null;
      
      try {
        switch (like.entity_type) {
          case 'forum_post':
            const { data: post } = await supabaseAdmin
              .from('forum_posts')
              .select('id, title, category, created_at')
              .eq('id', like.entity_id)
              .single();
            entityDetails = post;
            break;
            
          case 'forum_reply':
            const { data: reply } = await supabaseAdmin
              .from('forum_replies')
              .select('id, content, created_at, forum_posts(title)')
              .eq('id', like.entity_id)
              .single();
            entityDetails = reply;
            break;
            
          case 'blog_post':
            const { data: blogPost } = await supabaseAdmin
              .from('blog_posts')
              .select('id, title, slug, excerpt, created_at')
              .eq('id', like.entity_id)
              .single();
            entityDetails = blogPost;
            break;
            
          case 'blog_comment':
            const { data: comment } = await supabaseAdmin
              .from('blog_comments')
              .select('id, content, created_at, blog_posts(title, slug)')
              .eq('id', like.entity_id)
              .single();
            entityDetails = comment;
            break;
            
          case 'marketplace_listing':
            const { data: listing } = await supabaseAdmin
              .from('marketplace_listings')
              .select('id, title, price, category, created_at')
              .eq('id', like.entity_id)
              .single();
            entityDetails = listing;
            break;
            
          case 'wanted_ad':
            const { data: wantedAd } = await supabaseAdmin
              .from('wanted_ads')
              .select('id, title, budget_max, category, created_at')
              .eq('id', like.entity_id)
              .single();
            entityDetails = wantedAd;
            break;
            
          case 'vehicle':
            const { data: vehicle } = await supabaseAdmin
              .from('vehicles')
              .select('id, make, model, year, created_at')
              .eq('id', like.entity_id)
              .single();
            entityDetails = vehicle;
            break;
        }
      } catch (error) {
        // Entity might have been deleted, keep the like record but mark as unavailable
        entityDetails = { deleted: true };
      }
      
      return {
        ...like,
        entity_details: entityDetails
      };
    })
  );

  res.json({
    success: true,
    data: {
      likes: likesWithDetails,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   GET /api/likes/check/:entityType/:entityId
// @desc    Check if current user has liked specific content
// @access  Private
router.get('/check/:entityType/:entityId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  if (!isValidUUID(entityId)) {
    throw validationError('Invalid entity ID format');
  }

  const validEntityTypes = [
    'forum_post', 'forum_reply', 'blog_post', 'blog_comment', 
    'marketplace_listing', 'wanted_ad', 'vehicle'
  ];
  
  if (!validEntityTypes.includes(entityType)) {
    throw validationError('Invalid entity type');
  }

  const { data: like, error } = await supabaseAdmin
    .from('likes')
    .select('id, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', (req as any).user.id)
    .single();

  const hasLiked = !!like && !error;

  res.json({
    success: true,
    data: {
      has_liked: hasLiked,
      liked_at: like?.created_at || null
    }
  });
}));

// @route   GET /api/likes/stats/:entityType/:entityId
// @desc    Get like statistics for an entity
// @access  Public
router.get('/stats/:entityType/:entityId', asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  if (!isValidUUID(entityId)) {
    throw validationError('Invalid entity ID format');
  }

  const validEntityTypes = [
    'forum_post', 'forum_reply', 'blog_post', 'blog_comment', 
    'marketplace_listing', 'wanted_ad', 'vehicle'
  ];
  
  if (!validEntityTypes.includes(entityType)) {
    throw validationError('Invalid entity type');
  }

  const { data: likes, error } = await supabaseAdmin
    .from('likes')
    .select('created_at', { count: 'exact' })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) {
    throw new Error('Failed to fetch like statistics');
  }

  // Calculate likes over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLikes = likes.filter(like => 
    new Date(like.created_at) >= thirtyDaysAgo
  );

  const stats = {
    total_likes: likes.length,
    recent_likes: recentLikes.length,
    first_like: likes.length > 0 ? likes[likes.length - 1].created_at : null,
    latest_like: likes.length > 0 ? likes[0].created_at : null
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
}));

// @route   DELETE /api/likes/:id
// @desc    Remove a specific like (admin/moderator only)
// @access  Private (Admin/Moderator)
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid like ID format');
  }

  // Check if user is admin or moderator
  if ((req as any).user.role !== 'admin' && (req as any).user.role !== 'moderator') {
    throw forbiddenError('Only administrators and moderators can remove likes');
  }

  // Get like details before deletion
  const { data: like, error: fetchError } = await supabaseAdmin
    .from('likes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw notFoundError('Like');
  }

  // Delete the like
  const { error: deleteError } = await supabaseAdmin
    .from('likes')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw new Error('Failed to remove like');
  }

  // Update like count on the entity
  const { data: likeCounts } = await supabaseAdmin
    .from('likes')
    .select('id', { count: 'exact' })
    .eq('entity_type', like.entity_type)
    .eq('entity_id', like.entity_id);

  const likeCount = likeCounts?.length || 0;

  // Update the like count in the appropriate table
  let updateTable;
  let updateField = 'likes_count';
  
  switch (like.entity_type) {
    case 'forum_post':
      updateTable = 'forum_posts';
      break;
    case 'forum_reply':
      updateTable = 'forum_replies';
      break;
    case 'blog_post':
      updateTable = 'blog_posts';
      break;
    case 'blog_comment':
      updateTable = 'blog_comments';
      break;
    case 'marketplace_listing':
      updateTable = 'marketplace_listings';
      break;
    case 'wanted_ad':
      updateTable = 'wanted_ads';
      break;
    case 'vehicle':
      updateTable = 'vehicles';
      break;
  }

  if (updateTable) {
    await supabaseAdmin
      .from(updateTable)
      .update({ 
        [updateField]: likeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', like.entity_id);
  }

  res.json({
    success: true,
    message: 'Like removed successfully',
    data: {
      removed_like: like,
      new_like_count: likeCount
    }
  });
}));

// @route   GET /api/likes/popular/:entityType
// @desc    Get most liked content by entity type
// @access  Public
router.get('/popular/:entityType', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const { entityType } = req.params;
  const { page, limit, timeframe = '30' } = req.query;
  const { from, to } = buildPagination(page, limit);

  const validEntityTypes = [
    'forum_post', 'forum_reply', 'blog_post', 'blog_comment', 
    'marketplace_listing', 'wanted_ad', 'vehicle'
  ];
  
  if (!validEntityTypes.includes(entityType)) {
    throw validationError('Invalid entity type');
  }

  // Calculate date range
  const daysAgo = parseInt(timeframe as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Get likes within timeframe
  const { data: likes, error } = await supabaseAdmin
    .from('likes')
    .select('entity_id')
    .eq('entity_type', entityType)
    .gte('created_at', startDate.toISOString());

  if (error) {
    throw new Error('Failed to fetch popular content');
  }

  // Count likes per entity
  const likeCounts = {};
  likes.forEach(like => {
    likeCounts[like.entity_id] = (likeCounts[like.entity_id] || 0) + 1;
  });

  // Sort by like count and get top entities
  const sortedEntities = Object.entries(likeCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(from, to + 1)
    .map(([entityId, likeCount]) => ({ entity_id: entityId, like_count: likeCount }));

  // Get entity details
  const entitiesWithDetails = await Promise.all(
    sortedEntities.map(async ({ entity_id, like_count }) => {
      let entityDetails = null;
      
      try {
        switch (entityType) {
          case 'forum_post':
            const { data: post } = await supabaseAdmin
              .from('forum_posts')
              .select('id, title, category, author_id, created_at, users(username, full_name, avatar_url)')
              .eq('id', entity_id)
              .eq('is_active', true)
              .single();
            entityDetails = post;
            break;
            
          case 'blog_post':
            const { data: blogPost } = await supabaseAdmin
              .from('blog_posts')
              .select('id, title, slug, excerpt, author_id, created_at, users(username, full_name, avatar_url)')
              .eq('id', entity_id)
              .eq('is_published', true)
              .single();
            entityDetails = blogPost;
            break;
            
          case 'marketplace_listing':
            const { data: listing } = await supabaseAdmin
              .from('marketplace_listings')
              .select('id, title, price, category, seller_id, created_at, users(username, full_name, avatar_url)')
              .eq('id', entity_id)
              .eq('is_active', true)
              .single();
            entityDetails = listing;
            break;
            
          case 'vehicle':
            const { data: vehicle } = await supabaseAdmin
              .from('vehicles')
              .select('id, make, model, year, owner_id, created_at, users(username, full_name, avatar_url)')
              .eq('id', entity_id)
              .eq('is_public', true)
              .single();
            entityDetails = vehicle;
            break;
        }
      } catch (error) {
        // Entity might have been deleted or made private
        return null;
      }
      
      if (!entityDetails) return null;
      
      return {
        ...entityDetails,
        like_count,
        entity_type: entityType
      };
    })
  );

  // Filter out null results
  const validEntities = entitiesWithDetails.filter(entity => entity !== null);

  res.json({
    success: true,
    data: {
      popular_content: validEntities,
      timeframe_days: daysAgo,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: validEntities.length,
        pages: Math.ceil(validEntities.length / toNumber(limit, 20))
      }
    }
  });
}));

export default router;