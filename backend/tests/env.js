// ==============================================
// EV Community Platform - Test Environment
// ==============================================
// Environment variable configuration for tests

// ==============================================
// CORE ENVIRONMENT SETUP
// ==============================================
// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// ==============================================
// SERVER CONFIGURATION
// ==============================================
process.env.PORT = process.env.PORT || '5001'; // Different port for tests
process.env.HOST = process.env.HOST || 'localhost';

// ==============================================
// JWT CONFIGURATION
// ==============================================
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_purposes_only_do_not_use_in_production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_for_testing_purposes_only';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ==============================================
// SUPABASE CONFIGURATION
// ==============================================
// Use test Supabase instance or mock values
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test_anon_key_for_testing';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key_for_testing';

// ==============================================
// EMAIL CONFIGURATION
// ==============================================
// Use test SMTP settings (MailHog, Ethereal, or mock)
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
process.env.SMTP_PORT = process.env.SMTP_PORT || '1025'; // MailHog default port
process.env.SMTP_SECURE = process.env.SMTP_SECURE || 'false';
process.env.SMTP_USER = process.env.SMTP_USER || 'test@example.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'test_password';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@evcommunity.com';

// ==============================================
// CORS CONFIGURATION
// ==============================================
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

// ==============================================
// FILE UPLOAD CONFIGURATION
// ==============================================
process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '10485760'; // 10MB
process.env.ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain';
process.env.MAX_FILES_PER_UPLOAD = process.env.MAX_FILES_PER_UPLOAD || '5';
process.env.AVATAR_MAX_SIZE = process.env.AVATAR_MAX_SIZE || '2097152'; // 2MB
process.env.AVATAR_ALLOWED_TYPES = process.env.AVATAR_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp';

// ==============================================
// RATE LIMITING CONFIGURATION
// ==============================================
// Relaxed rate limiting for tests
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000'; // High limit for tests
process.env.AUTH_RATE_LIMIT_WINDOW_MS = process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '100'; // High limit for tests
process.env.UPLOAD_RATE_LIMIT_MAX = process.env.UPLOAD_RATE_LIMIT_MAX || '50';

// ==============================================
// SECURITY CONFIGURATION
// ==============================================
process.env.MIN_PASSWORD_LENGTH = process.env.MIN_PASSWORD_LENGTH || '8';
process.env.REQUIRE_PASSWORD_UPPERCASE = process.env.REQUIRE_PASSWORD_UPPERCASE || 'true';
process.env.REQUIRE_PASSWORD_LOWERCASE = process.env.REQUIRE_PASSWORD_LOWERCASE || 'true';
process.env.REQUIRE_PASSWORD_NUMBERS = process.env.REQUIRE_PASSWORD_NUMBERS || 'true';
process.env.REQUIRE_PASSWORD_SYMBOLS = process.env.REQUIRE_PASSWORD_SYMBOLS || 'false';

process.env.SESSION_TIMEOUT_MINUTES = process.env.SESSION_TIMEOUT_MINUTES || '60';
process.env.MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS || '5';
process.env.LOCKOUT_DURATION_MINUTES = process.env.LOCKOUT_DURATION_MINUTES || '15';

// ==============================================
// LOGGING CONFIGURATION
// ==============================================
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error'; // Minimal logging in tests
process.env.LOG_FILE_PATH = process.env.LOG_FILE_PATH || 'tests/logs/test.log';
process.env.LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '10m';
process.env.LOG_MAX_FILES = process.env.LOG_MAX_FILES || '3';

// ==============================================
// CACHE CONFIGURATION
// ==============================================
// Redis configuration for tests (use different DB or mock)
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1'; // Use DB 1 for tests
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
process.env.CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS || '300'; // 5 minutes for tests

// ==============================================
// DATABASE CONFIGURATION
// ==============================================
process.env.DB_POOL_MIN = process.env.DB_POOL_MIN || '1';
process.env.DB_POOL_MAX = process.env.DB_POOL_MAX || '5'; // Smaller pool for tests
process.env.DB_TIMEOUT = process.env.DB_TIMEOUT || '10000'; // 10 seconds

// ==============================================
// FEATURE FLAGS
// ==============================================
// Enable all features for comprehensive testing
process.env.ENABLE_USER_REGISTRATION = process.env.ENABLE_USER_REGISTRATION || 'true';
process.env.ENABLE_EMAIL_VERIFICATION = process.env.ENABLE_EMAIL_VERIFICATION || 'false'; // Disable for tests
process.env.ENABLE_PASSWORD_RESET = process.env.ENABLE_PASSWORD_RESET || 'true';
process.env.ENABLE_FILE_UPLOADS = process.env.ENABLE_FILE_UPLOADS || 'true';
process.env.ENABLE_PUSH_NOTIFICATIONS = process.env.ENABLE_PUSH_NOTIFICATIONS || 'false';
process.env.ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS || 'false';
process.env.ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING || 'false'; // Disable for tests
process.env.ENABLE_ADMIN_PANEL = process.env.ENABLE_ADMIN_PANEL || 'true';
process.env.ENABLE_FORUM = process.env.ENABLE_FORUM || 'true';
process.env.ENABLE_MARKETPLACE = process.env.ENABLE_MARKETPLACE || 'true';
process.env.ENABLE_BLOG = process.env.ENABLE_BLOG || 'true';
process.env.ENABLE_MESSAGING = process.env.ENABLE_MESSAGING || 'true';
process.env.ENABLE_REVIEWS = process.env.ENABLE_REVIEWS || 'true';

// ==============================================
// DEVELOPMENT CONFIGURATION
// ==============================================
process.env.ENABLE_CORS_ALL = process.env.ENABLE_CORS_ALL || 'true'; // Allow all origins in tests
process.env.ENABLE_REQUEST_LOGGING = process.env.ENABLE_REQUEST_LOGGING || 'false'; // Disable for cleaner test output
process.env.ENABLE_ERROR_STACK_TRACE = process.env.ENABLE_ERROR_STACK_TRACE || 'true';
process.env.ENABLE_TEST_ROUTES = process.env.ENABLE_TEST_ROUTES || 'true'; // Enable test-specific routes

// ==============================================
// API CONFIGURATION
// ==============================================
process.env.API_VERSION = process.env.API_VERSION || 'v1';
process.env.API_PREFIX = process.env.API_PREFIX || '/api';

// ==============================================
// EXTERNAL SERVICES (MOCKED)
// ==============================================
// Mock external API keys for testing
process.env.PUSH_NOTIFICATION_KEY = process.env.PUSH_NOTIFICATION_KEY || 'test_push_key';
process.env.PUSH_NOTIFICATION_SECRET = process.env.PUSH_NOTIFICATION_SECRET || 'test_push_secret';
process.env.ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY || 'test_analytics_key';
process.env.GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID || 'GA-TEST123456';
process.env.CHARGING_STATION_API_KEY = process.env.CHARGING_STATION_API_KEY || 'test_charging_api_key';
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test_maps_api_key';
process.env.VEHICLE_DATA_API_KEY = process.env.VEHICLE_DATA_API_KEY || 'test_vehicle_api_key';

// ==============================================
// MONITORING CONFIGURATION
// ==============================================
process.env.MONITORING_ENABLED = process.env.MONITORING_ENABLED || 'false';
process.env.MONITORING_API_KEY = process.env.MONITORING_API_KEY || 'test_monitoring_key';
process.env.HEALTH_CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL || '60000'; // 1 minute

// ==============================================
// BACKUP CONFIGURATION
// ==============================================
process.env.BACKUP_ENABLED = process.env.BACKUP_ENABLED || 'false';
process.env.BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 2 * * *';
process.env.BACKUP_RETENTION_DAYS = process.env.BACKUP_RETENTION_DAYS || '7'; // Shorter retention for tests
process.env.BACKUP_STORAGE_PATH = process.env.BACKUP_STORAGE_PATH || 'tests/backups/';

// ==============================================
// CONTENT MODERATION
// ==============================================
process.env.ENABLE_AUTO_MODERATION = process.env.ENABLE_AUTO_MODERATION || 'false';
process.env.MODERATION_API_KEY = process.env.MODERATION_API_KEY || 'test_moderation_key';
process.env.AUTO_APPROVE_TRUSTED_USERS = process.env.AUTO_APPROVE_TRUSTED_USERS || 'true';
process.env.MODERATION_CONFIDENCE_THRESHOLD = process.env.MODERATION_CONFIDENCE_THRESHOLD || '0.8';

// ==============================================
// SEARCH CONFIGURATION
// ==============================================
process.env.ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
process.env.ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME || 'elastic';
process.env.ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || 'test_password';
process.env.SEARCH_INDEX_PREFIX = process.env.SEARCH_INDEX_PREFIX || 'test_ev_community';

// ==============================================
// PAYMENT CONFIGURATION (MOCKED)
// ==============================================
process.env.STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY || 'pk_test_test_stripe_public_key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_test_stripe_secret_key';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret';
process.env.PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'test_paypal_client_id';
process.env.PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'test_paypal_client_secret';

// ==============================================
// SOCIAL MEDIA INTEGRATION (MOCKED)
// ==============================================
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test_google_client_id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test_google_client_secret';
process.env.FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || 'test_facebook_app_id';
process.env.FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'test_facebook_app_secret';
process.env.TWITTER_API_KEY = process.env.TWITTER_API_KEY || 'test_twitter_api_key';
process.env.TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || 'test_twitter_api_secret';

// ==============================================
// TEST-SPECIFIC CONFIGURATION
// ==============================================
// Test database configuration
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.SUPABASE_URL;
process.env.TEST_DATABASE_RESET = process.env.TEST_DATABASE_RESET || 'false'; // Whether to reset DB before tests

// Test user credentials
process.env.TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'testuser@example.com';
process.env.TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
process.env.TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@example.com';
process.env.TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';

// Test timeouts
process.env.TEST_TIMEOUT = process.env.TEST_TIMEOUT || '30000'; // 30 seconds
process.env.TEST_SETUP_TIMEOUT = process.env.TEST_SETUP_TIMEOUT || '60000'; // 1 minute
process.env.TEST_TEARDOWN_TIMEOUT = process.env.TEST_TEARDOWN_TIMEOUT || '30000'; // 30 seconds

// ==============================================
// VALIDATION
// ==============================================
// Validate critical environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables for tests:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\nPlease check your test environment configuration.');
  process.exit(1);
}

// ==============================================
// LOGGING
// ==============================================
if (process.env.NODE_ENV === 'test' && process.env.ENABLE_REQUEST_LOGGING !== 'true') {
  console.log('🧪 Test environment configured successfully');
  console.log(`   - Node Environment: ${process.env.NODE_ENV}`);
  console.log(`   - Test Port: ${process.env.PORT}`);
  console.log(`   - Database: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`   - JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
}

// ==============================================
// EXPORT CONFIGURATION
// ==============================================
module.exports = {
  // Export commonly used test configuration
  testConfig: {
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    supabaseUrl: process.env.SUPABASE_URL,
    testTimeout: parseInt(process.env.TEST_TIMEOUT),
    testUser: {
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD
    },
    testAdmin: {
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD
    }
  }
};