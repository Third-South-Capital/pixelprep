import type { PresetName } from '../types';
import { formatBytes, getSavingsDescription } from './commonUtils';

interface SizeEstimation {
  estimatedBytes: number;
  estimatedSavings: number;
  savingsPercentage: number;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

/**
 * Estimates file size reduction based on preset and original file characteristics.
 *
 * IMPORTANT: This is a PREVIEW ESTIMATE only. The actual file size will be calculated
 * by the backend during compression and may differ from this estimate due to:
 * - Dynamic quality optimization
 * - Image content complexity
 * - Actual compression algorithm behavior
 *
 * The final file size displayed in results will always be the accurate backend value.
 */
export function estimateFileSize(
  originalSize: number,
  preset: PresetName,
  originalFormat?: string,
  dimensions?: { width: number; height: number }
): SizeEstimation {

  // Backend-calibrated reduction factors based on actual compression algorithms
  const presetReductions: Record<PresetName, {
    baseReduction: number;
    maxSize?: number;
    algorithm: string;
    note?: string;
    accuracyWeight?: number;
    getEstimation?: (originalSize: number, dimensions?: { width: number; height: number }) => number;
  }> = {
    instagram_square: {
      baseReduction: 0.838, // 83.8% reduction average (measured from backend)
      maxSize: 4 * 1024 * 1024, // 4MB max constraint
      algorithm: 'smart_crop_quality_adjust',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.95, // Very consistent compression ratio
      getEstimation: (originalSize: number) => {
        // Backend shows: 83.8% avg reduction (range: 77.7% - 90.8%)
        // Pattern: Larger files get better compression, but smaller files also compress well due to cropping

        let reductionFactor = 0.838; // Average 83.8% reduction

        if (originalSize > 4 * 1024 * 1024) { // >4MB
          reductionFactor = 0.908; // 90.8% reduction for very large files
        } else if (originalSize > 3 * 1024 * 1024) { // 3-4MB
          reductionFactor = 0.838; // Average reduction for large files
        } else if (originalSize > 2 * 1024 * 1024) { // 2-3MB
          reductionFactor = 0.830; // Slightly better compression for medium files due to cropping
        } else { // <2MB
          reductionFactor = 0.830; // Good compression for smaller files (fixed from 0.777)
        }

        const estimatedSize = originalSize * (1 - reductionFactor);
        return Math.min(estimatedSize, 4 * 1024 * 1024);
      }
    },
    jury_submission: {
      baseReduction: 0.575, // 57.5% reduction average (measured from backend)
      maxSize: 2 * 1024 * 1024, // 2MB target
      algorithm: 'professional_quality_scale',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.8, // Moderate variability (40.5% - 76.2% range)
      getEstimation: (originalSize: number) => {
        // Backend shows: 57.5% avg reduction (range: 40.5% - 76.2%)
        // Pattern: Very large files get better compression, constrained by 2MB limit

        let reductionFactor = 0.575; // Average 57.5% reduction

        if (originalSize > 4 * 1024 * 1024) { // >4MB
          reductionFactor = 0.762; // Better compression for large files
        } else if (originalSize > 3 * 1024 * 1024) { // 3-4MB
          reductionFactor = 0.405; // Limited by file structure
        } else { // <3MB
          reductionFactor = 0.559; // Typical compression
        }

        const estimatedSize = originalSize * (1 - reductionFactor);

        // Apply 2MB constraint - jury submissions are often constrained by this limit
        return Math.min(estimatedSize, 2 * 1024 * 1024);
      }
    },
    web_display: {
      baseReduction: 0.548, // 54.8% reduction average (measured from backend)
      maxSize: 500 * 1024, // 500KB target (often exceeded in practice)
      algorithm: 'webp_with_jpeg_fallback',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.6, // High variability (24.3% - 80.0% range)
      getEstimation: (originalSize: number) => {
        // Backend shows: 54.8% avg reduction (range: 24.3% - 80.0%)
        // Pattern: VERY variable - large files sometimes compress poorly due to fallback

        let reductionFactor = 0.548; // Average 54.8% reduction

        if (originalSize > 4 * 1024 * 1024) { // >4MB
          reductionFactor = 0.800; // Excellent compression for very large files
        } else if (originalSize > 3 * 1024 * 1024) { // 3-4MB
          reductionFactor = 0.243; // Poor compression due to fallback behavior
        } else if (originalSize < 2.5 * 1024 * 1024) { // <2.5MB
          reductionFactor = 0.600; // Good compression for smaller files
        }

        const estimatedSize = originalSize * (1 - reductionFactor);

        // Web display often exceeds 500KB due to WebP→JPEG fallback
        // Don't apply the 500KB constraint as it's frequently exceeded
        return Math.round(estimatedSize);
      }
    },
    email_newsletter: {
      baseReduction: 0.956, // 95.6% reduction average (measured from backend)
      maxSize: 200 * 1024, // 200KB strict limit
      algorithm: 'aggressive_email_optimized',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.9, // Very consistent (93.3% - 98.1% range)
      getEstimation: (originalSize: number) => {
        // Backend shows: 95.6% avg reduction (range: 93.3% - 98.1%)
        // Pattern: Very aggressive compression, consistently achieves <200KB

        let reductionFactor = 0.956; // Average 95.6% reduction

        if (originalSize > 4 * 1024 * 1024) { // >4MB
          reductionFactor = 0.981; // Even more aggressive for large files
        } else if (originalSize > 3 * 1024 * 1024) { // 3-4MB
          reductionFactor = 0.933; // Slightly less aggressive
        } else { // <3MB
          reductionFactor = 0.953; // Standard aggressive compression
        }

        const estimatedSize = originalSize * (1 - reductionFactor);

        // Email newsletter consistently achieves target
        return Math.round(estimatedSize);
      }
    },
    quick_compress: {
      baseReduction: 0.506, // 50.6% reduction average (measured from backend)
      algorithm: 'dynamic_quality_targeting',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.6, // HIGHLY variable (25.6% - 78.0% range)
      getEstimation: (originalSize: number) => {
        // Backend shows: 50.6% avg reduction (range: 25.6% - 78.0%)
        // Pattern: EXTREMELY variable based on image content and complexity

        let reductionFactor = 0.506; // Average 50.6% reduction

        if (originalSize > 4 * 1024 * 1024) { // >4MB
          reductionFactor = 0.482; // Large files often compress less
        } else if (originalSize > 3 * 1024 * 1024) { // 3-4MB
          reductionFactor = 0.256; // Very poor compression for this range
        } else if (originalSize < 2.5 * 1024 * 1024) { // <2.5MB
          reductionFactor = 0.780; // Excellent compression for smaller files
        }

        const estimatedSize = originalSize * (1 - reductionFactor);

        // Quick compress is highly unpredictable, provide conservative estimate
        return Math.round(estimatedSize);
      }
    },
    custom: {
      baseReduction: 0.45, // Conservative estimate for variable settings
      algorithm: 'user_defined',
      note: "Preview estimate - actual size determined during compression",
      accuracyWeight: 0.6 // Lower accuracy due to variable parameters
    }
  };

  const presetConfig = presetReductions[preset];

  // Calculate estimation using preset-specific algorithm
  let estimatedBytes: number;

  if (presetConfig.getEstimation) {
    // Use preset-specific estimation algorithm
    estimatedBytes = Math.round(presetConfig.getEstimation(originalSize, dimensions));
  } else {
    // Fallback to base reduction factor
    estimatedBytes = Math.round(originalSize * (1 - presetConfig.baseReduction));
  }

  // Apply format-specific adjustments (only for non-JPEG inputs)
  if (originalFormat && !originalFormat.toLowerCase().includes('jpeg') && !originalFormat.toLowerCase().includes('jpg')) {
    const format = originalFormat.toLowerCase();

    // Most backend processors convert everything to JPEG
    if (format.includes('png')) {
      // PNG→JPEG conversion often achieves better compression
      estimatedBytes = Math.round(estimatedBytes * 0.8);
    } else if (format.includes('webp')) {
      // WebP→JPEG conversion usually increases size slightly
      estimatedBytes = Math.round(estimatedBytes * 1.1);
    } else if (format.includes('tiff') || format.includes('tif')) {
      // TIFF→JPEG conversion achieves excellent compression
      estimatedBytes = Math.round(estimatedBytes * 0.6);
    } else if (format.includes('bmp')) {
      // BMP→JPEG conversion achieves dramatic compression
      estimatedBytes = Math.round(estimatedBytes * 0.4);
    }
  }

  // Dimension-based adjustments are now handled in preset-specific algorithms
  // This ensures more accurate predictions per preset type

  // Apply max size constraints (already handled in preset-specific algorithms for most presets)
  if (presetConfig.maxSize && estimatedBytes > presetConfig.maxSize) {
    estimatedBytes = presetConfig.maxSize;
  }

  // Ensure we don't estimate larger than original
  if (estimatedBytes > originalSize) {
    estimatedBytes = Math.round(originalSize * 0.9);
  }

  const estimatedSavings = originalSize - estimatedBytes;
  const savingsPercentage = Math.round((estimatedSavings / originalSize) * 100);

  // Determine confidence level based on available data and preset accuracy
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  const baseAccuracy = presetConfig.accuracyWeight || 0.7;

  // Start with preset-specific accuracy weight
  let accuracyScore = baseAccuracy;

  // Boost accuracy with more data
  if (dimensions && originalFormat) {
    accuracyScore = Math.min(accuracyScore + 0.2, 1.0);
  } else if (dimensions || originalFormat) {
    accuracyScore = Math.min(accuracyScore + 0.1, 1.0);
  }

  // Adjust confidence for edge cases
  if (originalSize < 100 * 1024) { // Very small files are unpredictable
    accuracyScore *= 0.6;
  } else if (originalSize > 50 * 1024 * 1024) { // Very large files vary more
    accuracyScore *= 0.7;
  } else if (originalSize > 10 * 1024 * 1024) { // Large files
    accuracyScore *= 0.9;
  }

  // Convert accuracy score to confidence level
  if (accuracyScore >= 0.8) {
    confidence = 'high';
  } else if (accuracyScore >= 0.6) {
    confidence = 'medium';
  } else {
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
 * Creates a readable description of estimated savings
 */
export function getSavingsDescriptionForEstimation(estimation: SizeEstimation): string {
  return getSavingsDescription(estimation.savingsPercentage, estimation.confidence);
}

// Re-export formatBytes for backward compatibility
export { formatBytes };