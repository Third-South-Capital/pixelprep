/**
 * Common utility functions shared across components.
 * This consolidates repeated patterns and reduces code duplication.
 */

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
 * Formats percentage with consistent styling
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Creates a confidence-based description prefix
 */
export function getConfidencePrefix(confidence: 'high' | 'medium' | 'low'): string {
  const confidenceText = {
    high: '',
    medium: 'approximately ',
    low: 'roughly '
  };
  return confidenceText[confidence];
}

/**
 * Generates consistent savings descriptions
 */
export function getSavingsDescription(
  savingsPercentage: number,
  confidence: 'high' | 'medium' | 'low' = 'medium'
): string {
  const prefix = getConfidencePrefix(confidence);

  if (savingsPercentage >= 70) {
    return `${prefix}${savingsPercentage}% smaller - dramatic size reduction!`;
  } else if (savingsPercentage >= 50) {
    return `${prefix}${savingsPercentage}% smaller - excellent compression`;
  } else if (savingsPercentage >= 30) {
    return `${prefix}${savingsPercentage}% smaller - good space saving`;
  } else if (savingsPercentage >= 10) {
    return `${prefix}${savingsPercentage}% smaller - modest reduction`;
  } else {
    return `${prefix}${savingsPercentage}% smaller - minimal compression`;
  }
}

/**
 * Validates file types consistently
 */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp'
  ];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

/**
 * Capitalizes first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounces function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generates consistent CSS classes for status indicators
 */
export function getStatusClasses(status: 'success' | 'warning' | 'error' | 'info'): string {
  const statusClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return statusClasses[status];
}

/**
 * Generates consistent confidence badge classes
 */
export function getConfidenceBadgeClasses(confidence: number): string {
  if (confidence >= 90) {
    return 'bg-green-100 text-green-800';
  } else if (confidence >= 80) {
    return 'bg-blue-100 text-blue-800';
  } else {
    return 'bg-yellow-100 text-yellow-800';
  }
}

/**
 * Creates a standardized error message
 */
export function createErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Checks if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Creates a download link for a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}