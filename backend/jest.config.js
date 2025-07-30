// ==============================================
// EV Community Platform - Jest Configuration
// ==============================================
// Comprehensive test configuration for Node.js backend

module.exports = {
  // ==============================================
  // BASIC CONFIGURATION
  // ==============================================
  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/src/**/__tests__/**/*.js',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.spec.js'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/'
  ],

  // ==============================================
  // COVERAGE CONFIGURATION
  // ==============================================
  // Collect coverage information
  collectCoverage: false, // Set to true when running coverage

  // Coverage directory
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/__tests__/**',
    '!src/server.js', // Exclude server startup file
    '!**/node_modules/**',
    '!**/vendor/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // ==============================================
  // SETUP AND TEARDOWN
  // ==============================================
  // Setup files (run once before all tests)
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Global setup (run once before all test suites)
  // globalSetup: '<rootDir>/tests/globalSetup.js',

  // Global teardown (run once after all test suites)
  // globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // ==============================================
  // MODULE CONFIGURATION
  // ==============================================
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],

  // Module directories
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // Module name mapping (for path aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // ==============================================
  // TRANSFORM CONFIGURATION
  // ==============================================
  // Transform files (if using TypeScript or other transpilers)
  transform: {
    // '^.+\\.ts$': 'ts-jest', // Uncomment if using TypeScript
  },

  // Files to transform
  transformIgnorePatterns: [
    '/node_modules/(?!(some-es6-module)/)', // Transform specific ES6 modules if needed
  ],

  // ==============================================
  // ENVIRONMENT VARIABLES
  // ==============================================
  // Set environment variables for tests
  setupFiles: [
    '<rootDir>/tests/env.js'
  ],

  // ==============================================
  // TIMING AND PERFORMANCE
  // ==============================================
  // Test timeout (in milliseconds)
  testTimeout: 30000,

  // Slow test threshold
  slowTestThreshold: 5,

  // Maximum number of concurrent workers
  maxWorkers: '50%',

  // ==============================================
  // REPORTING
  // ==============================================
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'EV Community Backend Tests'
      }
    ]
  ],

  // Verbose output
  verbose: true,

  // ==============================================
  // ERROR HANDLING
  // ==============================================
  // Stop on first failure
  bail: false,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Detect leaked timers
  detectLeaks: false,

  // ==============================================
  // MOCKING
  // ==============================================
  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: false,

  // Restore mocks between tests
  restoreMocks: false,

  // ==============================================
  // WATCH MODE
  // ==============================================
  // Watch mode configuration
  watchman: true,

  // Files to ignore in watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    '/logs/'
  ],

  // ==============================================
  // CUSTOM CONFIGURATION
  // ==============================================
  // Custom globals
  globals: {
    'process.env.NODE_ENV': 'test'
  },

  // ==============================================
  // ADVANCED OPTIONS
  // ==============================================
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Error on deprecated features
  errorOnDeprecated: true,

  // Notify mode (for watch mode)
  notify: false,

  // Notify mode (for watch mode)
  notifyMode: 'failure-change',

  // ==============================================
  // CUSTOM MATCHERS
  // ==============================================
  // Add custom matchers if needed
  // setupFilesAfterEnv: ['<rootDir>/tests/customMatchers.js'],

  // ==============================================
  // DEBUGGING
  // ==============================================
  // Enable debugging (uncomment for debugging)
  // verbose: true,
  // detectOpenHandles: true,
  // forceExit: false,

  // ==============================================
  // INTEGRATION TEST CONFIGURATION
  // ==============================================
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js']
    }
  ]
};

// ==============================================
// USAGE EXAMPLES
// ==============================================
// Run all tests:
//   npm test
//
// Run tests in watch mode:
//   npm run test:watch
//
// Run tests with coverage:
//   npm run test:coverage
//
// Run specific test file:
//   npm test -- auth.test.js
//
// Run tests matching pattern:
//   npm test -- --testNamePattern="should login"
//
// Run tests for specific project:
//   npm test -- --selectProjects=unit
//
// Debug tests:
//   node --inspect-brk node_modules/.bin/jest --runInBand
//
// ==============================================
// ENVIRONMENT VARIABLES FOR TESTING
// ==============================================
// Set these in your CI/CD pipeline:
// - CI=true (enables CI mode)
// - NODE_ENV=test
// - JWT_SECRET=test_secret
// - SUPABASE_URL=test_url
// - SUPABASE_ANON_KEY=test_key
//
// ==============================================
// TROUBLESHOOTING
// ==============================================
// Common issues and solutions:
//
// 1. Tests hanging:
//    - Set forceExit: true
//    - Use detectOpenHandles: true to find leaks
//
// 2. Memory issues:
//    - Reduce maxWorkers
//    - Use --runInBand for debugging
//
// 3. Async issues:
//    - Increase testTimeout
//    - Ensure proper async/await usage
//
// 4. Module resolution:
//    - Check moduleNameMapper
//    - Verify file extensions
//
// 5. Coverage issues:
//    - Check collectCoverageFrom patterns
//    - Verify file paths
//