/**
 * Sharp.js utility functions for image processing
 * Parallel implementation to PixelPrep's Python/PIL optimization_utils.py
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';

export interface OptimizationResult {
  finalQuality: number;
  fileSizeBytes: number;
  iterations: number;
  success: boolean;
  exifOrientation?: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  orientation?: number;
  hasProfile: boolean;
}

export class SharpUtils {

  /**
   * Get comprehensive image metadata including EXIF orientation
   */
  static async getImageMetadata(inputPath: string): Promise<ImageMetadata> {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: metadata.size || 0,
      orientation: metadata.orientation,
      hasProfile: !!metadata.icc
    };
  }

  /**
   * Process image with automatic EXIF orientation handling
   * Sharp automatically handles EXIF orientation when called with rotate()
   */
  static async processWithOrientation(inputPath: string): Promise<sharp.Sharp> {
    return sharp(inputPath)
      // Sharp automatically reads and applies EXIF orientation
      .rotate() // This applies the EXIF orientation automatically
      .ensureAlpha(0) // Remove alpha channel for JPEG output
      .toColorspace('srgb'); // Ensure sRGB color space
  }

  /**
   * Smart crop to square aspect ratio from center
   * Equivalent to Python's _smart_crop method
   */
  static async cropToSquare(image: sharp.Sharp, targetSize: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    if (width === height) {
      return image; // Already square
    }

    // Calculate center crop dimensions
    const minDimension = Math.min(width, height);
    const left = Math.floor((width - minDimension) / 2);
    const top = Math.floor((height - minDimension) / 2);

    console.log(`Cropping from ${width}x${height} to ${minDimension}x${minDimension} (center crop)`);

    return image.extract({
      left,
      top,
      width: minDimension,
      height: minDimension
    });
  }

  /**
   * Resize with high-quality resampling
   * Equivalent to Python's LANCZOS resampling
   */
  static resizeWithQuality(image: sharp.Sharp, width: number, height: number): sharp.Sharp {
    return image.resize(width, height, {
      kernel: sharp.kernel.lanczos3, // High-quality resampling similar to LANCZOS
      fit: 'fill' // Exact dimensions
    });
  }

  /**
   * Optimize file size through iterative quality reduction
   * Matches Python's save_optimized_with_metadata behavior
   */
  static async optimizeFileSize(
    image: sharp.Sharp,
    outputPath: string,
    maxSizeBytes: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg',
    qualityStart: number = 95,
    qualityMin: number = 60
  ): Promise<OptimizationResult> {

    let quality = qualityStart;
    let iterations = 0;
    let finalSize = 0;

    console.log(`Starting optimization: max_size=${maxSizeBytes} bytes (${(maxSizeBytes/1024/1024).toFixed(1)}MB)`);

    while (quality >= qualityMin && iterations < 20) {
      iterations++;

      let processedImage = image.clone();

      // Apply format-specific optimization
      if (format === 'jpeg') {
        processedImage = processedImage.jpeg({
          quality,
          progressive: true, // Progressive JPEG for web compatibility
          mozjpeg: true // Use mozjpeg encoder for better compression
        });
      } else if (format === 'webp') {
        processedImage = processedImage.webp({
          quality,
          effort: 6 // Higher effort for better compression
        });
      } else if (format === 'png') {
        processedImage = processedImage.png({
          compressionLevel: 9,
          progressive: true
        });
      }

      // Save to buffer first to check size
      const buffer = await processedImage.toBuffer();
      finalSize = buffer.length;

      console.log(`Iteration ${iterations}: quality=${quality}, size=${finalSize} bytes (${(finalSize/1024).toFixed(1)}KB)`);

      if (finalSize <= maxSizeBytes) {
        // Success! Save the final file
        await fs.writeFile(outputPath, buffer);
        console.log(`✅ Optimization successful: ${finalSize} bytes at quality ${quality}`);

        return {
          finalQuality: quality,
          fileSizeBytes: finalSize,
          iterations,
          success: true
        };
      }

      // Reduce quality for next iteration
      quality = Math.max(qualityMin, quality - 5);
    }

    // If we get here, we couldn't meet the size constraint
    console.log(`❌ Could not optimize to ${maxSizeBytes} bytes. Final size: ${finalSize} bytes`);

    // Save the best attempt anyway
    const finalImage = image.clone().jpeg({ quality: qualityMin, progressive: true });
    const finalBuffer = await finalImage.toBuffer();
    await fs.writeFile(outputPath, finalBuffer);

    return {
      finalQuality: qualityMin,
      fileSizeBytes: finalBuffer.length,
      iterations,
      success: false
    };
  }

  /**
   * Calculate memory size of Sharp image (estimated)
   */
  static async calculateMemorySize(image: sharp.Sharp): Promise<number> {
    const metadata = await image.metadata();
    const { width = 0, height = 0, channels = 3 } = metadata;
    return width * height * channels; // RGB = 3 bytes per pixel
  }
}