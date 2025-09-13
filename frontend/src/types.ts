export interface PresetConfig {
  name: string;
  description: string;
  dimensions?: string;
  max_dimension?: string;
  max_file_size?: string;
  file_size_range?: string;
  format?: string;
  primary_format?: string;
  fallback_format?: string;
  color_space?: string;
  dpi_range?: string;
  aspect_ratio: string;
  size_reduction?: string;
  use_case?: string;
}

export interface ProcessorsResponse {
  processors: Record<string, PresetConfig>;
  total_count: number;
  supported_formats: string[];
  max_file_size_mb: number;
  custom_presets_enabled?: boolean;
}

export interface OptimizationMetadata {
  file_size_bytes: number;
  file_size_mb: number;
  quality?: number;
  dimensions: string;
  format: string;
}

export interface OptimizationResult {
  preset: string;
  original_file: string;
  optimized_file: string;
  processor_config: PresetConfig;
  metadata: OptimizationMetadata;
}

export interface ApiError {
  error: string;
  status_code: number;
}

export type PresetName =
  | 'instagram_square'
  | 'jury_submission'
  | 'web_display'
  | 'email_newsletter'
  | 'quick_compress'
  | 'custom';

export type OptimizationMode = 'presets' | 'custom';

export type OptimizationStrategy = 'quality' | 'size';

export type MaxDimension = 'original' | '800' | '1200' | '1920';

export interface CustomOptimization {
  strategy: OptimizationStrategy;
  maxDimension: MaxDimension;
  customWidth?: number;
  customHeight?: number;
  maxSizeMb: number;
  format: string;
}

export interface ImageAnalysis {
  width: number;
  height: number;
  aspectRatio: number;
  isSquare: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isLarge: boolean; // > 2000px on any side
  isSmall: boolean; // < 800px on both sides
}

export interface PresetRecommendation {
  preset: PresetName;
  confidence: number; // 0-100
  reason: string;
  matchFactors: string[];
}

export interface UploadState {
  file: File | null;
  preset: PresetName | null;
  optimizationMode: OptimizationMode;
  customOptimization?: CustomOptimization;
  isUploading: boolean;
  result: OptimizationResult | null;
  error: string | null;
  includeMetadata: boolean;
  originalImageUrl?: string;
  optimizedImageUrl?: string;
  optimizedBlob?: Blob;
  originalFileSize?: number;
  isZip?: boolean;
  imageAnalysis?: ImageAnalysis;
  recommendation?: PresetRecommendation;
}