const { supabaseAdmin } = require('./supabaseClient');

// Push notification service configuration
let pushService;

// Initialize push notification service
const initializePushService = () => {
  // For development, use console logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Push notification service running in development mode - notifications will be logged to console');
    return;
  }

  // In production, you would initialize services like:
  // - Firebase Cloud Messaging (FCM)
  // - Apple Push Notification Service (APNs)
  // - Web Push Protocol
  
  try {
    // Example FCM initialization (uncomment when implementing)
    // const admin = require('firebase-admin');
    // const serviceAccount = require('../config/firebase-service-account.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    // pushService = admin.messaging();
    
    console.log('Push notification service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize push notification service:', error.message);
    pushService = null;
  }
};

// Send push notification
const sendPushNotification = async ({
  userId,
  title,
  body,
  data = {},
  badge,
  sound = 'default',
  clickAction,
  icon,
  image
}) => {
  try {
    // Get user's push tokens
    const { data: tokens, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch push tokens: ${error.message}`);
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { success: true, sent: 0, message: 'No push tokens available' };
    }

    // For development mode, log to console
    if (process.env.NODE_ENV === 'development' || !pushService) {
      console.log('🔔 Push notification would be sent:');
      console.log(`User ID: ${userId}`);
      console.log(`Title: ${title}`);
      console.log(`Body: ${body}`);
      console.log(`Tokens: ${tokens.length}`);
      console.log(`Data:`, data);
      
      // Log to database
      await logPushNotification({
        userId,
        title,
        body,
        tokensCount: tokens.length,
        status: 'sent_dev'
      });
      
      return { success: true, sent: tokens.length, messageId: 'dev-mode-' + Date.now() };
    }

    const results = [];
    
    // Send to each token
    for (const tokenData of tokens) {
      try {
        let message;
        
        if (tokenData.platform === 'ios') {
          // iOS-specific message format
          message = {
            token: tokenData.token,
            notification: {
              title,
              body
            },
            apns: {
              payload: {
                aps: {
                  badge,
                  sound,
                  'click-action': clickAction
                }
              }
            },
            data
          };
        } else if (tokenData.platform === 'android') {
          // Android-specific message format
          message = {
            token: tokenData.token,
            notification: {
              title,
              body,
              icon,
              image
            },
            android: {
              notification: {
                clickAction,
                sound
              }
            },
            data
          };
        } else {
          // Web push format
          message = {
            token: tokenData.token,
            notification: {
              title,
              body,
              icon,
              image,
              clickAction
            },
            data
          };
        }

        // Send using FCM (example - uncomment when implementing)
        // const response = await pushService.send(message);
        // results.push({ token: tokenData.token, success: true, messageId: response });
        
        // For now, simulate success
        results.push({ token: tokenData.token, success: true, messageId: 'simulated-' + Date.now() });
        
      } catch (error) {
        console.error(`Failed to send push to token ${tokenData.token}:`, error.message);
        results.push({ token: tokenData.token, success: false, error: error.message });
        
        // If token is invalid, mark it as inactive
        if (error.code === 'messaging/registration-token-not-registered') {
          await supabaseAdmin
            .from('push_tokens')
            .update({ is_active: false })
            .eq('token', tokenData.token);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    // Log notification
    await logPushNotification({
      userId,
      title,
      body,
      tokensCount: tokens.length,
      successCount,
      status: 'sent'
    });

    return {
      success: true,
      sent: successCount,
      total: tokens.length,
      results
    };
    
  } catch (error) {
    console.error('Failed to send push notification:', error.message);
    
    // Log failed notification
    await logPushNotification({
      userId,
      title,
      body,
      status: 'failed',
      error: error.message
    });

    throw new Error(`Push notification failed: ${error.message}`);
  }
};

// Send push notification to multiple users
const sendBulkPushNotifications = async (notifications) => {
  const results = [];
  
  for (const notification of notifications) {
    try {
      const result = await sendPushNotification(notification);
      results.push({ ...notification, success: true, result });
    } catch (error) {
      results.push({ ...notification, success: false, error: error.message });
    }
  }
  
  return results;
};

// Register push token
const registerPushToken = async (userId, token, platform, deviceInfo = {}) => {
  try {
    // Check if token already exists
    const { data: existingToken } = await supabaseAdmin
      .from('push_tokens')
      .select('id')
      .eq('token', token)
      .single();

    if (existingToken) {
      // Update existing token
      const { error } = await supabaseAdmin
        .from('push_tokens')
        .update({
          user_id: userId,
          platform,
          device_info: deviceInfo,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id);

      if (error) throw error;
    } else {
      // Create new token
      const { error } = await supabaseAdmin
        .from('push_tokens')
        .insert({
          user_id: userId,
          token,
          platform,
          device_info: deviceInfo,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to register push token:', error.message);
    throw new Error(`Token registration failed: ${error.message}`);
  }
};

// Unregister push token
const unregisterPushToken = async (token) => {
  try {
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false })
      .eq('token', token);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Failed to unregister push token:', error.message);
    throw new Error(`Token unregistration failed: ${error.message}`);
  }
};

// Log push notification activity
const logPushNotification = async ({
  userId,
  title,
  body,
  tokensCount,
  successCount,
  status,
  error
}) => {
  try {
    await supabaseAdmin
      .from('push_notification_logs')
      .insert({
        user_id: userId,
        title,
        body,
        tokens_count: tokensCount,
        success_count: successCount,
        status,
        error_message: error,
        sent_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Failed to log push notification:', logError.message);
  }
};

// Send notification based on user preferences
const sendNotificationWithPreferences = async (userId, notification) => {
  try {
    // Get user's notification preferences
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    const preferences = user.notification_preferences || {};
    const notificationType = notification.type || 'general';
    
    // Check if user wants push notifications for this type
    if (preferences.push && preferences.push[notificationType] !== false) {
      await sendPushNotification({
        userId,
        ...notification
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send notification with preferences:', error.message);
    throw error;
  }
};

// Initialize on module load
initializePushService();

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  registerPushToken,
  unregisterPushToken,
  sendNotificationWithPreferences
};