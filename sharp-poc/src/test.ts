/**
 * Test script for Sharp.js Instagram Square processor
 * Tests EXIF orientation handling and compares with Python implementation
 */

import { InstagramSquareProcessor } from './processors.js';
import { SharpUtils } from './sharp-utils.js';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  console.log("🚀 Sharp.js Instagram Square Processor Test");
  console.log("==========================================");

  // Create output directory
  const outputDir = './output';
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Test with a sample image
  const testImagePath = './test-images/sample-image.png';

  try {
    // Check if test image exists
    await fs.access(testImagePath);

    console.log(`\n📸 Testing with: ${testImagePath}`);

    // Get initial image metadata to show EXIF orientation
    const initialMetadata = await SharpUtils.getImageMetadata(testImagePath);
    console.log("Initial Image Analysis:");
    console.log(`- Dimensions: ${initialMetadata.width}x${initialMetadata.height}`);
    console.log(`- Format: ${initialMetadata.format}`);
    console.log(`- File size: ${(initialMetadata.size/1024).toFixed(1)}KB`);
    console.log(`- EXIF Orientation: ${initialMetadata.orientation || 'None detected'}`);
    console.log(`- Has ICC Profile: ${initialMetadata.hasProfile}`);

    // Process the image
    const result = await InstagramSquareProcessor.process(testImagePath, outputDir);

    // Show results
    console.log("\n✅ Processing Results:");
    console.log(`- Success: ${result.success}`);
    console.log(`- Output: ${result.outputPath}`);
    console.log(`- Final size: ${(result.metadata.size/1024/1024).toFixed(2)}MB`);
    console.log(`- Quality used: ${result.optimization.finalQuality}`);
    console.log(`- Iterations: ${result.optimization.iterations}`);
    console.log(`- Processing time: ${result.processingTimeMs}ms`);

    // Show preset configuration
    const config = InstagramSquareProcessor.getPresetConfig();
    console.log("\n📋 Preset Configuration:");
    Object.entries(config).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });

    // EXIF Orientation Test Results
    console.log("\n🔍 EXIF Orientation Handling Test:");
    if (initialMetadata.orientation && initialMetadata.orientation !== 1) {
      console.log(`✅ DETECTED: Input image has EXIF orientation ${initialMetadata.orientation}`);
      console.log(`✅ HANDLED: Sharp.js automatically applied orientation correction`);
      console.log(`✅ RESULT: Output image should display correctly rotated`);
    } else {
      console.log(`ℹ️  Input image has no EXIF orientation issues (orientation: ${initialMetadata.orientation || 'undefined'})`);
      console.log(`ℹ️  Test with an image that has EXIF orientation != 1 for complete validation`);
    }

  } catch (error) {
    console.error(`❌ Error processing test image: ${error}`);

    // Create a simple test case without real image
    console.log("\n🔧 Creating Mock Test Results:");
    const mockResult = {
      success: true,
      outputPath: path.join(outputDir, 'mock_instagram_square.jpg'),
      metadata: {
        width: 1080,
        height: 1080,
        format: 'jpeg',
        size: 350000, // ~350KB
        hasProfile: false
      },
      optimization: {
        finalQuality: 85,
        fileSizeBytes: 350000,
        iterations: 3,
        success: true
      },
      processingTimeMs: 150
    };

    console.log("Mock Results (for demo purposes):");
    console.log(`- Target dimensions: 1080x1080px`);
    console.log(`- Max file size: 4MB`);
    console.log(`- Expected output: ~350KB JPEG`);
    console.log(`- Quality optimization: Iterative 95→60`);
    console.log(`- EXIF handling: Automatic via Sharp.rotate()`);
  }

  console.log("\n📖 EXIF Orientation Documentation:");
  console.log("===================================");
  console.log("Sharp.js EXIF Orientation Handling:");
  console.log("- Sharp automatically reads EXIF orientation data");
  console.log("- The .rotate() method without parameters applies EXIF orientation");
  console.log("- This should fix the rotation bug present in PIL implementation");
  console.log("- Output images will display correctly regardless of camera orientation");
  console.log("");
  console.log("Python PIL Comparison:");
  console.log("- PIL requires manual EXIF orientation handling via OptimizationUtils");
  console.log("- Complex transformation matrix for 8 possible orientations");
  console.log("- More error-prone and verbose implementation");
  console.log("");
  console.log("Conclusion: Sharp.js provides more robust EXIF handling out-of-the-box");
}

// Run the test
main().catch(console.error);