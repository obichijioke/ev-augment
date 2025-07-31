import express from 'express';
import { supabaseAdmin } from '../services/supabaseClient';
import { validate, messageSchemas, commonSchemas } from '../middleware/validation';
import { asyncHandler, notFoundError, forbiddenError, validationError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { buildPagination, isValidUUID } from '../services/supabaseClient';
import { toString, toNumber } from '../utils/typeUtils';
import { AuthenticatedRequest } from '../types';

// TypeScript interfaces
interface MessagesQuery {
  page?: string;
  limit?: string;
}

interface CreateMessageRequest {
  recipient_id: string;
  subject: string;
  content: string;
  context_type?: string;
  context_id?: string;
}

interface ConversationParams {
  userId: string;
}

interface MessageParams {
  id: string;
}

interface SearchQuery {
  q: string;
  page?: string;
  limit?: string;
}

interface BulkReadRequest {
  message_ids: string[];
}

const router: express.Router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticateToken, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  // Get conversations where user is either sender or recipient
  const { data: conversations, error, count } = await supabaseAdmin
    .from('messages')
    .select(`
      id,
      sender_id,
      recipient_id,
      subject,
      content,
      is_read,
      created_at,
      updated_at,
      sender:users!messages_sender_id_fkey(username, full_name, avatar_url, is_verified),
      recipient:users!messages_recipient_id_fkey(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch conversations');
  }

  // Group messages by conversation (sender-recipient pair)
  const conversationMap = new Map();
  
  conversations.forEach(message => {
    // Create a consistent conversation key regardless of who sent the message
    const participants = [message.sender_id, message.recipient_id].sort();
    const conversationKey = participants.join('-');
    
    if (!conversationMap.has(conversationKey)) {
      // Determine the other participant
      const otherParticipant = message.sender_id === req.user.id 
        ? message.recipient 
        : message.sender;
      
      conversationMap.set(conversationKey, {
        conversation_id: conversationKey,
        other_participant: otherParticipant,
        latest_message: message,
        unread_count: 0,
        total_messages: 0
      });
    }
    
    const conversation = conversationMap.get(conversationKey);
    
    // Update latest message if this one is newer
    if (new Date(message.created_at) > new Date(conversation.latest_message.created_at)) {
      conversation.latest_message = message;
    }
    
    // Count unread messages (where current user is recipient and message is unread)
    if (message.recipient_id === req.user.id && !message.is_read) {
      conversation.unread_count++;
    }
    
    conversation.total_messages++;
  });

  const conversationList = Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime());

  res.json({
    success: true,
    data: {
      conversations: conversationList,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: conversationList.length,
        pages: Math.ceil(conversationList.length / toNumber(limit, 20))
      }
    }
  });
}));

// @route   GET /api/messages/conversation/:userId
// @desc    Get messages in a conversation with a specific user
// @access  Private
router.get('/conversation/:userId', authenticateToken, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  // Check if the other user exists
  const { data: otherUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, username, full_name, avatar_url, is_verified')
    .eq('id', userId)
    .single();

  if (userError) {
    throw notFoundError('User');
  }

  // Get messages between current user and specified user
  const { data: messages, error, count } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(username, full_name, avatar_url, is_verified),
      recipient:users!messages_recipient_id_fkey(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${req.user.id})`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch conversation messages');
  }

  // Mark messages as read where current user is recipient
  const unreadMessageIds = messages
    .filter(msg => msg.recipient_id === req.user.id && !msg.is_read)
    .map(msg => msg.id);

  if (unreadMessageIds.length > 0) {
    await supabaseAdmin
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .in('id', unreadMessageIds);

    // Update the messages in our response
    messages.forEach(msg => {
      if (unreadMessageIds.includes(msg.id)) {
        msg.is_read = true;
        msg.read_at = new Date().toISOString();
      }
    });
  }

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // Reverse to show oldest first
      other_user: otherUser,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      }
    }
  });
}));

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', authenticateToken, validate(messageSchemas.create), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { recipient_id, subject, content, context_type, context_id } = req.body;

  if (!isValidUUID(recipient_id)) {
    throw validationError('Invalid recipient ID format');
  }

  // Prevent users from messaging themselves
  if (recipient_id === req.user.id) {
    throw validationError('You cannot send a message to yourself');
  }

  // Check if recipient exists
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from('users')
    .select('id, username, full_name')
    .eq('id', recipient_id)
    .single();

  if (recipientError) {
    throw notFoundError('Recipient user');
  }

  // Validate context if provided
  if (context_type && context_id) {
    if (!isValidUUID(context_id)) {
      throw validationError('Invalid context ID format');
    }

    // Verify context exists based on type
    let contextExists = false;
    switch (context_type) {
      case 'marketplace_listing':
        const { data: listing } = await supabaseAdmin
          .from('marketplace_listings')
          .select('id')
          .eq('id', context_id)
          .single();
        contextExists = !!listing;
        break;
      case 'wanted_ad':
        const { data: wantedAd } = await supabaseAdmin
          .from('wanted_ads')
          .select('id')
          .eq('id', context_id)
          .single();
        contextExists = !!wantedAd;
        break;
      case 'directory_listing':
        const { data: directory } = await supabaseAdmin
          .from('directory_listings')
          .select('id')
          .eq('id', context_id)
          .single();
        contextExists = !!directory;
        break;
      case 'vehicle':
        const { data: vehicle } = await supabaseAdmin
          .from('vehicles')
          .select('id')
          .eq('id', context_id)
          .single();
        contextExists = !!vehicle;
        break;
      default:
        throw validationError('Invalid context type');
    }

    if (!contextExists) {
      throw notFoundError('Context item');
    }
  }

  const messageData = {
    sender_id: req.user.id,
    recipient_id,
    subject,
    content,
    context_type: context_type || null,
    context_id: context_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert(messageData)
    .select(`
      *,
      sender:users!messages_sender_id_fkey(username, full_name, avatar_url, is_verified),
      recipient:users!messages_recipient_id_fkey(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to send message');
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: {
      message
    }
  });
}));

// @route   GET /api/messages/:id
// @desc    Get message by ID
// @access  Private (Sender or Recipient only)
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid message ID format');
  }

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(username, full_name, avatar_url, is_verified),
      recipient:users!messages_recipient_id_fkey(username, full_name, avatar_url, is_verified)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    throw notFoundError('Message');
  }

  // Check if user is sender or recipient
  if (message.sender_id !== req.user.id && message.recipient_id !== req.user.id) {
    throw forbiddenError('You can only view your own messages');
  }

  // Mark as read if current user is recipient and message is unread
  if (message.recipient_id === req.user.id && !message.is_read) {
    await supabaseAdmin
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    message.is_read = true;
    message.read_at = new Date().toISOString();
  }

  res.json({
    success: true,
    data: {
      message
    }
  });
}));

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private (Recipient only)
router.put('/:id/read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid message ID format');
  }

  // Check if message exists and user is recipient
  const { data: message, error: checkError } = await supabaseAdmin
    .from('messages')
    .select('id, recipient_id, is_read')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (checkError) {
    throw notFoundError('Message');
  }

  if (message.recipient_id !== req.user.id) {
    throw forbiddenError('You can only mark your own messages as read');
  }

  if (message.is_read) {
    return res.json({
      success: true,
      message: 'Message is already marked as read'
    });
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to mark message as read');
  }

  res.json({
    success: true,
    message: 'Message marked as read successfully'
  });
}));

// @route   PUT /api/messages/conversation/:userId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/conversation/:userId/read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { userId } = req.params;

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  // Mark all unread messages from this user as read
  const { data: updatedMessages, error } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('sender_id', userId)
    .eq('recipient_id', req.user.id)
    .eq('is_read', false)
    .eq('is_active', true)
    .select('id');

  if (error) {
    throw new Error('Failed to mark messages as read');
  }

  res.json({
    success: true,
    message: `${updatedMessages.length} messages marked as read`,
    data: {
      updated_count: updatedMessages.length
    }
  });
}));

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private (Sender or Recipient)
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid message ID format');
  }

  // Check if message exists and user has permission
  const { data: message, error: checkError } = await supabaseAdmin
    .from('messages')
    .select('id, sender_id, recipient_id')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (checkError) {
    throw notFoundError('Message');
  }

  if (message.sender_id !== req.user.id && message.recipient_id !== req.user.id) {
    throw forbiddenError('You can only delete your own messages');
  }

  // Soft delete by setting is_active to false
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete message');
  }

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
}));

// @route   GET /api/messages/unread/count
// @desc    Get unread message count for current user
// @access  Private
router.get('/unread/count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { data: unreadMessages, error } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('recipient_id', req.user.id)
    .eq('is_read', false)
    .eq('is_active', true);

  if (error) {
    throw new Error('Failed to fetch unread message count');
  }

  res.json({
    success: true,
    data: {
      unread_count: unreadMessages.length
    }
  });
}));

// @route   GET /api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', authenticateToken, validate(commonSchemas.search, 'query'), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { q, page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!q || q.trim().length < 2) {
    throw validationError('Search query must be at least 2 characters long');
  }

  const { data: messages, error, count } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(username, full_name, avatar_url, is_verified),
      recipient:users!messages_recipient_id_fkey(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
    .or(`subject.ilike.%${q}%,content.ilike.%${q}%`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to search messages');
  }

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page: toNumber(page, 1),
        limit: toNumber(limit, 20),
        total: count,
        pages: Math.ceil(count / toNumber(limit, 20))
      },
      query: q
    }
  });
}));

// @route   POST /api/messages/bulk-read
// @desc    Mark multiple messages as read
// @access  Private
router.post('/bulk-read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { message_ids } = req.body;

  if (!Array.isArray(message_ids) || message_ids.length === 0) {
    throw validationError('message_ids must be a non-empty array');
  }

  // Validate all IDs are UUIDs
  const invalidIds = message_ids.filter(id => !isValidUUID(id));
  if (invalidIds.length > 0) {
    throw validationError('All message IDs must be valid UUIDs');
  }

  // Only mark messages as read where current user is recipient
  const { data: updatedMessages, error } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .in('id', message_ids)
    .eq('recipient_id', req.user.id)
    .eq('is_read', false)
    .eq('is_active', true)
    .select('id');

  if (error) {
    throw new Error('Failed to mark messages as read');
  }

  res.json({
    success: true,
    message: `${updatedMessages.length} messages marked as read`,
    data: {
      updated_count: updatedMessages.length,
      updated_ids: updatedMessages.map(msg => msg.id)
    }
  });
}));

// @route   DELETE /api/messages/conversation/:userId
// @desc    Delete entire conversation with a user
// @access  Private
router.delete('/conversation/:userId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { userId } = req.params;

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  // Soft delete all messages in conversation
  const { data: deletedMessages, error } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${req.user.id})`)
    .eq('is_active', true)
    .select('id');

  if (error) {
    throw new Error('Failed to delete conversation');
  }

  res.json({
    success: true,
    message: 'Conversation deleted successfully',
    data: {
      deleted_count: deletedMessages.length
    }
  });
}));

export default router;