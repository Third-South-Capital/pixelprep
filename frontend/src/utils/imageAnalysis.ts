import type { ImageAnalysis, PresetRecommendation, PresetName } from '../types';

/**
 * Analyze image dimensions and characteristics
 */
export function analyzeImage(width: number, height: number): ImageAnalysis {
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
    isSquare: Math.abs(aspectRatio - 1) < 0.1, // Within 10% of 1:1
    isPortrait: aspectRatio < 0.9, // Clearly taller than wide
    isLandscape: aspectRatio > 1.1, // Clearly wider than tall
    isLarge: width > 2000 || height > 2000,
    isSmall: width < 800 && height < 800,
  };
}

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Smart preset recommendation based on image analysis
 */
export function recommendPreset(analysis: ImageAnalysis): PresetRecommendation {
  const { width, height, aspectRatio, isSquare, isPortrait, isLandscape, isLarge, isSmall } = analysis;

  // Instagram Square (1:1 ratio, social media optimized)
  if (isSquare) {
    return {
      preset: 'instagram_square',
      confidence: 95,
      reason: 'Perfect for social media sharing',
      matchFactors: ['Square aspect ratio (1:1)', 'Ideal for Instagram posts', 'Great for portfolios']
    };
  }

  // Instagram Portrait for portrait images (especially if not too tall)
  if (isPortrait && aspectRatio > 0.7) { // Not extremely tall
    return {
      preset: 'instagram_square', // Still recommend square for social
      confidence: 80,
      reason: 'Great for social media with some cropping',
      matchFactors: ['Portrait orientation', 'Works well as Instagram post', 'Social media friendly']
    };
  }

  // Web Display for large landscape images
  if (isLandscape && isLarge) {
    return {
      preset: 'web_display',
      confidence: 90,
      reason: 'Perfect for websites and online galleries',
      matchFactors: ['Landscape orientation', 'High resolution', 'Web-optimized format']
    };
  }

  // Email Newsletter for small images
  if (isSmall) {
    return {
      preset: 'email_newsletter',
      confidence: 85,
      reason: 'Optimized for email and fast loading',
      matchFactors: ['Compact size', 'Email-friendly', 'Fast loading']
    };
  }

  // Jury Submission for large, high-quality images (professional use)
  if (isLarge && !isSquare) {
    return {
      preset: 'jury_submission',
      confidence: 85,
      reason: 'Professional quality for submissions',
      matchFactors: ['High resolution', 'Professional format', 'Gallery quality']
    };
  }

  // Web Display as general fallback for medium-large landscape
  if (isLandscape) {
    return {
      preset: 'web_display',
      confidence: 75,
      reason: 'Versatile for web use',
      matchFactors: ['Landscape orientation', 'Web-friendly']
    };
  }

  // Quick Compress as fallback for unusual dimensions
  return {
    preset: 'quick_compress',
    confidence: 60,
    reason: 'Reduces file size while keeping original proportions',
    matchFactors: ['Preserves original dimensions', 'File size optimization']
  };
}

/**
 * Get a friendly description of image characteristics
 */
export function getImageDescription(analysis: ImageAnalysis): string {
  const { width, height, isSquare, isPortrait, isLandscape, isLarge, isSmall } = analysis;

  let orientation = '';
  if (isSquare) orientation = 'square';
  else if (isPortrait) orientation = 'portrait';
  else if (isLandscape) orientation = 'landscape';

  let size = '';
  if (isLarge) size = 'high-resolution';
  else if (isSmall) size = 'compact';
  else size = 'medium-sized';

  return `${size} ${orientation} image (${width}×${height}px)`;
}