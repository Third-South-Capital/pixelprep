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

/**
 * Instagram Portrait Processor - Sharp.js Implementation
 * 1080×1350px, max 4MB, JPEG format
 */
export class InstagramPortraitProcessor {
  static readonly TARGET_WIDTH = 1080;
  static readonly TARGET_HEIGHT = 1350;
  static readonly MAX_FILE_SIZE_MB = 4;
  static readonly FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 95;
  static readonly QUALITY_MIN = 60;

  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== INSTAGRAM PORTRAIT PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    // Get initial image metadata
    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}, format=${initialMetadata.format}`);

    // Step 1: Load image with automatic EXIF orientation handling
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Step 2: Smart crop to portrait aspect ratio (4:5)
    const targetAspect = this.TARGET_WIDTH / this.TARGET_HEIGHT; // 0.8
    image = await this.cropToPortraitAspect(image, targetAspect);

    // Step 3: Resize to target dimensions
    image = SharpUtils.resizeWithQuality(image, this.TARGET_WIDTH, this.TARGET_HEIGHT);

    // Step 4: Generate output path
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputBasename}_instagram_portrait.jpg`);

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

    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);
    const processingTimeMs = Date.now() - startTime;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024/1024).toFixed(2)}MB)`);
    console.log("=== INSTAGRAM PORTRAIT PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  private static async cropToPortraitAspect(image: sharp.Sharp, targetAspect: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;
    const currentAspect = width / height;

    if (Math.abs(currentAspect - targetAspect) < 0.01) {
      return image; // Already correct aspect ratio
    }

    let cropWidth, cropHeight;
    if (currentAspect > targetAspect) {
      // Image is too wide, crop width
      cropHeight = height;
      cropWidth = Math.round(height * targetAspect);
    } else {
      // Image is too tall, crop height
      cropWidth = width;
      cropHeight = Math.round(width / targetAspect);
    }

    const left = Math.floor((width - cropWidth) / 2);
    const top = Math.floor((height - cropHeight) / 2);

    console.log(`Cropping from ${width}x${height} to ${cropWidth}x${cropHeight} (portrait aspect)`);

    return image.extract({ left, top, width: cropWidth, height: cropHeight });
  }

  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Instagram Portrait',
      description: 'Optimized for Instagram portrait posts',
      dimensions: `${this.TARGET_WIDTH}×${this.TARGET_HEIGHT}px`,
      max_file_size: `<${this.MAX_FILE_SIZE_MB}MB`,
      format: this.FORMAT.toUpperCase(),
      color_space: 'sRGB',
      aspect_ratio: '4:5',
      use_case: 'Social media portraits, vertical compositions'
    };
  }
}

/**
 * Jury Submission Processor - Sharp.js Implementation
 * 1920px longest side, 1-2MB target, JPEG format
 */
export class JurySubmissionProcessor {
  static readonly TARGET_MAX_DIMENSION = 1920;
  static readonly MIN_FILE_SIZE_MB = 1;
  static readonly MAX_FILE_SIZE_MB = 2;
  static readonly FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 95;
  static readonly QUALITY_MIN = 60;

  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== JURY SUBMISSION PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}`);

    // Step 1: Load with EXIF orientation handling
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Step 2: Resize to max dimension while preserving aspect ratio
    image = await this.resizeToMaxDimension(image, this.TARGET_MAX_DIMENSION);

    // Step 3: Generate output path
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputBasename}_jury_submission.jpg`);

    // Step 4: Optimize to target size range (1-2MB)
    const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    const optimization = await SharpUtils.optimizeFileSize(
      image,
      outputPath,
      maxSizeBytes,
      this.FORMAT,
      this.QUALITY_START,
      this.QUALITY_MIN
    );

    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);
    const processingTimeMs = Date.now() - startTime;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024/1024).toFixed(2)}MB)`);
    console.log("=== JURY SUBMISSION PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  private static async resizeToMaxDimension(image: sharp.Sharp, maxDimension: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;
    const maxCurrent = Math.max(width, height);

    if (maxCurrent <= maxDimension) {
      return image; // Already within size limits
    }

    const scale = maxDimension / maxCurrent;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    console.log(`Resizing from ${width}x${height} to ${newWidth}x${newHeight} (max ${maxDimension}px)`);

    return image.resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    });
  }

  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Jury Submission',
      description: 'Optimized for art competition and jury submissions',
      max_dimension: `${this.TARGET_MAX_DIMENSION}px longest side`,
      file_size_range: `${this.MIN_FILE_SIZE_MB}-${this.MAX_FILE_SIZE_MB}MB`,
      format: this.FORMAT.toUpperCase(),
      aspect_ratio: 'Preserved',
      use_case: 'Art competitions, portfolio submissions, professional review'
    };
  }
}

/**
 * Web Display Processor - Sharp.js Implementation
 * 1920px wide, WebP format with JPEG fallback
 */
export class WebDisplayProcessor {
  static readonly TARGET_WIDTH = 1920;
  static readonly MAX_FILE_SIZE_KB = 500;
  static readonly PRIMARY_FORMAT = 'webp' as const;
  static readonly FALLBACK_FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 90;
  static readonly QUALITY_MIN = 50;

  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== WEB DISPLAY PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}`);

    // Step 1: Load with EXIF orientation handling
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Step 2: Resize to target width while preserving aspect ratio
    image = await this.resizeToWidth(image, this.TARGET_WIDTH);

    // Step 3: Generate output paths for both formats
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const webpPath = path.join(outputDir, `${inputBasename}_web_display.webp`);
    const jpegPath = path.join(outputDir, `${inputBasename}_web_display.jpg`);

    // Step 4: Try WebP first, fallback to JPEG
    const maxSizeBytes = this.MAX_FILE_SIZE_KB * 1024;
    let optimization: OptimizationResult;
    let outputPath: string;
    let format: string;

    try {
      console.log("Trying WebP format...");
      optimization = await SharpUtils.optimizeFileSize(
        image.clone(),
        webpPath,
        maxSizeBytes,
        this.PRIMARY_FORMAT,
        this.QUALITY_START,
        this.QUALITY_MIN
      );
      outputPath = webpPath;
      format = 'WebP';
    } catch (error) {
      console.log("WebP failed, using JPEG fallback...");
      optimization = await SharpUtils.optimizeFileSize(
        image,
        jpegPath,
        maxSizeBytes,
        this.FALLBACK_FORMAT,
        this.QUALITY_START,
        this.QUALITY_MIN
      );
      outputPath = jpegPath;
      format = 'JPEG';
    }

    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);
    const processingTimeMs = Date.now() - startTime;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height} (${format})`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024).toFixed(1)}KB)`);
    console.log("=== WEB DISPLAY PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  private static async resizeToWidth(image: sharp.Sharp, targetWidth: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    if (width <= targetWidth) {
      return image; // Already within size limits
    }

    const scale = targetWidth / width;
    const newHeight = Math.round(height * scale);

    console.log(`Resizing from ${width}x${height} to ${targetWidth}x${newHeight}`);

    return image.resize(targetWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    });
  }

  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Web Display',
      description: 'Optimized for web galleries and online portfolios',
      dimensions: `${this.TARGET_WIDTH}px wide (height auto)`,
      max_file_size: `<${this.MAX_FILE_SIZE_KB}KB`,
      format: `${this.PRIMARY_FORMAT.toUpperCase()} with ${this.FALLBACK_FORMAT.toUpperCase()} fallback`,
      aspect_ratio: 'Preserved',
      use_case: 'Web galleries, online portfolios, fast loading'
    };
  }
}

/**
 * Email Newsletter Processor - Sharp.js Implementation
 * 600px wide, max 200KB, JPEG format
 */
export class EmailNewsletterProcessor {
  static readonly TARGET_WIDTH = 600;
  static readonly MAX_FILE_SIZE_KB = 200;
  static readonly FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 85;
  static readonly QUALITY_MIN = 40;

  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== EMAIL NEWSLETTER PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}`);

    // Step 1: Load with EXIF orientation handling
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Step 2: Resize to target width
    image = await this.resizeToWidth(image, this.TARGET_WIDTH);

    // Step 3: Generate output path
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputBasename}_email_newsletter.jpg`);

    // Step 4: Aggressive optimization for email delivery
    const maxSizeBytes = this.MAX_FILE_SIZE_KB * 1024;
    const optimization = await SharpUtils.optimizeFileSize(
      image,
      outputPath,
      maxSizeBytes,
      this.FORMAT,
      this.QUALITY_START,
      this.QUALITY_MIN
    );

    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);
    const processingTimeMs = Date.now() - startTime;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024).toFixed(1)}KB)`);
    console.log("=== EMAIL NEWSLETTER PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  private static async resizeToWidth(image: sharp.Sharp, targetWidth: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    if (width <= targetWidth) {
      return image;
    }

    const scale = targetWidth / width;
    const newHeight = Math.round(height * scale);

    console.log(`Resizing from ${width}x${height} to ${targetWidth}x${newHeight}`);

    return image.resize(targetWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    });
  }

  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Email Newsletter',
      description: 'Optimized for email newsletters and marketing campaigns',
      dimensions: `${this.TARGET_WIDTH}px wide (height auto)`,
      max_file_size: `<${this.MAX_FILE_SIZE_KB}KB`,
      format: this.FORMAT.toUpperCase(),
      aspect_ratio: 'Preserved',
      use_case: 'Email marketing, newsletters, fast delivery'
    };
  }
}

/**
 * Quick Compress Processor - Sharp.js Implementation
 * Maintain dimensions, reduce file size by 70%
 */
export class QuickCompressProcessor {
  static readonly TARGET_REDUCTION_PERCENT = 70;
  static readonly FORMAT = 'jpeg' as const;
  static readonly QUALITY_START = 95;
  static readonly QUALITY_MIN = 30;

  static async process(inputPath: string, outputDir: string = './output'): Promise<ProcessingResult> {
    const startTime = Date.now();

    console.log("=== QUICK COMPRESS PROCESSING START (Sharp.js) ===");
    console.log(`Input: ${inputPath}`);

    const initialMetadata = await SharpUtils.getImageMetadata(inputPath);
    console.log(`Initial image: ${initialMetadata.width}x${initialMetadata.height}`);
    console.log(`Initial file size: ${initialMetadata.size} bytes (${(initialMetadata.size/1024).toFixed(1)}KB)`);

    // Calculate target size (70% reduction = 30% of original)
    const targetSizeBytes = Math.round(initialMetadata.size * 0.3);
    console.log(`Target file size: ${targetSizeBytes} bytes (${(targetSizeBytes/1024).toFixed(1)}KB) - ${this.TARGET_REDUCTION_PERCENT}% reduction`);

    // Step 1: Load with EXIF orientation handling (keep original dimensions)
    let image = await SharpUtils.processWithOrientation(inputPath);

    // Step 2: Generate output path
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputBasename}_quick_compress.jpg`);

    // Step 3: Compress to target size while maintaining dimensions
    const optimization = await SharpUtils.optimizeFileSize(
      image,
      outputPath,
      targetSizeBytes,
      this.FORMAT,
      this.QUALITY_START,
      this.QUALITY_MIN
    );

    const finalMetadata = await SharpUtils.getImageMetadata(outputPath);
    const processingTimeMs = Date.now() - startTime;
    const actualReduction = ((initialMetadata.size - finalMetadata.size) / initialMetadata.size) * 100;

    console.log(`Final output: ${finalMetadata.width}x${finalMetadata.height} (dimensions preserved)`);
    console.log(`Final file size: ${finalMetadata.size} bytes (${(finalMetadata.size/1024).toFixed(1)}KB)`);
    console.log(`Actual reduction: ${actualReduction.toFixed(1)}%`);
    console.log("=== QUICK COMPRESS PROCESSING END ===");

    return {
      success: optimization.success,
      outputPath,
      metadata: finalMetadata,
      optimization,
      processingTimeMs
    };
  }

  static getPresetConfig(): Record<string, any> {
    return {
      name: 'Quick Compress',
      description: 'Reduce file size by 70% while keeping original dimensions',
      dimensions: 'Original dimensions preserved',
      size_reduction: `${this.TARGET_REDUCTION_PERCENT}% smaller`,
      format: this.FORMAT.toUpperCase(),
      aspect_ratio: 'Preserved',
      use_case: 'File size reduction, storage optimization, bandwidth saving'
    };
  }
}