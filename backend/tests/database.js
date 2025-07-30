// ==============================================
// EV Community Platform - Test Database Setup
// ==============================================
// Database utilities and setup for testing

const { createClient } = require('@supabase/supabase-js');
const { cleanupTestData, createTestUser, createTestVehicle } = require('./utils');

// ==============================================
// DATABASE CLIENT SETUP
// ==============================================

let supabaseClient = null;

/**
 * Initialize Supabase client for testing
 * @returns {Object} Supabase client
 */
const initializeTestDatabase = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration for tests');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  return supabaseClient;
};

/**
 * Get the test database client
 * @returns {Object} Supabase client
 */
const getTestDatabase = () => {
  if (!supabaseClient) {
    return initializeTestDatabase();
  }
  return supabaseClient;
};

// ==============================================
// DATABASE SETUP AND TEARDOWN
// ==============================================

/**
 * Setup test database before all tests
 * @returns {Promise<void>}
 */
const setupTestDatabase = async () => {
  try {
    console.log('🔧 Setting up test database...');
    
    const supabase = initializeTestDatabase();
    
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    // Clean up any existing test data
    await cleanupTestData(supabase);
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    throw error;
  }
};

/**
 * Teardown test database after all tests
 * @returns {Promise<void>}
 */
const teardownTestDatabase = async () => {
  try {
    console.log('🧹 Cleaning up test database...');
    
    if (supabaseClient) {
      await cleanupTestData(supabaseClient);
    }
    
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error.message);
    // Don't throw error in teardown to avoid masking test failures
  }
};

/**
 * Reset test database between tests
 * @returns {Promise<void>}
 */
const resetTestDatabase = async () => {
  try {
    const supabase = getTestDatabase();
    await cleanupTestData(supabase);
  } catch (error) {
    console.warn('⚠️ Test database reset failed:', error.message);
  }
};

// ==============================================
// TEST DATA SEEDING
// ==============================================

/**
 * Seed basic test data
 * @returns {Promise<Object>} Seeded data
 */
const seedTestData = async () => {
  const supabase = getTestDatabase();
  const seededData = {
    users: [],
    vehicles: [],
    categories: [],
    posts: []
  };

  try {
    // Create test users
    const testUser = await createTestUser(supabase, {
      email: 'testuser@example.com',
      username: 'testuser',
      role: 'user'
    });
    seededData.users.push(testUser);

    const testAdmin = await createTestUser(supabase, {
      email: 'testadmin@example.com',
      username: 'testadmin',
      role: 'admin'
    });
    seededData.users.push(testAdmin);

    // Create test vehicles
    const testVehicle = await createTestVehicle(supabase, testUser.id, {
      make: 'Tesla',
      model: 'Model 3',
      year: 2023
    });
    seededData.vehicles.push(testVehicle);

    // Create forum categories
    const categories = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'General Discussion',
        description: 'General EV discussions',
        slug: 'general-discussion',
        isActive: true,
        sortOrder: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Vehicle Reviews',
        description: 'Share your vehicle reviews',
        slug: 'vehicle-reviews',
        isActive: true,
        sortOrder: 2
      }
    ];

    for (const category of categories) {
      const { data, error } = await supabase
        .from('forum_categories')
        .upsert([category])
        .select()
        .single();
      
      if (!error && data) {
        seededData.categories.push(data);
      }
    }

    console.log('✅ Test data seeded successfully');
    return seededData;
  } catch (error) {
    console.error('❌ Test data seeding failed:', error.message);
    throw error;
  }
};

// ==============================================
// DATABASE QUERY HELPERS
// ==============================================

/**
 * Execute a raw SQL query (for advanced testing)
 * @param {String} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const executeQuery = async (query, params = []) => {
  const supabase = getTestDatabase();
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query,
      params
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Query execution failed:', error.message);
    throw error;
  }
};

/**
 * Count records in a table
 * @param {String} table - Table name
 * @param {Object} filters - Optional filters
 * @returns {Promise<Number>} Record count
 */
const countRecords = async (table, filters = {}) => {
  const supabase = getTestDatabase();
  
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { count, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Count records failed for table ${table}:`, error.message);
    throw error;
  }
};

/**
 * Check if a record exists
 * @param {String} table - Table name
 * @param {Object} filters - Filters to check
 * @returns {Promise<Boolean>} Whether record exists
 */
const recordExists = async (table, filters) => {
  const count = await countRecords(table, filters);
  return count > 0;
};

/**
 * Get a single record by ID
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @returns {Promise<Object|null>} Record or null
 */
const getRecordById = async (table, id) => {
  const supabase = getTestDatabase();
  
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error(`Get record failed for table ${table}, id ${id}:`, error.message);
    throw error;
  }
};

/**
 * Delete a record by ID
 * @param {String} table - Table name
 * @param {String} id - Record ID
 * @returns {Promise<Boolean>} Whether deletion was successful
 */
const deleteRecordById = async (table, id) => {
  const supabase = getTestDatabase();
  
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Delete record failed for table ${table}, id ${id}:`, error.message);
    return false;
  }
};

// ==============================================
// DATABASE TRANSACTION HELPERS
// ==============================================

/**
 * Execute multiple operations in a transaction-like manner
 * @param {Array} operations - Array of operation functions
 * @returns {Promise<Array>} Results of all operations
 */
const executeTransaction = async (operations) => {
  const results = [];
  const rollbackOperations = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
      
      // Store rollback operation if provided
      if (operation.rollback) {
        rollbackOperations.push(operation.rollback);
      }
    }
    
    return results;
  } catch (error) {
    // Attempt to rollback completed operations
    console.warn('Transaction failed, attempting rollback...');
    
    for (const rollback of rollbackOperations.reverse()) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Rollback operation failed:', rollbackError.message);
      }
    }
    
    throw error;
  }
};

// ==============================================
// DATABASE HEALTH CHECKS
// ==============================================

/**
 * Check database health
 * @returns {Promise<Object>} Health status
 */
const checkDatabaseHealth = async () => {
  const supabase = getTestDatabase();
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
};

/**
 * Wait for database to be ready
 * @param {Number} maxAttempts - Maximum retry attempts
 * @param {Number} delay - Delay between attempts (ms)
 * @returns {Promise<void>}
 */
const waitForDatabase = async (maxAttempts = 10, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const health = await checkDatabaseHealth();
      
      if (health.status === 'healthy') {
        console.log(`✅ Database ready after ${attempt} attempt(s)`);
        return;
      }
      
      console.log(`⏳ Database not ready (attempt ${attempt}/${maxAttempts}), retrying...`);
    } catch (error) {
      console.log(`⏳ Database connection failed (attempt ${attempt}/${maxAttempts}):`, error.message);
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Database not ready after ${maxAttempts} attempts`);
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
  // Client management
  initializeTestDatabase,
  getTestDatabase,
  
  // Setup and teardown
  setupTestDatabase,
  teardownTestDatabase,
  resetTestDatabase,
  
  // Data seeding
  seedTestData,
  
  // Query helpers
  executeQuery,
  countRecords,
  recordExists,
  getRecordById,
  deleteRecordById,
  
  // Transaction helpers
  executeTransaction,
  
  // Health checks
  checkDatabaseHealth,
  waitForDatabase
};