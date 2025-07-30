// ==============================================
// EV Community Platform - Test Sequencer
// ==============================================
// Custom test sequencer to run tests in optimal order

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Sort test files to run in optimal order
   * - Database and utility tests first
   * - Authentication tests early (other tests depend on auth)
   * - Core feature tests in dependency order
   * - Admin tests last (they may modify system state)
   */
  sort(tests) {
    // Define test order priority
    const testOrder = [
      'setup.test.js',
      'database.test.js', 
      'utils.test.js',
      'app.test.js',
      'auth.test.js',
      'users.test.js',
      'vehicles.test.js',
      'charging.test.js',
      'forum.test.js',
      'marketplace.test.js',
      'notifications.test.js',
      'admin.test.js'
    ];

    // Sort tests based on defined order
    return tests.sort((testA, testB) => {
      const getTestName = (test) => {
        const parts = test.path.split(/[\\/]/);
        return parts[parts.length - 1];
      };

      const nameA = getTestName(testA);
      const nameB = getTestName(testB);

      const indexA = testOrder.indexOf(nameA);
      const indexB = testOrder.indexOf(nameB);

      // If both tests are in the order list, sort by index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one test is in the order list, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither test is in the order list, sort alphabetically
      return nameA.localeCompare(nameB);
    });
  }
}

module.exports = CustomSequencer;