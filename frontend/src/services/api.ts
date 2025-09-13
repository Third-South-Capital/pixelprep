import type { ProcessorsResponse, OptimizationResult, ApiError, PresetName } from '../types';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://pixelprep.onrender.com'
  : 'http://localhost:8000';

class ApiService {
  async getProcessors(): Promise<ProcessorsResponse> {
    const response = await fetch(`${API_BASE_URL}/optimize/processors`);
    if (!response.ok) {
      throw new Error(`Failed to fetch processors: ${response.status}`);
    }
    return response.json();
  }

  async optimizeImage(
    file: File, 
    preset: PresetName, 
    includeMetadata: boolean = true
  ): Promise<{ blob: Blob; metadata: OptimizationResult; isZip: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preset', preset);

    const format = includeMetadata ? 'zip' : 'image';
    const response = await fetch(`${API_BASE_URL}/optimize/?format=${format}`, {
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
    
    if (format === 'zip') {
      // Extract metadata from ZIP
      const metadata = await this.extractMetadataFromZip(blob);
      return { blob, metadata, isZip: true };
    } else {
      // Create metadata from response headers
      const metadata = this.createMetadataFromHeaders(response, file, preset);
      return { blob, metadata, isZip: false };
    }
  }

  private createMetadataFromHeaders(response: Response, originalFile: File, preset: PresetName): OptimizationResult {
    const originalFilename = response.headers.get('X-Original-Filename') || originalFile.name;
    const dimensions = response.headers.get('X-Dimensions') || this.getPresetDimensions(preset);
    
    // Try multiple headers to get file size
    let fileSize = 0;
    const xFileSize = response.headers.get('X-File-Size');
    const contentLength = response.headers.get('content-length');
    
    if (xFileSize && !isNaN(parseInt(xFileSize))) {
      fileSize = parseInt(xFileSize);
    } else if (contentLength && !isNaN(parseInt(contentLength))) {
      fileSize = parseInt(contentLength);
    } else {
      // Fallback: estimate based on original file size and preset
      fileSize = Math.round(originalFile.size * this.getCompressionRatio(preset));
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

  private async extractMetadataFromZip(zipBlob: Blob): Promise<OptimizationResult> {
    // Extract metadata from response headers if available
    // The backend should include the actual optimized image size in headers even for ZIP responses
    const optimizedSize = Math.round(zipBlob.size * 0.7); // Estimate ~70% of ZIP size is the actual image
    
    const placeholderMetadata: OptimizationResult = {
      preset: 'optimized',
      original_file: 'uploaded_file',
      optimized_file: 'optimized_file',
      processor_config: {
        name: 'Processing Complete',
        description: 'Image has been optimized and packaged with metadata',
        aspect_ratio: 'Preserved'
      },
      metadata: {
        file_size_bytes: optimizedSize, // Use estimated optimized size instead of ZIP size
        file_size_mb: Math.round(optimizedSize / 1024 / 1024 * 100) / 100,
        dimensions: 'Optimized',
        format: 'ZIP'
      }
    };

    return placeholderMetadata;
  }

  private getPresetDimensions(preset: PresetName): string {
    const dimensions = {
      'instagram_square': '1080×1080px',
      'jury_submission': '1920px longest side',
      'web_display': '1920px wide',
      'email_newsletter': '600px wide',
      'quick_compress': 'Original dimensions'
    };
    return dimensions[preset] || 'Optimized';
  }

  private getPresetDisplayName(preset: PresetName): string {
    const names = {
      'instagram_square': 'Instagram Square',
      'jury_submission': 'Jury Submission',
      'web_display': 'Web Display',
      'email_newsletter': 'Email Newsletter',
      'quick_compress': 'Quick Compress'
    };
    return names[preset] || 'Optimized Image';
  }

  private getPresetDescription(preset: PresetName): string {
    const descriptions = {
      'instagram_square': 'Perfect square format for Instagram posts',
      'jury_submission': 'High-quality format for competition submissions',
      'web_display': 'Optimized for websites and portfolios',
      'email_newsletter': 'Lightweight format for email campaigns',
      'quick_compress': 'Reduced file size while maintaining dimensions'
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
      'quick_compress': 0.7         // Light compression maintaining quality
    };
    return ratios[preset] || 0.5;
  }

  private getPresetUseCase(preset: PresetName): string {
    const useCases = {
      'instagram_square': 'Social media posts, portfolio sharing, engagement',
      'jury_submission': 'Art competitions, gallery submissions, professional portfolios',
      'web_display': 'Websites, online portfolios, blog posts',
      'email_newsletter': 'Email campaigns, newsletters, attachments',
      'quick_compress': 'File sharing, storage optimization, faster uploads'
    };
    return useCases[preset] || 'General image optimization';
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
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
        error: `File size must be less than 10MB. Current size: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
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