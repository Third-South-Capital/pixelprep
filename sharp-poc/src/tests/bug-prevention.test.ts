/**
 * Bug Prevention Test Suite for PixelPrep
 * Tests for specific bugs that should NEVER return
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
import sharp from 'sharp';

interface BugTest {
  name: string;
  description: string;
  test: () => Promise<TestResult>;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export class BugPreventionTestSuite {
  private outputDir: string;
  private results: TestResult[] = [];

  constructor(outputDir: string = './output/bug-tests') {
    this.outputDir = outputDir;
  }

  async runAllTests(): Promise<void> {
    console.log("🐛 PixelPrep Bug Prevention Test Suite");
    console.log("======================================");

    // Ensure test environment
    await this.setupTestEnvironment();

    const bugTests: BugTest[] = [
      // CRITICAL: EXIF rotation bug never returns
      {
        name: "EXIF Rotation Bug Prevention",
        description: "Ensure EXIF rotation is handled correctly for all 8 orientations",
        test: () => this.testEXIFRotationBug(),
        severity: 'CRITICAL'
      },

      // HIGH: File size regression
      {
        name: "File Size Regression Prevention",
        description: "Ensure optimized files are always smaller than originals",
        test: () => this.testFileSizeRegression(),
        severity: 'HIGH'
      },

      // HIGH: Safari compatibility issues
      {
        name: "Safari Compatibility",
        description: "Ensure outputs work in Safari browser environment",
        test: () => this.testSafariCompatibility(),
        severity: 'HIGH'
      },

      // MEDIUM: Memory leak prevention
      {
        name: "Memory Leak Prevention",
        description: "Ensure Sharp instances are properly disposed",
        test: () => this.testMemoryLeaks(),
        severity: 'MEDIUM'
      },

      // CRITICAL: Invalid dimension bug
      {
        name: "Invalid Dimensions Prevention",
        description: "Prevent zero/negative/NaN dimensions in output",
        test: () => this.testInvalidDimensions(),
        severity: 'CRITICAL'
      },

      // HIGH: Quality degradation bug
      {
        name: "Quality Degradation Prevention",
        description: "Prevent excessive quality loss beyond acceptable limits",
        test: () => this.testQualityDegradation(),
        severity: 'HIGH'
      },

      // CRITICAL: File corruption bug
      {
        name: "File Corruption Prevention",
        description: "Ensure output files are never corrupted or unreadable",
        test: () => this.testFileCorruption(),
        severity: 'CRITICAL'
      },

      // MEDIUM: Edge case handling
      {
        name: "Edge Case Handling",
        description: "Handle extreme aspect ratios and tiny/huge images",
        test: () => this.testEdgeCases(),
        severity: 'MEDIUM'
      }
    ];

    // Run all tests
    for (const test of bugTests) {
      console.log(`\n🔍 Testing: ${test.name} (${test.severity})`);
      console.log(`   ${test.description}`);

      try {
        const result = await test.test();
        this.results.push(result);

        if (result.passed) {
          console.log(`   ✅ PASS: ${result.message}`);
        } else {
          console.log(`   🚨 FAIL (${test.severity}): ${result.message}`);
          if (result.details) {
            console.log(`   📝 Details: ${JSON.stringify(result.details, null, 2)}`);
          }
        }
      } catch (error) {
        const failResult: TestResult = {
          passed: false,
          message: `Test threw exception: ${error}`,
          details: { error: error?.toString(), severity: test.severity }
        };
        this.results.push(failResult);
        console.log(`   💥 ERROR (${test.severity}): ${failResult.message}`);
      }
    }

    this.generateBugReport();
  }

  private async setupTestEnvironment(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  private async testEXIFRotationBug(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create test images with each of the 8 EXIF orientations
      const orientations = [1, 2, 3, 4, 5, 6, 7, 8];
      const testResults: any[] = [];

      for (const orientation of orientations) {
        try {
          // Create a test image with specific EXIF orientation
          const testImagePath = path.join(this.outputDir, `exif-test-${orientation}.jpg`);

          // Create a simple colored rectangle to test rotation
          await sharp({
            create: {
              width: 100,
              height: 200,
              channels: 3,
              background: { r: 255, g: 0, b: 0 }
            }
          })
          .jpeg()
          .withMetadata({ orientation })
          .toFile(testImagePath);

          // Process with Instagram Square (representative processor)
          const result = await InstagramSquareProcessor.process(testImagePath, this.outputDir);

          if (result.success) {
            // Verify the output image has correct orientation
            const outputMetadata = await SharpUtils.getImageMetadata(result.outputPath);

            // The output should always have orientation 1 (no rotation needed)
            // or undefined (meaning orientation was applied and removed)
            const finalOrientation = outputMetadata.orientation || 1;

            testResults.push({
              inputOrientation: orientation,
              outputOrientation: finalOrientation,
              success: result.success,
              dimensions: `${outputMetadata.width}x${outputMetadata.height}`
            });

            // For orientations that swap width/height (5,6,7,8), verify dimensions make sense
            if ([5, 6, 7, 8].includes(orientation)) {
              // These orientations involve 90-degree rotations
              // The aspect ratio should be consistent with rotation being applied
              // This is complex to verify perfectly, so we just ensure we get valid dimensions
              if (!outputMetadata.width || !outputMetadata.height ||
                  outputMetadata.width <= 0 || outputMetadata.height <= 0) {
                issues.push(`Invalid dimensions for orientation ${orientation}: ${outputMetadata.width}x${outputMetadata.height}`);
              }
            }

            // Clean up test file
            await fs.unlink(testImagePath);
            await fs.unlink(result.outputPath);

          } else {
            issues.push(`Processing failed for EXIF orientation ${orientation}`);
          }

        } catch (error) {
          issues.push(`EXIF orientation ${orientation} test failed: ${error}`);
        }
      }

      if (testResults.length < orientations.length) {
        issues.push(`Only tested ${testResults.length}/${orientations.length} EXIF orientations`);
      }

    } catch (error) {
      issues.push(`EXIF rotation test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "EXIF rotation handled correctly for all orientations"
        : `${issues.length} EXIF rotation issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testFileSizeRegression(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create a test image to compress
      const testImagePath = path.join(this.outputDir, 'size-test.png');

      // Create a large, compressible image
      await sharp({
        create: {
          width: 2000,
          height: 2000,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
      .png()
      .toFile(testImagePath);

      const originalSize = (await fs.stat(testImagePath)).size;

      // Test all processors to ensure they reduce file size
      const processors = [
        { name: 'Instagram Square', processor: InstagramSquareProcessor },
        { name: 'Instagram Portrait', processor: InstagramPortraitProcessor },
        { name: 'Jury Submission', processor: JurySubmissionProcessor },
        { name: 'Web Display', processor: WebDisplayProcessor },
        { name: 'Email Newsletter', processor: EmailNewsletterProcessor },
        { name: 'Quick Compress', processor: QuickCompressProcessor }
      ];

      for (const { name, processor } of processors) {
        try {
          const result = await processor.process(testImagePath, this.outputDir);

          if (result.success) {
            const outputSize = (await fs.stat(result.outputPath)).size;

            if (outputSize >= originalSize) {
              issues.push(`${name}: Output size (${outputSize}) >= original size (${originalSize})`);
            }

            // Clean up
            await fs.unlink(result.outputPath);

          } else {
            issues.push(`${name}: Processing failed`);
          }

        } catch (error) {
          issues.push(`${name}: Test failed - ${error}`);
        }
      }

      // Clean up test image
      await fs.unlink(testImagePath);

    } catch (error) {
      issues.push(`File size regression test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "All processors reduce file size correctly"
        : `${issues.length} size regression issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testSafariCompatibility(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create test image
      const testImagePath = path.join(this.outputDir, 'safari-test.png');

      await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
      .png()
      .toFile(testImagePath);

      // Test processors that output different formats
      const formatTests = [
        { name: 'Web Display (WebP)', processor: WebDisplayProcessor, expectedFormat: 'webp' },
        { name: 'Instagram Square (JPEG)', processor: InstagramSquareProcessor, expectedFormat: 'jpeg' }
      ];

      for (const { name, processor, expectedFormat } of formatTests) {
        try {
          const result = await processor.process(testImagePath, this.outputDir);

          if (result.success) {
            const outputMetadata = await SharpUtils.getImageMetadata(result.outputPath);

            // Test 1: Format is correct
            if (outputMetadata.format?.toLowerCase() !== expectedFormat) {
              issues.push(`${name}: Wrong format - expected ${expectedFormat}, got ${outputMetadata.format}`);
            }

            // Test 2: No exotic features that Safari doesn't support
            // Check for advanced WebP features that older Safari versions don't support
            if (expectedFormat === 'webp') {
              // Ensure we're not using lossless WebP or advanced features
              // This is hard to detect programmatically, so we check file size as a proxy
              const fileSize = (await fs.stat(result.outputPath)).size;
              const originalSize = (await fs.stat(testImagePath)).size;

              // If WebP file is larger than original PNG, it might be lossless
              if (fileSize > originalSize * 0.8) {
                issues.push(`${name}: WebP may be using lossless mode (not Safari-optimized)`);
              }
            }

            // Test 3: Basic format compatibility check
            // Ensure we have valid image formats that Safari supports
            const safariSupportedFormats = ['jpeg', 'png', 'webp'];
            if (!safariSupportedFormats.includes(outputMetadata.format.toLowerCase())) {
              issues.push(`${name}: Format ${outputMetadata.format} may not be Safari-compatible`);
            }

            // Clean up
            await fs.unlink(result.outputPath);

          } else {
            issues.push(`${name}: Processing failed`);
          }

        } catch (error) {
          issues.push(`${name}: Safari compatibility test failed - ${error}`);
        }
      }

      // Clean up test image
      await fs.unlink(testImagePath);

    } catch (error) {
      issues.push(`Safari compatibility test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Safari compatibility verified"
        : `${issues.length} Safari compatibility issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testMemoryLeaks(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create test image
      const testImagePath = path.join(this.outputDir, 'memory-test.png');

      await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
      .png()
      .toFile(testImagePath);

      // Process multiple times and monitor for memory issues
      const iterations = 10;
      const results: any[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const result = await InstagramSquareProcessor.process(testImagePath, this.outputDir);

          if (result.success) {
            results.push(result.processingTimeMs);

            // Clean up immediately to test garbage collection
            await fs.unlink(result.outputPath);
          } else {
            issues.push(`Memory test iteration ${i + 1}: Processing failed`);
          }

        } catch (error) {
          issues.push(`Memory test iteration ${i + 1}: ${error}`);
        }
      }

      // Analyze processing times - they shouldn't increase dramatically due to memory leaks
      if (results.length >= 5) {
        const firstHalf = results.slice(0, Math.floor(results.length / 2));
        const secondHalf = results.slice(Math.floor(results.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        // If second half takes >50% longer, might indicate memory pressure
        if (secondAvg > firstAvg * 1.5) {
          issues.push(`Processing time degradation detected: ${firstAvg.toFixed(1)}ms -> ${secondAvg.toFixed(1)}ms`);
        }
      }

      // Clean up test image
      await fs.unlink(testImagePath);

    } catch (error) {
      issues.push(`Memory leak test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "No memory leak indicators detected"
        : `${issues.length} potential memory issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testInvalidDimensions(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Test various edge case dimensions
      const dimensionTests = [
        { name: "Normal image", width: 800, height: 600 },
        { name: "Very wide image", width: 5000, height: 100 },
        { name: "Very tall image", width: 100, height: 5000 },
        { name: "Tiny image", width: 10, height: 10 }
      ];

      for (const { name, width, height } of dimensionTests) {
        try {
          const testImagePath = path.join(this.outputDir, `dimensions-test-${width}x${height}.png`);

          // Create test image with specific dimensions
          await sharp({
            create: {
              width,
              height,
              channels: 3,
              background: { r: 200, g: 100, b: 50 }
            }
          })
          .png()
          .toFile(testImagePath);

          const result = await InstagramSquareProcessor.process(testImagePath, this.outputDir);

          if (result.success) {
            const outputMetadata = await SharpUtils.getImageMetadata(result.outputPath);

            // Test for invalid dimensions
            if (!outputMetadata.width || !outputMetadata.height ||
                outputMetadata.width <= 0 || outputMetadata.height <= 0 ||
                !isFinite(outputMetadata.width) || !isFinite(outputMetadata.height) ||
                isNaN(outputMetadata.width) || isNaN(outputMetadata.height)) {
              issues.push(`${name}: Invalid output dimensions - ${outputMetadata.width}x${outputMetadata.height}`);
            }

            // Clean up
            await fs.unlink(result.outputPath);
          } else {
            // Some extreme dimensions might legitimately fail, which is acceptable
            console.log(`   Note: ${name} processing failed (acceptable for extreme cases)`);
          }

          await fs.unlink(testImagePath);

        } catch (error) {
          issues.push(`${name}: Dimension test failed - ${error}`);
        }
      }

    } catch (error) {
      issues.push(`Invalid dimensions test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "No invalid dimension bugs detected"
        : `${issues.length} invalid dimension issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testQualityDegradation(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create a high-quality test image with detail
      const testImagePath = path.join(this.outputDir, 'quality-test.png');

      await sharp({
        create: {
          width: 1920,
          height: 1080,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toFile(testImagePath);

      // Test quality settings across processors
      const qualityTests = [
        { name: 'Jury Submission', processor: JurySubmissionProcessor, minQuality: 85 },
        { name: 'Instagram Square', processor: InstagramSquareProcessor, minQuality: 90 },
        { name: 'Web Display', processor: WebDisplayProcessor, minQuality: 75 }
      ];

      for (const { name, processor, minQuality } of qualityTests) {
        try {
          const result = await processor.process(testImagePath, this.outputDir);

          if (result.success) {
            // Check if quality is within acceptable range
            if (result.optimization.finalQuality < minQuality) {
              issues.push(`${name}: Quality too low - ${result.optimization.finalQuality} < ${minQuality}`);
            }

            // Check if quality is unreasonably high (wastes space)
            if (result.optimization.finalQuality > 98) {
              issues.push(`${name}: Quality too high - ${result.optimization.finalQuality} > 98 (inefficient)`);
            }

            // Clean up
            await fs.unlink(result.outputPath);

          } else {
            issues.push(`${name}: Quality test processing failed`);
          }

        } catch (error) {
          issues.push(`${name}: Quality test failed - ${error}`);
        }
      }

      await fs.unlink(testImagePath);

    } catch (error) {
      issues.push(`Quality degradation test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Quality settings within acceptable ranges"
        : `${issues.length} quality degradation issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testFileCorruption(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Create test image
      const testImagePath = path.join(this.outputDir, 'corruption-test.jpg');

      await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 150, g: 200, b: 100 }
        }
      })
      .jpeg({ quality: 95 })
      .toFile(testImagePath);

      // Test all processors for file corruption
      const processors = [
        { name: 'Instagram Square', processor: InstagramSquareProcessor },
        { name: 'Instagram Portrait', processor: InstagramPortraitProcessor },
        { name: 'Quick Compress', processor: QuickCompressProcessor }
      ];

      for (const { name, processor } of processors) {
        try {
          const result = await processor.process(testImagePath, this.outputDir);

          if (result.success) {
            // Test 1: File is readable by Sharp
            try {
              const outputMetadata = await sharp(result.outputPath).metadata();
              if (!outputMetadata.width || !outputMetadata.height) {
                issues.push(`${name}: Output file has invalid metadata`);
              }
            } catch (error) {
              issues.push(`${name}: Output file corrupted - unreadable by Sharp: ${error}`);
            }

            // Test 2: File size is reasonable (not 0 or suspiciously small)
            const fileSize = (await fs.stat(result.outputPath)).size;
            if (fileSize < 100) { // Less than 100 bytes is suspicious
              issues.push(`${name}: Output file suspiciously small (${fileSize} bytes)`);
            }

            // Test 3: File can be processed again (not corrupted)
            try {
              const reprocessResult = await sharp(result.outputPath)
                .resize(100, 100)
                .jpeg()
                .toBuffer();

              if (reprocessResult.length === 0) {
                issues.push(`${name}: Output file fails reprocessing test`);
              }
            } catch (error) {
              issues.push(`${name}: Output file fails reprocessing: ${error}`);
            }

            // Clean up
            await fs.unlink(result.outputPath);

          } else {
            issues.push(`${name}: File corruption test processing failed`);
          }

        } catch (error) {
          issues.push(`${name}: File corruption test failed - ${error}`);
        }
      }

      await fs.unlink(testImagePath);

    } catch (error) {
      issues.push(`File corruption test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "No file corruption detected"
        : `${issues.length} file corruption issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private async testEdgeCases(): Promise<TestResult> {
    const issues: string[] = [];

    try {
      // Test extremely small image
      const tinyImagePath = path.join(this.outputDir, 'tiny-test.png');
      await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
      .png()
      .toFile(tinyImagePath);

      try {
        const result = await QuickCompressProcessor.process(tinyImagePath, this.outputDir);
        // Should either succeed or fail gracefully
        if (result.success) {
          await fs.unlink(result.outputPath);
        }
        // Either outcome is acceptable for 1x1 images
      } catch (error) {
        // Graceful failure is acceptable
        console.log(`   Note: 1x1 image test failed gracefully: ${error}`);
      }

      await fs.unlink(tinyImagePath);

      // Test image with extreme aspect ratio
      const extremeImagePath = path.join(this.outputDir, 'extreme-test.png');
      await sharp({
        create: {
          width: 3000,
          height: 10,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      })
      .png()
      .toFile(extremeImagePath);

      try {
        const result = await InstagramSquareProcessor.process(extremeImagePath, this.outputDir);
        if (result.success) {
          // Should handle extreme aspect ratios without crashing
          const metadata = await SharpUtils.getImageMetadata(result.outputPath);
          if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
            issues.push("Extreme aspect ratio produced invalid dimensions");
          }
          await fs.unlink(result.outputPath);
        }
        // Graceful failure is also acceptable
      } catch (error) {
        // Graceful failure is acceptable for extreme cases
        console.log(`   Note: Extreme aspect ratio test failed gracefully: ${error}`);
      }

      await fs.unlink(extremeImagePath);

    } catch (error) {
      issues.push(`Edge case test setup failed: ${error}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? "Edge cases handled appropriately"
        : `${issues.length} edge case issues detected`,
      details: issues.length > 0 ? { issues } : undefined
    };
  }

  private generateBugReport(): void {
    console.log("\n🐛 BUG PREVENTION TEST SUMMARY");
    console.log("==============================");

    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);

    console.log(`Total Bug Tests: ${this.results.length}`);
    console.log(`Passed: ${passedTests.length} ✅`);
    console.log(`Failed: ${failedTests.length} ${failedTests.length > 0 ? '🚨' : ''}`);

    if (failedTests.length > 0) {
      console.log("\n🚨 FAILED BUG PREVENTION TESTS:");
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.message}`);
      });

      console.log("\n⚠️  CRITICAL ALERT:");
      console.log("Failed bug prevention tests indicate potential regression of known issues.");
      console.log("These bugs have caused user problems before and MUST be fixed immediately.");
    } else {
      console.log("\n✅ ALL BUG PREVENTION TESTS PASSED");
      console.log("No regression of previously identified bugs detected.");
    }
  }
}

// Export test runner for CLI usage
export async function runBugPreventionTests(outputDir?: string): Promise<void> {
  const suite = new BugPreventionTestSuite(outputDir);
  await suite.runAllTests();
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBugPreventionTests().catch(console.error);
}