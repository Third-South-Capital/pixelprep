import type { PresetName } from '../types';

interface SizeEstimation {
  estimatedBytes: number;
  estimatedSavings: number;
  savingsPercentage: number;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

/**
 * Estimates file size reduction based on preset and original file characteristics
 */
export function estimateFileSize(
  originalSize: number,
  preset: PresetName,
  originalFormat?: string,
  dimensions?: { width: number; height: number }
): SizeEstimation {

  // Base reduction factors for each preset (conservative estimates)
  const presetReductions: Record<PresetName, { factor: number; maxSize?: number; note?: string }> = {
    instagram_square: {
      factor: 0.4, // Target 40% of original for 1080x1080 JPEG
      maxSize: 4 * 1024 * 1024, // 4MB max
      note: "Optimized for Instagram's compression"
    },
    jury_submission: {
      factor: 0.6, // More conservative to maintain quality
      maxSize: 2 * 1024 * 1024, // 2MB target
      note: "High quality for professional review"
    },
    web_display: {
      factor: 0.25, // Aggressive compression for web
      maxSize: 500 * 1024, // 500KB target
      note: "Fast loading for websites"
    },
    email_newsletter: {
      factor: 0.15, // Very aggressive for email
      maxSize: 200 * 1024, // 200KB target
      note: "Email-friendly size"
    },
    quick_compress: {
      factor: 0.3, // 70% reduction target
      note: "Smart compression with same dimensions"
    }
  };

  const presetConfig = presetReductions[preset];

  // Calculate base estimation
  let estimatedBytes = Math.round(originalSize * presetConfig.factor);

  // Apply format-specific adjustments
  if (originalFormat) {
    const format = originalFormat.toLowerCase();
    if (format.includes('png') && (preset === 'instagram_square' || preset === 'web_display')) {
      // PNG to JPEG conversion can be more dramatic
      estimatedBytes = Math.round(estimatedBytes * 0.6);
    } else if (format.includes('tiff') || format.includes('tif')) {
      // TIFF files typically compress very well
      estimatedBytes = Math.round(estimatedBytes * 0.4);
    }
  }

  // Apply dimension-based adjustments
  if (dimensions) {
    const totalPixels = dimensions.width * dimensions.height;

    // Very large images (>4MP) typically compress better
    if (totalPixels > 4000000) {
      estimatedBytes = Math.round(estimatedBytes * 0.8);
    }

    // Small images (<0.5MP) may not compress as well
    if (totalPixels < 500000) {
      estimatedBytes = Math.round(estimatedBytes * 1.2);
    }
  }

  // Apply max size constraints
  if (presetConfig.maxSize && estimatedBytes > presetConfig.maxSize) {
    estimatedBytes = presetConfig.maxSize;
  }

  // Ensure we don't estimate larger than original
  if (estimatedBytes > originalSize) {
    estimatedBytes = Math.round(originalSize * 0.9);
  }

  const estimatedSavings = originalSize - estimatedBytes;
  const savingsPercentage = Math.round((estimatedSavings / originalSize) * 100);

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (dimensions && originalFormat) {
    confidence = 'high';
  } else if (dimensions || originalFormat) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Adjust confidence for edge cases
  if (originalSize < 100 * 1024) { // Very small files
    confidence = 'low';
  }

  if (originalSize > 50 * 1024 * 1024) { // Very large files
    confidence = 'low';
  }

  return {
    estimatedBytes,
    estimatedSavings,
    savingsPercentage,
    confidence,
    note: presetConfig.note
  };
}

/**
 * Formats file size with appropriate units
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Creates a readable description of estimated savings
 */
export function getSavingsDescription(estimation: SizeEstimation): string {
  const { savingsPercentage, confidence } = estimation;

  const confidenceText = {
    high: '',
    medium: 'approximately ',
    low: 'roughly '
  };

  if (savingsPercentage >= 70) {
    return `${confidenceText[confidence]}${savingsPercentage}% smaller - dramatic size reduction!`;
  } else if (savingsPercentage >= 50) {
    return `${confidenceText[confidence]}${savingsPercentage}% smaller - excellent compression`;
  } else if (savingsPercentage >= 30) {
    return `${confidenceText[confidence]}${savingsPercentage}% smaller - good space saving`;
  } else if (savingsPercentage >= 10) {
    return `${confidenceText[confidence]}${savingsPercentage}% smaller - modest reduction`;
  } else {
    return `${confidenceText[confidence]}${savingsPercentage}% smaller - minimal compression`;
  }
}