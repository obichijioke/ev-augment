import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../services/supabaseClient';
import { authenticateToken, requireModerator, AuthenticatedRequest } from '../middleware/auth';
import { validate, notificationSchemas } from '../middleware/validation';
import { asyncHandler, notFoundError, forbiddenError, validationError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';
import { sendPushNotification } from '../services/pushNotificationService';
import { toString, toNumber } from '../utils/typeUtils';

// TypeScript interfaces
interface NotificationsQuery {
  page?: string;
  limit?: string;
  type?: string;
  is_read?: string;
  priority?: string;
}

interface CreateNotificationRequest {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
}

interface NotificationParams {
  id: string;
}

interface UpdatePreferencesRequest {
  email_notifications?: boolean;
  email_all?: boolean;
  push_notifications?: boolean;
  forum_replies?: boolean;
  marketplace_messages?: boolean;
  review_responses?: boolean;
  system_updates?: boolean;
  marketing_emails?: boolean;
}

interface BroadcastRequest {
  title: string;
  message: string;
  priority?: string;
  action_url?: string;
  user_filter?: any;
  send_email?: boolean;
  send_push?: boolean;
}

interface TestNotificationRequest {
  recipient_id?: string;
  type?: string;
}

const router: express.Router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest<{}, any, any, NotificationsQuery>, res: Response) => {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    is_read, 
    priority 
  } = req.query;
  
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabaseAdmin
    .from('notifications')
    .select(`
      *,
      sender:sender_id(
        id,
        username,
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('recipient_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type) {
    query = query.eq('type', type);
  }
  if (is_read !== undefined) {
    query = query.eq('is_read', is_read === 'true');
  }
  if (priority) {
    query = query.eq('priority', priority);
  }

  const { data: notifications, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch notifications');
  }

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    }
  });
}));

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', req.user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error('Failed to fetch unread count');
  }

  res.json({
    success: true,
    data: {
      unread_count: count
    }
  });
}));

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private (Recipient only)
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      *,
      sender:sender_id(
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw notFoundError('Notification');
  }

  // Check if user is the recipient
  if (notification.recipient_id !== req.user.id) {
    throw forbiddenError('You can only access your own notifications');
  }

  // Mark as read if not already read
  if (!notification.is_read) {
    await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    notification.is_read = true;
    notification.read_at = new Date().toISOString();
  }

  res.json({
    success: true,
    data: {
      notification
    }
  });
}));

// @route   POST /api/notifications
// @desc    Create a new notification (Admin/System only)
// @access  Private (Moderator only)
router.post('/', authenticateToken, requireModerator, validate(notificationSchemas.create), asyncHandler(async (req: AuthenticatedRequest<{}, any, CreateNotificationRequest>, res: Response) => {
  const {
    recipient_id,
    type,
    title,
    message,
    priority = 'medium',
    action_url,
    entity_type,
    entity_id,
    metadata
  } = req.body;

  // Verify recipient exists
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from('users')
    .select('id, username, email, notification_preferences')
    .eq('id', recipient_id)
    .single();

  if (recipientError) {
    throw validationError('Invalid recipient');
  }

  // Create notification
  const notificationData = {
    id: crypto.randomUUID(),
    recipient_id,
    sender_id: req.user.id,
    type,
    title,
    message,
    priority,
    action_url,
    entity_type,
    entity_id,
    metadata,
    created_at: new Date().toISOString()
  };

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert(notificationData)
    .select(`
      *,
      sender:sender_id(
        id,
        username,
        full_name,
        avatar_url
      ),
      recipient:recipient_id(
        id,
        username,
        full_name,
        email
      )
    `)
    .single();

  if (error) {
    throw new Error('Failed to create notification');
  }

  // Send additional notifications based on user preferences
  try {
    const preferences = recipient.notification_preferences || {};
    
    // Send email notification if enabled
    if (preferences.email_notifications && (priority === 'high' || preferences.email_all)) {
      await sendEmail({
        to: recipient.email,
        subject: title,
        template: 'notification',
        templateData: {
          title,
          message,
          action_url,
          recipient_name: recipient.username
        }
      });
    }

    // Send push notification if enabled
    if (preferences.push_notifications) {
      await sendPushNotification({
        userId: recipient_id,
        title,
        body: message,
        data: {
          notification_id: notification.id,
          action_url,
          type
        }
      });
    }
  } catch (notificationError) {
    console.error('Failed to send additional notifications:', notificationError);
    // Don't fail the request if additional notifications fail
  }

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: {
      notification
    }
  });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Recipient only)
router.put('/:id/read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if notification exists and user is the recipient
  const { data: notification, error: checkError } = await supabaseAdmin
    .from('notifications')
    .select('recipient_id, is_read')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Notification');
  }

  if (notification.recipient_id !== req.user.id) {
    throw forbiddenError('You can only mark your own notifications as read');
  }

  if (notification.is_read) {
    return res.json({
      success: true,
      message: 'Notification already marked as read'
    });
  }

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to mark notification as read');
  }

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('recipient_id', req.user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error('Failed to mark notifications as read');
  }

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (Recipient only)
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if notification exists and user is the recipient
  const { data: notification, error: checkError } = await supabaseAdmin
    .from('notifications')
    .select('recipient_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Notification');
  }

  if (notification.recipient_id !== req.user.id) {
    throw forbiddenError('You can only delete your own notifications');
  }

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete notification');
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all read notifications
// @access  Private
router.delete('/clear-all', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('recipient_id', req.user.id)
    .eq('is_read', true);

  if (error) {
    throw new Error('Failed to clear notifications');
  }

  res.json({
    success: true,
    message: 'All read notifications cleared'
  });
}));

// @route   GET /api/notifications/preferences
// @desc    Get user's notification preferences
// @access  Private
router.get('/preferences', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('notification_preferences')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new Error('Failed to fetch notification preferences');
  }

  const defaultPreferences = {
    email_notifications: true,
    email_all: false,
    push_notifications: true,
    forum_replies: true,
    marketplace_messages: true,
    review_responses: true,
    system_updates: true,
    marketing_emails: false
  };

  const preferences = { ...defaultPreferences, ...(user.notification_preferences || {}) };

  res.json({
    success: true,
    data: {
      preferences
    }
  });
}));

// @route   PUT /api/notifications/preferences
// @desc    Update user's notification preferences
// @access  Private
router.put('/preferences', authenticateToken, validate(notificationSchemas.updatePreferences), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const preferences = req.body;

  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update({ 
      notification_preferences: preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select('notification_preferences')
    .single();

  if (error) {
    throw new Error('Failed to update notification preferences');
  }

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      preferences: updatedUser.notification_preferences
    }
  });
}));

// @route   POST /api/notifications/broadcast
// @desc    Send broadcast notification to all users
// @access  Private (Moderator only)
router.post('/broadcast', authenticateToken, requireModerator, validate(notificationSchemas.broadcast), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    message,
    priority = 'medium',
    action_url,
    user_filter = {},
    send_email = false,
    send_push = false
  } = req.body;

  // Build user query based on filter
  let userQuery = supabaseAdmin
    .from('users')
    .select('id, username, email, notification_preferences')
    .eq('is_active', true);

  if (user_filter.role) {
    userQuery = userQuery.eq('role', user_filter.role);
  }
  if (user_filter.created_after) {
    userQuery = userQuery.gte('created_at', user_filter.created_after);
  }
  if (user_filter.has_vehicles) {
    // This would require a more complex query or separate filtering
  }

  const { data: users, error: userError } = await userQuery;

  if (userError) {
    throw new Error('Failed to fetch users for broadcast');
  }

  if (users.length === 0) {
    return res.json({
      success: true,
      message: 'No users match the filter criteria',
      data: {
        sent_count: 0
      }
    });
  }

  // Create notifications for all users
  const notifications = users.map(user => ({
    id: crypto.randomUUID(),
    recipient_id: user.id,
    sender_id: req.user.id,
    type: 'system',
    title,
    message,
    priority,
    action_url,
    created_at: new Date().toISOString()
  }));

  const { error: notificationError } = await supabaseAdmin
    .from('notifications')
    .insert(notifications);

  if (notificationError) {
    throw new Error('Failed to create broadcast notifications');
  }

  // Send additional notifications if requested
  let emailCount = 0;
  let pushCount = 0;

  if (send_email || send_push) {
    for (const user of users) {
      const preferences = user.notification_preferences || {};
      
      try {
        // Send email if requested and user has email notifications enabled
        if (send_email && preferences.email_notifications) {
          await sendEmail({
            to: user.email,
            subject: title,
            template: 'broadcast',
            templateData: {
              title,
              message,
              action_url,
              recipient_name: user.username
            }
          });
          emailCount++;
        }

        // Send push notification if requested and user has push notifications enabled
        if (send_push && preferences.push_notifications) {
          await sendPushNotification({
            userId: user.id,
            title,
            body: message,
            data: {
              action_url,
              type: 'broadcast'
            }
          });
          pushCount++;
        }
      } catch (error) {
        console.error(`Failed to send additional notification to user ${user.id}:`, error);
        // Continue with other users
      }
    }
  }

  res.status(201).json({
    success: true,
    message: 'Broadcast notification sent successfully',
    data: {
      sent_count: users.length,
      email_count: emailCount,
      push_count: pushCount
    }
  });
}));

// @route   GET /api/notifications/types
// @desc    Get available notification types
// @access  Private
router.get('/types', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notificationTypes = [
    { value: 'message', label: 'New Message', description: 'Someone sent you a private message' },
    { value: 'forum_reply', label: 'Forum Reply', description: 'Someone replied to your forum post' },
    { value: 'marketplace_inquiry', label: 'Marketplace Inquiry', description: 'Someone inquired about your listing' },
    { value: 'wanted_response', label: 'Wanted Ad Response', description: 'Someone responded to your wanted ad' },
    { value: 'review_received', label: 'Review Received', description: 'Someone left you a review' },
    { value: 'like_received', label: 'Like Received', description: 'Someone liked your content' },
    { value: 'system', label: 'System Notification', description: 'Important system updates and announcements' },
    { value: 'account', label: 'Account Notification', description: 'Account-related notifications' },
    { value: 'security', label: 'Security Alert', description: 'Security-related notifications' },
    { value: 'promotion', label: 'Promotion', description: 'Promotional content and offers' }
  ];

  res.json({
    success: true,
    data: {
      types: notificationTypes
    }
  });
}));

// @route   POST /api/notifications/test
// @desc    Send test notification (Development only)
// @access  Private (Moderator only)
router.post('/test', authenticateToken, requireModerator, asyncHandler(async (req: AuthenticatedRequest<{}, any, TestNotificationRequest>, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    throw forbiddenError('Test notifications are not available in production');
  }

  const { recipient_id = req.user.id, type = 'system' } = req.body;

  const testNotification = {
    id: crypto.randomUUID(),
    recipient_id,
    sender_id: req.user.id,
    type,
    title: 'Test Notification',
    message: 'This is a test notification sent from the API.',
    priority: 'medium',
    created_at: new Date().toISOString()
  };

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert(testNotification)
    .select('*')
    .single();

  if (error) {
    throw new Error('Failed to create test notification');
  }

  res.status(201).json({
    success: true,
    message: 'Test notification sent successfully',
    data: {
      notification
    }
  });
}));

export default router;