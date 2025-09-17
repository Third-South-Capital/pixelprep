/**
 * Test Runner for PixelPrep Sharp POC
 * Orchestrates both user journey and bug prevention tests
 */

import { runUserJourneyTests } from './user-journey.test.js';
import { runBugPreventionTests } from './bug-prevention.test.js';

interface TestRunnerOptions {
  testImagePath?: string;
  outputDir?: string;
  runUserJourney?: boolean;
  runBugPrevention?: boolean;
  verbose?: boolean;
}

export class TestRunner {
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      testImagePath: './test-images/sample-image.png',
      outputDir: './output/comprehensive-tests',
      runUserJourney: true,
      runBugPrevention: true,
      verbose: false,
      ...options
    };
  }

  async runAllTests(): Promise<void> {
    console.log("🧪 PixelPrep Comprehensive Test Suite");
    console.log("=====================================");
    console.log(`Test Image: ${this.options.testImagePath}`);
    console.log(`Output Directory: ${this.options.outputDir}`);
    console.log("");

    const startTime = Date.now();
    let userJourneySuccess = true;
    let bugPreventionSuccess = true;

    try {
      // Run User Journey Tests
      if (this.options.runUserJourney) {
        console.log("🚀 STARTING USER JOURNEY TESTS");
        console.log("===============================");

        try {
          await runUserJourneyTests(this.options.testImagePath, this.options.outputDir);
          console.log("\n✅ User Journey Tests Completed");
        } catch (error) {
          userJourneySuccess = false;
          console.error(`\n❌ User Journey Tests Failed: ${error}`);
        }
      }

      // Run Bug Prevention Tests
      if (this.options.runBugPrevention) {
        console.log("\n\n🐛 STARTING BUG PREVENTION TESTS");
        console.log("=================================");

        try {
          await runBugPreventionTests(this.options.outputDir);
          console.log("\n✅ Bug Prevention Tests Completed");
        } catch (error) {
          bugPreventionSuccess = false;
          console.error(`\n❌ Bug Prevention Tests Failed: ${error}`);
        }
      }

      // Final Summary
      const totalTime = Date.now() - startTime;
      console.log("\n" + "=".repeat(50));
      console.log("🏁 COMPREHENSIVE TEST SUITE SUMMARY");
      console.log("=".repeat(50));

      console.log(`Total Runtime: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);

      if (this.options.runUserJourney) {
        console.log(`User Journey Tests: ${userJourneySuccess ? '✅ PASSED' : '❌ FAILED'}`);
      }

      if (this.options.runBugPrevention) {
        console.log(`Bug Prevention Tests: ${bugPreventionSuccess ? '✅ PASSED' : '❌ FAILED'}`);
      }

      const overallSuccess = userJourneySuccess && bugPreventionSuccess;
      console.log(`\nOverall Result: ${overallSuccess ? '🎉 ALL TESTS PASSED' : '🚨 SOME TESTS FAILED'}`);

      if (!overallSuccess) {
        console.log("\n⚠️  ATTENTION REQUIRED:");
        if (!userJourneySuccess) {
          console.log("- User Journey tests failed - user experience may be broken");
        }
        if (!bugPreventionSuccess) {
          console.log("- Bug Prevention tests failed - known issues may have regressed");
        }
        console.log("\nPlease review the detailed test output above and fix failing tests.");
      } else {
        console.log("\n🎯 READY FOR PRODUCTION:");
        console.log("- All user expectations are met");
        console.log("- No known bugs have regressed");
        console.log("- System is functioning as expected");
      }

      // Exit with appropriate code for CI/CD
      if (!overallSuccess) {
        process.exit(1);
      }

    } catch (error) {
      console.error(`\n💥 Test Runner Fatal Error: ${error}`);
      process.exit(1);
    }
  }

  // Run only critical tests (fast subset)
  async runCriticalTests(): Promise<void> {
    console.log("⚡ PixelPrep Critical Tests (Fast Mode)");
    console.log("=======================================");

    // Import the test suites dynamically for specific critical tests
    const { UserJourneyTestSuite } = await import('./user-journey.test.js');
    const { BugPreventionTestSuite } = await import('./bug-prevention.test.js');

    const userSuite = new UserJourneyTestSuite(this.options.testImagePath, this.options.outputDir);
    const bugSuite = new BugPreventionTestSuite(this.options.outputDir);

    // This would require refactoring the test suites to support running individual tests
    console.log("Critical test mode not yet implemented. Run full tests with 'npm run test:full'");
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--image':
        options.testImagePath = args[++i];
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--user-journey-only':
        options.runUserJourney = true;
        options.runBugPrevention = false;
        break;
      case '--bug-prevention-only':
        options.runUserJourney = false;
        options.runBugPrevention = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
PixelPrep Test Runner

Usage: node dist/tests/test-runner.js [options]

Options:
  --image <path>          Path to test image (default: ./test-images/sample-image.png)
  --output <dir>          Output directory for test files (default: ./output/comprehensive-tests)
  --user-journey-only     Run only user journey tests
  --bug-prevention-only   Run only bug prevention tests
  --verbose              Enable verbose output
  --help                 Show this help message

Examples:
  node dist/tests/test-runner.js
  node dist/tests/test-runner.js --image ./my-test-image.jpg --verbose
  node dist/tests/test-runner.js --user-journey-only
        `);
        process.exit(0);
        break;
    }
  }

  const runner = new TestRunner(options);

  if (args.includes('--critical')) {
    await runner.runCriticalTests();
  } else {
    await runner.runAllTests();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}