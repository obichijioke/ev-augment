// ==============================================
// EV Community Platform - Test Runner
// ==============================================
// Comprehensive test runner with setup and teardown

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  // Test suites to run
  suites: [
    'auth.test.js',
    'users.test.js', 
    'vehicles.test.js',
    'charging.test.js',
    'forum.test.js',
    'marketplace.test.js',
    'notifications.test.js',
    'admin.test.js'
  ],
  
  // Test options
  options: {
    verbose: true,
    coverage: false,
    watch: false,
    bail: false,
    parallel: false,
    maxWorkers: 1 // Sequential execution for integration tests
  }
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...TEST_CONFIG.options };
  
  args.forEach(arg => {
    switch (arg) {
      case '--coverage':
        config.coverage = true;
        break;
      case '--watch':
        config.watch = true;
        break;
      case '--bail':
        config.bail = true;
        break;
      case '--parallel':
        config.parallel = true;
        config.maxWorkers = 4;
        break;
      case '--silent':
        config.verbose = false;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--suite=')) {
          const suite = arg.split('=')[1];
          if (TEST_CONFIG.suites.includes(suite)) {
            TEST_CONFIG.suites = [suite];
          } else {
            console.error(`❌ Unknown test suite: ${suite}`);
            process.exit(1);
          }
        }
    }
  });
  
  return config;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🧪 EV Community Platform Test Runner
`);
  console.log('Usage: node tests/runTests.js [options]\n');
  console.log('Options:');
  console.log('  --coverage     Generate test coverage report');
  console.log('  --watch        Run tests in watch mode');
  console.log('  --bail         Stop on first test failure');
  console.log('  --parallel     Run tests in parallel');
  console.log('  --silent       Reduce output verbosity');
  console.log('  --suite=<name> Run specific test suite');
  console.log('  --help         Show this help message\n');
  console.log('Available test suites:');
  TEST_CONFIG.suites.forEach(suite => {
    console.log(`  - ${suite}`);
  });
  console.log('');
}

/**
 * Check if required environment variables are set
 */
function checkEnvironment() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease check your .env file or environment configuration.');
    return false;
  }
  
  return true;
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  // Check if test database is accessible
  try {
    const { getTestDatabase } = require('./database');
    const supabase = getTestDatabase();
    
    // Test database connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Failed to connect to test database:', error.message);
      return false;
    }
    
    console.log('✅ Test database connection verified');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error.message);
    return false;
  }
  
  return true;
}

/**
 * Run Jest with specified configuration
 */
function runJest(config) {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--config', path.join(__dirname, '..', 'jest.config.js'),
      '--testPathPattern', 'tests/',
      '--maxWorkers', config.maxWorkers.toString()
    ];
    
    // Add conditional arguments
    if (config.coverage) {
      jestArgs.push('--coverage');
    }
    
    if (config.watch) {
      jestArgs.push('--watch');
    }
    
    if (config.bail) {
      jestArgs.push('--bail');
    }
    
    if (config.verbose) {
      jestArgs.push('--verbose');
    } else {
      jestArgs.push('--silent');
    }
    
    // Add specific test files if running single suite
    if (TEST_CONFIG.suites.length === 1) {
      jestArgs.push('--testNamePattern', TEST_CONFIG.suites[0].replace('.test.js', ''));
    }
    
    console.log('🚀 Starting test execution...');
    console.log(`📋 Running ${TEST_CONFIG.suites.length} test suite(s)`);
    
    if (config.verbose) {
      console.log('🔧 Jest arguments:', jestArgs.join(' '));
    }
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All tests completed successfully!');
        resolve(code);
      } else {
        console.log(`\n❌ Tests failed with exit code ${code}`);
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      console.error('❌ Failed to start Jest:', error.message);
      reject(error);
    });
  });
}

/**
 * Generate test report
 */
function generateTestReport(config) {
  if (!config.coverage) return;
  
  const coverageDir = path.join(__dirname, '..', 'coverage');
  const reportPath = path.join(coverageDir, 'lcov-report', 'index.html');
  
  if (fs.existsSync(reportPath)) {
    console.log('\n📊 Coverage report generated:');
    console.log(`   file://${reportPath}`);
  }
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    const { resetTestDatabase } = require('./database');
    await resetTestDatabase();
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.warn('⚠️  Failed to cleanup test database:', error.message);
  }
}

/**
 * Main test runner function
 */
async function runTests() {
  const startTime = Date.now();
  
  try {
    // Parse command line arguments
    const config = parseArgs();
    
    console.log('🧪 EV Community Platform Test Runner\n');
    
    // Check environment
    if (!checkEnvironment()) {
      process.exit(1);
    }
    
    // Setup test environment
    if (!await setupTestEnvironment()) {
      process.exit(1);
    }
    
    // Run tests
    await runJest(config);
    
    // Generate reports
    generateTestReport(config);
    
    // Cleanup
    if (!config.watch) {
      await cleanupTestEnvironment();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total execution time: ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    
    // Cleanup on failure
    try {
      await cleanupTestEnvironment();
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Test execution interrupted');
  try {
    await cleanupTestEnvironment();
  } catch (error) {
    console.warn('⚠️  Cleanup failed:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Test execution terminated');
  try {
    await cleanupTestEnvironment();
  } catch (error) {
    console.warn('⚠️  Cleanup failed:', error.message);
  }
  process.exit(0);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  parseArgs,
  checkEnvironment,
  setupTestEnvironment,
  cleanupTestEnvironment
};