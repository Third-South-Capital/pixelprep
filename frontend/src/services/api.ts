import type { ProcessorsResponse, OptimizationResult, ApiError, PresetName } from '../types';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://pixelprep-api.onrender.com'
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
    const dimensions = response.headers.get('X-Dimensions') || 'Unknown';
    const fileSize = parseInt(response.headers.get('X-File-Size') || '0');
    
    return {
      preset,
      original_file: originalFilename,
      optimized_file: `${originalFile.name}_${preset}`,
      processor_config: {
        name: `${preset.charAt(0).toUpperCase() + preset.slice(1).replace('_', ' ')}`,
        description: 'Image optimized successfully',
        aspect_ratio: 'Preserved'
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
    // For now, we'll return a placeholder metadata object
    // In a real implementation, you'd use a ZIP library like JSZip to extract metadata.json
    // Since this is just for display purposes and the main functionality is the download,
    // we'll create a basic metadata structure
    
    const placeholderMetadata: OptimizationResult = {
      preset: 'unknown',
      original_file: 'uploaded_file',
      optimized_file: 'optimized_file',
      processor_config: {
        name: 'Processing Complete',
        description: 'Image has been optimized',
        aspect_ratio: 'Preserved'
      },
      metadata: {
        file_size_bytes: zipBlob.size,
        file_size_mb: Math.round(zipBlob.size / 1024 / 1024 * 100) / 100,
        dimensions: 'Optimized',
        format: 'ZIP'
      }
    };

    return placeholderMetadata;
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