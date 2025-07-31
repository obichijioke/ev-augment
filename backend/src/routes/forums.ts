import express, { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { toString, toNumber } from '../utils/typeUtils';
import Joi from 'joi';

// TypeScript interfaces (removed unused interfaces to fix compilation errors)

const router: Router = express.Router();



// Validation schemas
const postSchema = Joi.object({
  title: Joi.string().required().min(5).max(200),
  content: Joi.string().required().min(10).max(10000),
  category_id: Joi.string().uuid().required(),
  is_pinned: Joi.boolean().default(false),
  is_featured: Joi.boolean().default(false)
});

const commentSchema = Joi.object({
  content: Joi.string().required().min(1).max(5000),
  parent_id: Joi.string().uuid().allow(null)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  category_id: Joi.string().uuid(),
  author_id: Joi.string().uuid(),
  search: Joi.string().max(100),
  sort: Joi.string().valid('created_at', 'updated_at', 'last_activity_at', 'view_count', 'like_count', 'comment_count').default('last_activity_at'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  is_pinned: Joi.boolean(),
  is_featured: Joi.boolean()
});

// @route   GET /api/forums/categories
// @desc    Get all forum categories
// @access  Public
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching forum categories:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch forum categories'
      });
    }

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in GET /forums/categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/forums/posts
// @desc    Get all forum posts with filtering and pagination
// @access  Public
router.get('/posts', validate(querySchema, 'query'), async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      category_id,
      author_id,
      search,
      sort,
      order,
      is_pinned,
      is_featured
    } = req.query;

    const pageNum = toNumber(page, 1);
    const limitNum = toNumber(limit, 20);
    const offset = (pageNum - 1) * limitNum;

    // Build query with joins for author and category info
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        author:users!forum_posts_author_id_fkey(id, username, avatar_url),
        category:forum_categories!forum_posts_category_id_fkey(id, name, slug, color)
      `, { count: 'exact' });

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (author_id) {
      query = query.eq('author_id', author_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (typeof is_pinned === 'boolean') {
      query = query.eq('is_pinned', is_pinned);
    }

    if (typeof is_featured === 'boolean') {
      query = query.eq('is_featured', is_featured);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching forum posts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch forum posts'
      });
    }

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error in GET /forums/posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/forums/posts/:id
// @desc    Get forum post by ID with comments
// @access  Public
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get post with author and category info
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select(`
        *,
        author:users!forum_posts_author_id_fkey(id, username, avatar_url),
        category:forum_categories!forum_posts_category_id_fkey(id, name, slug, color)
      `)
      .eq('id', id)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error fetching forum post:', postError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch forum post'
      });
    }

    // Get comments for the post
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select(`
        *,
        author:users!forum_comments_author_id_fkey(id, username, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }

    // Increment view count
    await supabase
      .from('forum_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', id);

    res.json({
      success: true,
      data: {
        ...post,
        view_count: post.view_count + 1,
        comments
      }
    });
  } catch (error) {
    console.error('Error in GET /forums/posts/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/forums/posts
// @desc    Create new forum post
// @access  Private
router.post('/posts', authenticateToken, validate(postSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, category_id, is_pinned, is_featured } = req.body;

    // Check if user has permission to pin or feature posts
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (req as any).user.id)
      .single();

    const canModerate = userProfile && ['admin', 'moderator'].includes(userProfile.role);

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);

    const postData = {
      title,
      content,
      category_id,
      author_id: (req as any).user.id,
      slug: `${slug}-${Date.now()}`,
      is_pinned: canModerate ? is_pinned : false,
      is_featured: canModerate ? is_featured : false
    };

    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert([postData])
      .select(`
        *,
        author:users!forum_posts_author_id_fkey(id, username, avatar_url),
        category:forum_categories!forum_posts_category_id_fkey(id, name, slug, color)
      `)
      .single();

    if (error) {
      console.error('Error creating forum post:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create forum post'
      });
    }

    res.status(201).json({
      success: true,
      data: post,
      message: 'Forum post created successfully'
    });
  } catch (error) {
    console.error('Error in POST /forums/posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/forums/posts/:id
// @desc    Update forum post
// @access  Private (Author or Moderator)
router.put('/posts/:id', authenticateToken, validate(postSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category_id, is_pinned, is_featured } = req.body;

    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('forum_posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error fetching post:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (req as any).user.id)
      .single();

    const isAuthor = existingPost.author_id === (req as any).user.id;
    const canModerate = userProfile && ['admin', 'moderator'].includes(userProfile.role);

    if (!isAuthor && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Generate new slug if title changed
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);

    const updateData = {
      title,
      content,
      category_id,
      slug: `${slug}-${Date.now()}`,
      updated_at: new Date().toISOString()
    };

    // Only moderators can update pinned/featured status
    if (canModerate) {
      updateData.is_pinned = is_pinned;
      updateData.is_featured = is_featured;
    }

    const { data: post, error } = await supabase
      .from('forum_posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users!forum_posts_author_id_fkey(id, username, avatar_url),
        category:forum_categories!forum_posts_category_id_fkey(id, name, slug, color)
      `)
      .single();

    if (error) {
      console.error('Error updating forum post:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update forum post'
      });
    }

    res.json({
      success: true,
      data: post,
      message: 'Forum post updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /forums/posts/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/forums/posts/:id
// @desc    Delete forum post
// @access  Private (Author or Moderator)
router.delete('/posts/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('forum_posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error fetching post:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (req as any).user.id)
      .single();

    const isAuthor = existingPost.author_id === (req as any).user.id;
    const canModerate = userProfile && ['admin', 'moderator'].includes(userProfile.role);

    if (!isAuthor && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting forum post:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete forum post'
      });
    }

    res.json({
      success: true,
      message: 'Forum post deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /forums/posts/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/forums/posts/:id/comments
// @desc    Create comment on forum post
// @access  Private
router.post('/posts/:id/comments', authenticateToken, validate(commentSchema), async (req: Request, res: Response) => {
  try {
    const { id: postId } = req.params;
    const { content, parent_id } = req.body;

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, is_locked')
      .eq('id', postId)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error fetching post:', postError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }

    if (post.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'This post is locked and cannot receive new comments'
      });
    }

    const commentData = {
      post_id: postId,
      author_id: (req as any).user.id,
      content,
      parent_id
    };

    const { data: comment, error } = await supabase
      .from('forum_comments')
      .insert([commentData])
      .select(`
        *,
        author:users!forum_comments_author_id_fkey(id, username, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
    });
  } catch (error) {
    console.error('Error in POST /forums/posts/:id/comments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/forums/posts/:id/pin
// @desc    Pin/unpin forum post
// @access  Private (Moderator)
router.put('/posts/:id/pin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_pinned } = req.body;

    // Check if user is moderator or admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (req as any).user.id)
      .single();

    if (!userProfile || !['admin', 'moderator'].includes(userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'Moderator access required'
      });
    }

    const { data: post, error } = await supabase
      .from('forum_posts')
      .update({ is_pinned, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error updating post pin status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update post pin status'
      });
    }

    res.json({
      success: true,
      data: post,
      message: `Post ${is_pinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('Error in PUT /forums/posts/:id/pin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/forums/posts/:id/lock
// @desc    Lock/unlock forum post
// @access  Private (Moderator)
router.put('/posts/:id/lock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_locked } = req.body;

    // Check if user is moderator or admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (req as any).user.id)
      .single();

    if (!userProfile || !['admin', 'moderator'].includes(userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'Moderator access required'
      });
    }

    const { data: post, error } = await supabase
      .from('forum_posts')
      .update({ is_locked, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }
      console.error('Error updating post lock status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update post lock status'
      });
    }

    res.json({
      success: true,
      data: post,
      message: `Post ${is_locked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    console.error('Error in PUT /forums/posts/:id/lock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;