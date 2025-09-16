/**
 * Instagram Square Processor - Sharp.js Implementation
 * Parallel implementation to PixelPrep's Python/PIL InstagramSquareProcessor
 */

import sharp from 'sharp';
import { SharpUtils, OptimizationResult, ImageMetadata } from './sharp-utils.js';
import path from 'path';

export interface ProcessingResult {
  success: boolean;
  outputPath: string;
  metadata: ImageMetadata;
  optimization: OptimizationResult;
  processingTimeMs: number;
}

export class InstagramSquareProcessor {
  static readonly TARGET_WIDTH = 1080;
  static readonly TARGET_HEIGHT = 1080;
  static readonly MAX_FILE_SIZE_MB = 4;
  static readonly FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 95;
  static readonly QUALITY_MIN = 60;

  /**
   * Process image for Instagram square format
   * Matches the Python implementation's process() method
   */
  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== INSTAGRAM SQUARE PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    // Get initial image metadata
    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}, format=${initialMetadata.format}`);
    console.log(`Initial file size: ${initialMetadata.size} bytes (${(initialMetadata.size/1024).toFixed(1)} KB)`);

    if (initialMetadata.orientation) {
      console.log(`EXIF Orientation detected: ${initialMetadata.orientation}`);
    }

    // Step 1: Load image with automatic EXIF orientation handling
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Get metadata after orientation fix
    const orientedMetadata = await image.metadata();
    console.log(`After orientation fix: ${orientedMetadata.width}x${orientedMetadata.height}`);

    // Step 2: Smart crop to square if needed
    const { width = 0, height = 0 } = orientedMetadata;
    if (width !== height) {
      console.log(`Cropping from ${width}x${height} to square aspect ratio`);
      image = await SharpUtils.cropToSquare(image, Math.min(width, height));

      const croppedMetadata = await image.metadata();
      console.log(`After crop: ${croppedMetadata.width}x${croppedMetadata.height}`);
    }

    // Step 3: Resize to target dimensions if needed
    const currentMetadata = await image.metadata();
    if (currentMetadata.width !== this.TARGET_WIDTH || currentMetadata.height !== this.TARGET_HEIGHT) {
      console.log(`Resizing from ${currentMetadata.width}x${currentMetadata.height} to ${this.TARGET_WIDTH}x${this.TARGET_HEIGHT}`);
      image = SharpUtils.resizeWithQuality(image, this.TARGET_WIDTH, this.TARGET_HEIGHT);

      const resizedMetadata = await image.metadata();
      console.log(`After resize: ${resizedMetadata.width}x${resizedMetadata.height}`);
    }

    // Step 4: Generate output path
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputBasename}_instagram_square.jpg`);

    // Step 5: Optimize and save
    const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    const optimization = await SharpUtils.optimizeFileSize(
      image,
      outputPath,
      maxSizeBytes,
      this.FORMAT,
      this.QUALITY_START,
      this.QUALITY_MIN
    );

    // Get final metadata
    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);

    const processingTimeMs = Date.now() - startTime;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024/1024).toFixed(2)}MB)`);
    console.log(`Processing completed in ${processingTimeMs}ms`);
    console.log("=== INSTAGRAM SQUARE PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  /**
   * Get preset configuration (matches Python implementation)
   */
  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Instagram Square',
      description: 'Optimized for Instagram square posts',
      dimensions: `${this.TARGET_WIDTH}×${this.TARGET_HEIGHT}px`,
      max_file_size: `<${this.MAX_FILE_SIZE_MB}MB`,
      format: this.FORMAT.toUpperCase(),
      color_space: 'sRGB',
      aspect_ratio: '1:1',
      use_case: 'Social media posts, portfolio sharing, engagement'
    };
  }

  /**
   * Compare with Python PIL implementation results
   */
  static async compareWithPython(inputPath: string, pythonOutputPath?: string): Promise<void> {
    console.log("\n=== COMPARISON WITH PYTHON IMPLEMENTATION ===");

    const config = this.getPresetConfig();
    console.log("Preset Config:", JSON.stringify(config, null, 2));

    if (pythonOutputPath) {
      try {
        const pythonMetadata = await SharpUtils.getImageMetadata(pythonOutputPath);
        console.log("\nPython PIL Output:");
        console.log(`- Dimensions: ${pythonMetadata.width}x${pythonMetadata.height}`);
        console.log(`- File size: ${pythonMetadata.size} bytes (${(pythonMetadata.size/1024/1024).toFixed(2)}MB)`);
        console.log(`- Format: ${pythonMetadata.format}`);
      } catch (error) {
        console.log(`Could not read Python output: ${error}`);
      }
    }
  }
}