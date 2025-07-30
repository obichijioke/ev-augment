const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, adminSchemas } = require('../middleware/validation');
const { asyncHandler, validationError, notFoundError, forbiddenError } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin, requireModerator } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Moderator+)
router.get('/dashboard', requireModerator, asyncHandler(async (req, res) => {
  const { timeframe = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    // Get user statistics
    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('last_sign_in_at', startDate.toISOString())
    ]);

    // Get content statistics
    const [totalVehicles, newVehicles, totalListings, newListings, totalPosts, newPosts] = await Promise.all([
      supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabaseAdmin.from('marketplace_listings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('marketplace_listings').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabaseAdmin.from('forum_posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('forum_posts').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString())
    ]);

    // Get pending content for moderation
    const [pendingListings, pendingDirectoryListings, reportedContent] = await Promise.all([
      supabaseAdmin.from('marketplace_listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('directory_listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    // Get revenue statistics (if applicable)
    const [totalRevenue, recentRevenue] = await Promise.all([
      supabaseAdmin.from('transactions').select('amount.sum()').eq('status', 'completed'),
      supabaseAdmin.from('transactions').select('amount.sum()').eq('status', 'completed').gte('created_at', startDate.toISOString())
    ]);

    const stats = {
      users: {
        total: totalUsers.count || 0,
        new: newUsers.count || 0,
        active: activeUsers.count || 0
      },
      content: {
        vehicles: {
          total: totalVehicles.count || 0,
          new: newVehicles.count || 0
        },
        marketplace_listings: {
          total: totalListings.count || 0,
          new: newListings.count || 0
        },
        forum_posts: {
          total: totalPosts.count || 0,
          new: newPosts.count || 0
        }
      },
      moderation: {
        pending_listings: pendingListings.count || 0,
        pending_directory: pendingDirectoryListings.count || 0,
        reported_content: reportedContent.count || 0
      },
      revenue: {
        total: totalRevenue.data?.[0]?.sum || 0,
        recent: recentRevenue.data?.[0]?.sum || 0
      },
      timeframe
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    throw new Error('Failed to fetch dashboard statistics');
  }
}));

// @route   GET /api/admin/users
// @desc    Get all users with admin details
// @access  Private (Moderator+)
router.get('/users', requireModerator, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    role, 
    status, 
    sort_by = 'created_at', 
    sort_order = 'desc' 
  } = req.query;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      username,
      email,
      full_name,
      role,
      is_active,
      is_verified,
      avatar_url,
      created_at,
      updated_at,
      last_sign_in_at,
      profile_privacy,
      notification_preferences
    `, { count: 'exact' })
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(from, to);

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }
  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
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
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   GET /api/admin/users/:id
// @desc    Get detailed user information
// @access  Private (Moderator+)
router.get('/users/:id', requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user details
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (userError) {
    throw notFoundError('User');
  }

  // Get user's content counts
  const [vehicles, listings, posts, reviews, messages] = await Promise.all([
    supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }).eq('owner_id', id),
    supabaseAdmin.from('marketplace_listings').select('*', { count: 'exact', head: true }).eq('seller_id', id),
    supabaseAdmin.from('forum_posts').select('*', { count: 'exact', head: true }).eq('author_id', id),
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', id),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', id)
  ]);

  // Get recent activity
  const { data: recentActivity, error: activityError } = await supabaseAdmin
    .from('user_activity_log')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const userDetails = {
    ...user,
    content_counts: {
      vehicles: vehicles.count || 0,
      listings: listings.count || 0,
      posts: posts.count || 0,
      reviews: reviews.count || 0,
      messages: messages.count || 0
    },
    recent_activity: recentActivity || []
  };

  res.json({
    success: true,
    data: {
      user: userDetails
    }
  });
}));

// @route   PUT /api/admin/users/:id
// @desc    Update user details (Admin only)
// @access  Private (Admin only)
router.put('/users/:id', requireAdmin, validate(adminSchemas.updateUser), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, is_active, is_verified, notes } = req.body;

  // Check if user exists
  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from('users')
    .select('id, role, is_active')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('User');
  }

  // Prevent self-demotion
  if (id === req.user.id && role && role !== existingUser.role) {
    throw forbiddenError('You cannot change your own role');
  }

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (role !== undefined) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (is_verified !== undefined) updateData.is_verified = is_verified;
  if (notes !== undefined) updateData.admin_notes = notes;

  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error('Failed to update user');
  }

  // Log admin action
  await supabaseAdmin.from('admin_actions').insert({
    id: crypto.randomUUID(),
    admin_id: req.user.id,
    action_type: 'user_update',
    target_type: 'user',
    target_id: id,
    details: {
      changes: updateData,
      previous_values: {
        role: existingUser.role,
        is_active: existingUser.is_active
      }
    },
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account (Admin only)
// @access  Private (Admin only)
router.delete('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;

  // Prevent self-deletion
  if (id === req.user.id) {
    throw forbiddenError('You cannot delete your own account');
  }

  // Check if user exists
  const { data: user, error: checkError } = await supabaseAdmin
    .from('users')
    .select('id, username, email')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('User');
  }

  if (permanent) {
    // Permanent deletion - remove all user data
    const deleteOperations = [
      supabaseAdmin.from('likes').delete().eq('user_id', id),
      supabaseAdmin.from('messages').delete().or(`sender_id.eq.${id},recipient_id.eq.${id}`),
      supabaseAdmin.from('reviews').delete().eq('reviewer_id', id),
      supabaseAdmin.from('forum_replies').delete().eq('author_id', id),
      supabaseAdmin.from('forum_posts').delete().eq('author_id', id),
      supabaseAdmin.from('wanted_ads').delete().eq('user_id', id),
      supabaseAdmin.from('marketplace_listings').delete().eq('seller_id', id),
      supabaseAdmin.from('vehicles').delete().eq('owner_id', id),
      supabaseAdmin.from('users').delete().eq('id', id)
    ];

    await Promise.all(deleteOperations);

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Failed to delete user from auth:', authError);
    }
  } else {
    // Soft deletion - deactivate account
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error('Failed to deactivate user');
    }
  }

  // Log admin action
  await supabaseAdmin.from('admin_actions').insert({
    id: crypto.randomUUID(),
    admin_id: req.user.id,
    action_type: permanent ? 'user_permanent_delete' : 'user_deactivate',
    target_type: 'user',
    target_id: id,
    details: {
      username: user.username,
      email: user.email,
      permanent
    },
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: permanent ? 'User permanently deleted' : 'User deactivated successfully'
  });
}));

// @route   GET /api/admin/content/pending
// @desc    Get pending content for moderation
// @access  Private (Moderator+)
router.get('/content/pending', requireModerator, asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let pendingContent = {};

  if (!type || type === 'marketplace') {
    const { data: listings, error: listingsError, count: listingsCount } = await supabaseAdmin
      .from('marketplace_listings')
      .select(`
        *,
        seller:seller_id(
          id,
          username,
          full_name
        )
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!listingsError) {
      pendingContent.marketplace_listings = {
        items: listings,
        count: listingsCount
      };
    }
  }

  if (!type || type === 'directory') {
    const { data: directory, error: directoryError, count: directoryCount } = await supabaseAdmin
      .from('directory_listings')
      .select(`
        *,
        owner:owner_id(
          id,
          username,
          full_name
        )
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!directoryError) {
      pendingContent.directory_listings = {
        items: directory,
        count: directoryCount
      };
    }
  }

  res.json({
    success: true,
    data: {
      pending_content: pendingContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }
  });
}));

// @route   PUT /api/admin/content/:type/:id/approve
// @desc    Approve pending content
// @access  Private (Moderator+)
router.put('/content/:type/:id/approve', requireModerator, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { notes } = req.body;

  let table, ownerField;
  switch (type) {
    case 'marketplace':
      table = 'marketplace_listings';
      ownerField = 'seller_id';
      break;
    case 'directory':
      table = 'directory_listings';
      ownerField = 'owner_id';
      break;
    default:
      throw validationError('Invalid content type');
  }

  const { data: content, error } = await supabaseAdmin
    .from(table)
    .update({
      status: 'active',
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
      moderator_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`*, owner:${ownerField}(id, username, email)`)
    .single();

  if (error) {
    throw notFoundError('Content');
  }

  // Send notification to content owner
  await supabaseAdmin.from('notifications').insert({
    id: crypto.randomUUID(),
    recipient_id: content.owner.id,
    sender_id: req.user.id,
    type: 'content_approved',
    title: `Your ${type} listing has been approved`,
    message: `Your ${type} listing "${content.title}" has been approved and is now live.`,
    action_url: `/${type}/${content.id}`,
    created_at: new Date().toISOString()
  });

  // Log admin action
  await supabaseAdmin.from('admin_actions').insert({
    id: crypto.randomUUID(),
    admin_id: req.user.id,
    action_type: 'content_approve',
    target_type: type,
    target_id: id,
    details: {
      title: content.title,
      notes
    },
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Content approved successfully',
    data: {
      content
    }
  });
}));

// @route   PUT /api/admin/content/:type/:id/reject
// @desc    Reject pending content
// @access  Private (Moderator+)
router.put('/content/:type/:id/reject', requireModerator, validate(adminSchemas.rejectContent), asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { reason, notes } = req.body;

  let table, ownerField;
  switch (type) {
    case 'marketplace':
      table = 'marketplace_listings';
      ownerField = 'seller_id';
      break;
    case 'directory':
      table = 'directory_listings';
      ownerField = 'owner_id';
      break;
    default:
      throw validationError('Invalid content type');
  }

  const { data: content, error } = await supabaseAdmin
    .from(table)
    .update({
      status: 'rejected',
      rejected_by: req.user.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      moderator_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`*, owner:${ownerField}(id, username, email)`)
    .single();

  if (error) {
    throw notFoundError('Content');
  }

  // Send notification to content owner
  await supabaseAdmin.from('notifications').insert({
    id: crypto.randomUUID(),
    recipient_id: content.owner.id,
    sender_id: req.user.id,
    type: 'content_rejected',
    title: `Your ${type} listing has been rejected`,
    message: `Your ${type} listing "${content.title}" has been rejected. Reason: ${reason}`,
    priority: 'high',
    created_at: new Date().toISOString()
  });

  // Send email notification
  try {
    await sendEmail({
      to: content.owner.email,
      subject: `Your ${type} listing has been rejected`,
      template: 'content_rejection',
      data: {
        username: content.owner.username,
        content_type: type,
        content_title: content.title,
        reason,
        notes
      }
    });
  } catch (emailError) {
    console.error('Failed to send rejection email:', emailError);
  }

  // Log admin action
  await supabaseAdmin.from('admin_actions').insert({
    id: crypto.randomUUID(),
    admin_id: req.user.id,
    action_type: 'content_reject',
    target_type: type,
    target_id: id,
    details: {
      title: content.title,
      reason,
      notes
    },
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Content rejected successfully'
  });
}));

// @route   GET /api/admin/reports
// @desc    Get reported content
// @access  Private (Moderator+)
router.get('/reports', requireModerator, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status = 'pending', 
    type, 
    priority 
  } = req.query;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(
        id,
        username,
        full_name
      ),
      reported_user:reported_user_id(
        id,
        username,
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('content_type', type);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }

  const { data: reports, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch reports');
  }

  res.json({
    success: true,
    data: {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   PUT /api/admin/reports/:id/resolve
// @desc    Resolve a report
// @access  Private (Moderator+)
router.put('/reports/:id/resolve', requireModerator, validate(adminSchemas.resolveReport), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action_taken, notes } = req.body;

  const { data: report, error } = await supabaseAdmin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_by: req.user.id,
      resolved_at: new Date().toISOString(),
      action_taken,
      moderator_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      reporter:reporter_id(
        id,
        username,
        email
      )
    `)
    .single();

  if (error) {
    throw notFoundError('Report');
  }

  // Send notification to reporter
  await supabaseAdmin.from('notifications').insert({
    id: crypto.randomUUID(),
    recipient_id: report.reporter.id,
    sender_id: req.user.id,
    type: 'report_resolved',
    title: 'Your report has been resolved',
    message: `Thank you for your report. We have taken appropriate action: ${action_taken}`,
    created_at: new Date().toISOString()
  });

  // Log admin action
  await supabaseAdmin.from('admin_actions').insert({
    id: crypto.randomUUID(),
    admin_id: req.user.id,
    action_type: 'report_resolve',
    target_type: 'report',
    target_id: id,
    details: {
      action_taken,
      notes,
      content_type: report.content_type,
      content_id: report.content_id
    },
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Report resolved successfully',
    data: {
      report
    }
  });
}));

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin only)
router.get('/analytics', requireAdmin, asyncHandler(async (req, res) => {
  const { timeframe = '30d', metric } = req.query;
  
  // This would typically integrate with an analytics service
  // For now, return basic metrics from the database
  
  const analytics = {
    user_growth: {
      // User registration trends
    },
    content_creation: {
      // Content creation trends
    },
    engagement: {
      // User engagement metrics
    },
    revenue: {
      // Revenue analytics if applicable
    }
  };

  res.json({
    success: true,
    data: {
      analytics,
      timeframe
    }
  });
}));

// @route   GET /api/admin/logs
// @desc    Get admin action logs
// @access  Private (Admin only)
router.get('/logs', requireAdmin, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    admin_id, 
    action_type, 
    target_type 
  } = req.query;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('admin_actions')
    .select(`
      *,
      admin:admin_id(
        id,
        username,
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (admin_id) {
    query = query.eq('admin_id', admin_id);
  }
  if (action_type) {
    query = query.eq('action_type', action_type);
  }
  if (target_type) {
    query = query.eq('target_type', target_type);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch admin logs');
  }

  res.json({
    success: true,
    data: {
      logs,
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