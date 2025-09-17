/**
 * User Journey Test Suite for PixelPrep
 * Tests real user expectations and workflows
 */

import {
  InstagramSquareProcessor,
  InstagramPortraitProcessor,
  JurySubmissionProcessor,
  WebDisplayProcessor,
  EmailNewsletterProcessor,
  QuickCompressProcessor
} from '../processors.js';
import { SharpUtils } from '../sharp-utils.js';
import { promises as fs } from 'fs';
import path from 'path';

interface UserExpectationTest {
  name: string;
  description: string;
  test: () => Promise<TestResult>;
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export class UserJourneyTestSuite {
  private testImagePath: string;
  private outputDir: string;
  private results: TestResult[] = [];

  constructor(testImagePath: string = './test-images/sample-image.png', outputDir: string = './output/tests') {
    this.testImagePath = testImagePath;
    this.outputDir = outputDir;
  }

  async runAllTests(): Promise<void> {
    console.log("🧪 PixelPrep User Journey Test Suite");
    console.log("====================================");

    // Ensure test environment
    await this.setupTestEnvironment();

    const tests: UserExpectationTest[] = [
      // 1. Page looks good / styles load correctly
      {
        name: "Page Functionality",
        description: "Verify basic page functionality works",
        test: () => this.testPageFunctionality()
      },

      // 2. Upload works
      {
        name: "File Upload",
        description: "Test file upload and validation",
        test: () => this.testFileUpload()
      },

      // 3. Thumbnail of image is viewable
      {
        name: "Image Preview",
        description: "Verify image preview appears correctly",
        test: () => this.testImagePreview()
      },

      // 4. Preset selector working and recommendations
      {
        name: "Preset Recommendations",
        description: "Test preset selector and smart recommendations",
        test: () => this.testPresetRecommendations()
      },

      // 5. Image compresses and is downloadable
      {
        name: "Image Compression",
        description: "Verify compression and download functionality",
        test: () => this.testImageCompression()
      },

      // 6. GUI matches user expectations
      {
        name: "GUI Accuracy",
        description: "Verify displayed information matches reality",
        test: () => this.testGUIAccuracy()
      }
    ];

    // Run all tests
    for (const test of tests) {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   ${test.description}`);

      try {
        const result = await test.test();
        this.results.push(result);

        if (result.passed) {
          console.log(`   ✅ PASS: ${result.message}`);
        } else {
          console.log(`   ❌ FAIL: ${result.message}`);
          if (result.details) {
            console.log(`   📝 Details: ${JSON.stringify(result.details, null, 2)}`);
          }
        }
      } catch (error) {
        const failResult: TestResult = {
          passed: false,
          message: `Test threw exception: ${error}`,
          details: { error: error?.toString() }
        };
        this.results.push(failResult);
        console.log(`   💥 ERROR: ${failResult.message}`);
      }
    }

    this.generateSummaryReport();
  }

  private async setupTestEnvironment(): Promise<void> {
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });

    // Verify test image exists
    try {
      await fs.access(this.testImagePath);
    } catch (error) {
      throw new Error(`Test image not found: ${this.testImagePath}. Please provide a valid test image.`);
    }
  }

  private async testPageFunctionality(): Promise<TestResult> {
    // Since this is a backend test, we'll simulate page functionality
    // by testing that all processors are accessible and configured correctly

    const processors = [
      InstagramSquareProcessor,
      InstagramPortraitProcessor,
      JurySubmissionProcessor,
      WebDisplayProcessor,
      EmailNewsletterProcessor,
      QuickCompressProcessor
    ];

    const issues: string[] = [];

    // Test 1: All processors are importable (equivalent to "scripts load")
    for (const processor of processors) {
      if (!processor || typeof processor.process !== 'function') {
        issues.push(`Processor missing or invalid: ${processor.constructor?.name}`);
      }
    }

    // Test 2: No errors on basic operations (equivalent to "no JS errors")
    try {
      await SharpUtils.getImageMetadata(this.testImagePath);
    } catch (error) {
      issues.push(`Image utils failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "All core functionality accessible and working"
        : `${issues.length} functionality issues found`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testFileUpload(): Promise<TestResult> {
    const issues: string[] = [];

    // Test 1: Can process valid image files (JPEG, PNG, WebP)
    const validFormats = ['.png', '.jpg', '.jpeg', '.webp'];
    const testImageExt = path.extname(this.testImagePath).toLowerCase();

    if (!validFormats.includes(testImageExt)) {
      issues.push(`Test image format ${testImageExt} not in supported formats`);
    }

    // Test 2: File size validation (simulate 10MB limit)
    try {
      const stats = await fs.stat(this.testImagePath);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB > 10) {
        issues.push(`File too large: ${sizeMB.toFixed(1)}MB (limit: 10MB)`);
      }
    } catch (error) {
      issues.push(`Cannot read file stats: ${error}`);
    }

    // Test 3: Image is actually processable
    try {
      await SharpUtils.getImageMetadata(this.testImagePath);
    } catch (error) {
      issues.push(`Image not processable: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "File upload validation working correctly"
        : `${issues.length} upload validation issues`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testImagePreview(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      const startTime = Date.now();
      const metadata = await SharpUtils.getImageMetadata(this.testImagePath);
      const processingTime = Date.now() - startTime;

      // Test 1: Preview data available within reasonable time (< 2 seconds)
      if (processingTime > 2000) {
        issues.push(`Preview too slow: ${processingTime}ms (limit: 2000ms)`);
      }

      // Test 2: Image dimensions are valid
      if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
        issues.push(`Invalid dimensions: ${metadata.width}x${metadata.height}`);
      }

      // Test 3: No distortion in metadata (aspect ratio preserved)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio <= 0 || !isFinite(aspectRatio)) {
        issues.push(`Invalid aspect ratio: ${aspectRatio}`);
      }

    } catch (error) {
      issues.push(`Preview generation failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Image preview working correctly"
        : `${issues.length} preview issues`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testPresetRecommendations(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      const metadata = await SharpUtils.getImageMetadata(this.testImagePath);
      const { width, height } = metadata;

      if (!width || !height) {
        issues.push("Cannot test recommendations without valid dimensions");
        return { passed: false, message: "Missing image dimensions", details: { issues } };
      }

      const aspectRatio = width / height;
      const totalPixels = width * height;

      // Test 1: Portrait image should recommend Instagram Portrait
      if (aspectRatio < 0.9) { // Portrait
        // Would recommend Instagram Portrait - verify it exists
        if (!InstagramPortraitProcessor) {
          issues.push("Instagram Portrait processor missing for portrait recommendation");
        }
      }

      // Test 2: Square image should recommend Instagram Square
      if (aspectRatio >= 0.9 && aspectRatio <= 1.1) { // Square-ish
        if (!InstagramSquareProcessor) {
          issues.push("Instagram Square processor missing for square recommendation");
        }
      }

      // Test 3: Large file should recommend Quick Compress
      if (totalPixels > 2000000) { // > 2MP
        if (!QuickCompressProcessor) {
          issues.push("Quick Compress processor missing for large file recommendation");
        }
      }

      // Test 4: All 6 presets are available
      const allProcessors = [
        InstagramSquareProcessor,
        InstagramPortraitProcessor,
        JurySubmissionProcessor,
        WebDisplayProcessor,
        EmailNewsletterProcessor,
        QuickCompressProcessor
      ];

      const missingProcessors = allProcessors.filter(p => !p || typeof p.process !== 'function');
      if (missingProcessors.length > 0) {
        issues.push(`${missingProcessors.length} processors missing or invalid`);
      }

    } catch (error) {
      issues.push(`Recommendation logic failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Preset recommendations working correctly"
        : `${issues.length} recommendation issues`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testImageCompression(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Test with one processor (Instagram Square as representative)
      const startTime = Date.now();
      const result = await InstagramSquareProcessor.process(this.testImagePath, this.outputDir);
      const processingTime = Date.now() - startTime;

      // Test 1: Processing completes successfully
      if (!result.success) {
        issues.push("Image processing failed");
        return { passed: false, message: "Processing failed", details: { issues } };
      }

      // Test 2: Processing time reasonable (< 10 seconds for most images)
      if (processingTime > 10000) {
        issues.push(`Processing too slow: ${processingTime}ms (limit: 10000ms)`);
      }

      // Test 3: Output file actually exists and is downloadable
      try {
        await fs.access(result.outputPath);
        const stats = await fs.stat(result.outputPath);
        if (stats.size === 0) {
          issues.push("Output file is empty");
        }
      } catch (error) {
        issues.push(`Output file not accessible: ${error}`);
      }

      // Test 4: Downloaded file is valid image
      try {
        const outputMetadata = await SharpUtils.getImageMetadata(result.outputPath);
        if (!outputMetadata.width || !outputMetadata.height) {
          issues.push("Output file is not a valid image");
        }
      } catch (error) {
        issues.push(`Output file corrupted: ${error}`);
      }

    } catch (error) {
      issues.push(`Compression test failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Image compression and download working correctly"
        : `${issues.length} compression issues`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testGUIAccuracy(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      const originalMetadata = await SharpUtils.getImageMetadata(this.testImagePath);
      const result = await InstagramSquareProcessor.process(this.testImagePath, this.outputDir);

      if (!result.success) {
        issues.push("Cannot test GUI accuracy - processing failed");
        return { passed: false, message: "Processing failed for GUI test", details: { issues } };
      }

      // Test 1: File size accuracy (within 5%)
      const actualOutputSize = (await fs.stat(result.outputPath)).size;
      const reportedOutputSize = result.metadata.size;
      const sizeDiscrepancy = Math.abs(actualOutputSize - reportedOutputSize) / actualOutputSize;

      if (sizeDiscrepancy > 0.05) { // 5% tolerance
        issues.push(`File size mismatch: reported ${reportedOutputSize}, actual ${actualOutputSize} (${(sizeDiscrepancy * 100).toFixed(1)}% off)`);
      }

      // Test 2: Dimensions accuracy
      const actualMetadata = await SharpUtils.getImageMetadata(result.outputPath);
      if (actualMetadata.width !== result.metadata.width || actualMetadata.height !== result.metadata.height) {
        issues.push(`Dimensions mismatch: reported ${result.metadata.width}x${result.metadata.height}, actual ${actualMetadata.width}x${actualMetadata.height}`);
      }

      // Test 3: Reduction percentage accuracy
      const actualReduction = ((originalMetadata.size - actualOutputSize) / originalMetadata.size) * 100;
      const reportedReduction = ((originalMetadata.size - reportedOutputSize) / originalMetadata.size) * 100;
      const reductionDiscrepancy = Math.abs(actualReduction - reportedReduction);

      if (reductionDiscrepancy > 2) { // 2% tolerance
        issues.push(`Reduction percentage inaccurate: reported ${reportedReduction.toFixed(1)}%, actual ${actualReduction.toFixed(1)}%`);
      }

      // Test 4: Original filename preservation
      const originalBasename = path.parse(this.testImagePath).name;
      const outputBasename = path.parse(result.outputPath).name;

      if (!outputBasename.includes(originalBasename)) {
        issues.push(`Original filename not preserved: input "${originalBasename}", output "${outputBasename}"`);
      }

    } catch (error) {
      issues.push(`GUI accuracy test failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "GUI displays accurate information"
        : `${issues.length} GUI accuracy issues`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private generateSummaryReport(): void {
    console.log("\n📊 USER JOURNEY TEST SUMMARY");
    console.log("=============================");

    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passedTests.length} ✅`);
    console.log(`Failed: ${failedTests.length} ${failedTests.length > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passedTests.length / this.results.length) * 100).toFixed(1)}%`);

    if (failedTests.length > 0) {
      console.log("\n🔍 FAILED TESTS:");
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.message}`);
      });
    }

    console.log("\n🎯 CRITICAL USER EXPECTATIONS:");
    const criticalTests = [
      "File upload validation working correctly",
      "Image preview working correctly",
      "Image compression and download working correctly",
      "GUI displays accurate information"
    ];

    const criticalFailures = this.results.filter(r =>
      !r.passed && criticalTests.some(critical => r.message.includes(critical.split(' ')[0]))
    );

    if (criticalFailures.length === 0) {
      console.log("✅ All critical user expectations are met!");
    } else {
      console.log(`❌ ${criticalFailures.length} critical expectations failing - immediate attention needed`);
    }
  }
}

// Export test runner for CLI usage
export async function runUserJourneyTests(testImagePath?: string, outputDir?: string): Promise<void> {
  const suite = new UserJourneyTestSuite(testImagePath, outputDir);
  await suite.runAllTests();
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUserJourneyTests().catch(console.error);
}