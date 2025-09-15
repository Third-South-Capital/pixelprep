import type { ProcessorsResponse, OptimizationResult, ApiError, PresetName, CustomOptimization } from '../types';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://pixelprep.onrender.com'
  : 'http://localhost:8000';

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
  }
  async getProcessors(): Promise<ProcessorsResponse> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/optimize/processors`);
    if (!response.ok) {
      throw new Error(`Failed to fetch processors: ${response.status}`);
    }
    return response.json();
  }

  async optimizeImage(
    file: File,
    preset: PresetName,
    includeMetadata: boolean = true,
    customOptions?: CustomOptimization
  ): Promise<{ blob: Blob; metadata: OptimizationResult; isZip: boolean; originalFileSize?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preset', preset);

    // Add custom parameters if preset is custom
    if (preset === 'custom' && customOptions) {
      // Strategy is optional, backend defaults to 'quality'
      if (customOptions.strategy) {
        formData.append('custom_strategy', customOptions.strategy);
      }

      formData.append('custom_max_size_mb', customOptions.maxSizeMb.toString());
      formData.append('custom_format', customOptions.format);

      // Add quality parameter - defaults to 85 on backend if not specified
      if (customOptions.quality !== undefined) {
        formData.append('custom_quality', customOptions.quality.toString());
      }

      // Handle custom dimensions if specified
      if (customOptions.customWidth) {
        formData.append('custom_width', customOptions.customWidth.toString());
      }
      if (customOptions.customHeight) {
        formData.append('custom_height', customOptions.customHeight.toString());
      }
    }

    const format = includeMetadata ? 'zip' : 'image';
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/optimize/?format=${format}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error);
      } catch {
        throw new Error(`Upload failed: ${response.status}`);
      }
    }

    const blob = await response.blob();

    // Get the actual original file size from backend headers if available
    const backendOriginalSize = response.headers.get('X-Original-File-Size');
    const originalFileSize = backendOriginalSize ? parseInt(backendOriginalSize) : file.size;

    if (format === 'zip') {
      // Extract metadata from ZIP using response headers for accurate file size
      const metadata = await this.extractMetadataFromZip(blob, response, file, preset, originalFileSize);
      return { blob, metadata, isZip: true, originalFileSize };
    } else {
      // Create metadata from response headers
      const metadata = this.createMetadataFromHeaders(response, file, preset, originalFileSize);
      return { blob, metadata, isZip: false, originalFileSize };
    }
  }

  private createMetadataFromHeaders(response: Response, originalFile: File, preset: PresetName, originalFileSize?: number): OptimizationResult {
    const originalFilename = response.headers.get('X-Original-Filename') || originalFile.name;
    const dimensions = response.headers.get('X-Dimensions') || this.getPresetDimensions(preset);

    // CRITICAL: Get the actual optimized image size from headers
    // This MUST match the size from processor.save_optimized() exactly
    let fileSize = 0;
    const xFileSize = response.headers.get('X-File-Size');
    const contentLength = response.headers.get('content-length');

    if (xFileSize && !isNaN(parseInt(xFileSize))) {
      // Use backend-reported file size (from actual compression)
      fileSize = parseInt(xFileSize);
    } else if (contentLength && !isNaN(parseInt(contentLength))) {
      // Content-Length is the download size, not the image size
      console.warn('⚠️ Using Content-Length instead of X-File-Size - may cause inconsistency');
      fileSize = parseInt(contentLength);
    } else {
      // This should never happen - backend should always provide X-File-Size
      console.error('❌ Backend did not provide file size headers - file size will be inconsistent');
      const baseSize = originalFileSize || originalFile.size;
      fileSize = Math.round(baseSize * this.getCompressionRatio(preset));
    }
    
    return {
      preset,
      original_file: originalFilename,
      optimized_file: `${originalFile.name}_${preset}`,
      processor_config: {
        name: this.getPresetDisplayName(preset),
        description: this.getPresetDescription(preset),
        aspect_ratio: 'Preserved',
        use_case: this.getPresetUseCase(preset)
      },
      metadata: {
        file_size_bytes: fileSize,
        file_size_mb: Math.round(fileSize / 1024 / 1024 * 100) / 100,
        dimensions,
        format: response.headers.get('Content-Type')?.split('/')[1]?.toUpperCase() || 'JPEG'
      }
    };
  }

  private async extractMetadataFromZip(
    _zipBlob: Blob,
    response: Response,
    originalFile: File,
    preset: PresetName,
    originalFileSize?: number
  ): Promise<OptimizationResult> {
    // Get actual optimized file size from response headers
    const originalFilename = response.headers.get('X-Original-Filename') || originalFile.name;
    const dimensions = response.headers.get('X-Dimensions') || this.getPresetDimensions(preset);
    
    // CRITICAL: Get the actual optimized image size from headers
    // This MUST match the size from processor.save_optimized() exactly
    let optimizedSize = 0;
    const xFileSize = response.headers.get('X-File-Size');

    if (xFileSize && !isNaN(parseInt(xFileSize))) {
      // Use backend-reported file size (from actual compression)
      optimizedSize = parseInt(xFileSize);
    } else {
      // This should never happen - backend should always provide X-File-Size
      console.error('❌ Backend did not provide X-File-Size header - file size will be inconsistent');
      const baseSize = originalFileSize || originalFile.size;
      optimizedSize = Math.round(baseSize * this.getCompressionRatio(preset));
    }
    
    return {
      preset,
      original_file: originalFilename,
      optimized_file: `${originalFile.name.split('.')[0]}_${preset}.jpg`,
      processor_config: {
        name: this.getPresetDisplayName(preset),
        description: this.getPresetDescription(preset),
        aspect_ratio: 'Preserved',
        use_case: this.getPresetUseCase(preset)
      },
      metadata: {
        file_size_bytes: optimizedSize, // Use actual optimized size, not ZIP size
        file_size_mb: Math.round(optimizedSize / 1024 / 1024 * 100) / 100,
        dimensions,
        format: 'JPEG' // ZIP contains JPEG image
      }
    };
  }

  private getPresetDimensions(preset: PresetName): string {
    const dimensions = {
      'instagram_square': '1080×1080px',
      'jury_submission': '1920px longest side',
      'web_display': '1920px wide',
      'email_newsletter': '600px wide',
      'quick_compress': 'Original dimensions',
      'custom': 'Custom dimensions'
    };
    return dimensions[preset] || 'Optimized';
  }

  private getPresetDisplayName(preset: PresetName): string {
    const names = {
      'instagram_square': 'Instagram Square',
      'jury_submission': 'Jury Submission',
      'web_display': 'Web Display',
      'email_newsletter': 'Email Newsletter',
      'quick_compress': 'Quick Compress',
      'custom': 'Custom Optimization'
    };
    return names[preset] || 'Optimized Image';
  }

  private getPresetDescription(preset: PresetName): string {
    const descriptions = {
      'instagram_square': 'Perfect square format for Instagram posts',
      'jury_submission': 'High-quality format for competition submissions',
      'web_display': 'Optimized for websites and portfolios',
      'email_newsletter': 'Lightweight format for email campaigns',
      'quick_compress': 'Reduced file size while maintaining dimensions',
      'custom': 'Custom optimization with your specific settings'
    };
    return descriptions[preset] || 'Image optimized successfully';
  }

  private getCompressionRatio(preset: PresetName): number {
    // Conservative estimates for compression ratios by preset
    const ratios = {
      'instagram_square': 0.3,      // Aggressive compression for social media
      'jury_submission': 0.6,       // High quality, moderate compression
      'web_display': 0.4,           // Balanced for web performance
      'email_newsletter': 0.2,      // Maximum compression for email
      'quick_compress': 0.7,        // Light compression maintaining quality
      'custom': 0.5                 // Default for custom settings
    };
    return ratios[preset] || 0.5;
  }

  private getPresetUseCase(preset: PresetName): string {
    const useCases = {
      'instagram_square': 'Social media posts, portfolio sharing, engagement',
      'jury_submission': 'Art competitions, gallery submissions, professional portfolios',
      'web_display': 'Websites, online portfolios, blog posts',
      'email_newsletter': 'Email campaigns, newsletters, attachments',
      'quick_compress': 'File sharing, storage optimization, faster uploads',
      'custom': 'Tailored optimization for specific requirements'
    };
    return useCases[preset] || 'General image optimization';
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    const SUPPORTED_TYPES = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/tiff',
      'image/bmp'
    ];

    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than 25MB. Current size: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
      };
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WebP, TIFF, BMP`
      };
    }

    return { isValid: true };
  }

}

export const apiService = new ApiService();