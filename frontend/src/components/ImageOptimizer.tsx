import { useUpload } from '../contexts/UploadContext';
import { UploadZone } from './UploadZone';
import { ProcessingStatus } from './ProcessingStatus';
import { ResultsDisplay } from './ResultsDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { UnifiedWorkflow } from './UnifiedWorkflow';
import { apiService } from '../services/api';
import { getImageDimensions, analyzeImage, recommendPreset } from '../utils/imageAnalysis';
import type { ProcessorsResponse, PresetName, CustomOptimization } from '../types';

interface ImageOptimizerProps {
  processors: ProcessorsResponse | null;
  hasExceededFreeLimit: boolean;
  onOptimizationComplete: () => void;
  onShowLoginPrompt: () => void;
}

export function ImageOptimizer({
  processors,
  hasExceededFreeLimit,
  onOptimizationComplete,
  onShowLoginPrompt
}: ImageOptimizerProps) {
  const {
    uploadState,
    updateUploadState,
    resetUpload,
    setPreset,
    setCustomOptimization,
    setMetadata,
    setUploading,
    setError
  } = useUpload();

  const handleFileSelect = async (file: File) => {
    const validation = apiService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview URL and update state
    const originalImageUrl = URL.createObjectURL(file);

    // Clean up previous URLs
    if (uploadState.originalImageUrl) URL.revokeObjectURL(uploadState.originalImageUrl);
    if (uploadState.optimizedImageUrl) URL.revokeObjectURL(uploadState.optimizedImageUrl);

    updateUploadState({
      file,
      error: null,
      result: null,
      originalImageUrl,
      optimizedImageUrl: undefined,
      imageAnalysis: undefined,
      recommendation: undefined,
      preset: null
    });

    // Analyze image and recommend preset
    try {
      const dimensions = await getImageDimensions(file);
      const analysis = analyzeImage(dimensions.width, dimensions.height);
      const recommendation = recommendPreset(analysis);

      updateUploadState({
        imageAnalysis: analysis,
        recommendation,
        preset: recommendation.preset
      });
    } catch (error) {
      // Don't block the flow, just skip auto-selection
    }
  };

  const handlePresetSelect = (preset: PresetName) => {
    setPreset(preset);
  };

  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.preset) return;

    setUploading(true);

    try {
      const { blob, metadata, isZip, originalFileSize } = await apiService.optimizeImage(
        uploadState.file,
        uploadState.preset,
        uploadState.includeMetadata,
        uploadState.customOptimization
      );

      // Create preview URL for optimized image (only for non-ZIP)
      let optimizedImageUrl: string | undefined;
      if (!isZip) {
        optimizedImageUrl = URL.createObjectURL(blob);
      }

      updateUploadState({
        isUploading: false,
        result: metadata,
        optimizedImageUrl,
        optimizedBlob: blob,
        originalFileSize,
        isZip
      });

      // Auto-scroll to results
      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results]');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 300);

      onOptimizationComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleMetadataToggle = (includeMetadata: boolean) => {
    setMetadata(includeMetadata);
  };

  const handleCustomOptimizationUpdate = (customOptimization: CustomOptimization & { quality?: number }) => {
    setCustomOptimization(customOptimization);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {uploadState.result ? (
        <div data-results>
          <ProgressIndicator currentStep="download" />
          <ResultsDisplay
            result={uploadState.result}
            originalFile={uploadState.file!}
            originalImageUrl={uploadState.originalImageUrl}
            optimizedImageUrl={uploadState.optimizedImageUrl}
            optimizedBlob={uploadState.optimizedBlob}
            originalFileSize={uploadState.originalFileSize}
            isZip={uploadState.isZip}
            onReset={resetUpload}
          />
        </div>
      ) : (
        <>
          <ProgressIndicator
            currentStep={!uploadState.file ? 'upload' : 'preset'}
            isProcessing={uploadState.isUploading}
          />

          {!uploadState.file && (
            <div className="w-full max-w-4xl">
              <div
                className="bg-primary rounded-xl shadow-lg border border-primary p-10"
                title="Upload Your Artwork: Drag & drop your image here or click to browse. We support JPEG, PNG, WebP, and TIFF files up to 25MB. Your image stays private and secure."
              >
                <UploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={uploadState.file}
                  error={uploadState.error}
                />
              </div>
            </div>
          )}

          {uploadState.file && !uploadState.isUploading && (
            <div className="w-full max-w-4xl">
              <UnifiedWorkflow
                uploadState={uploadState}
                processors={processors}
                onPresetSelect={handlePresetSelect}
                onMetadataToggle={handleMetadataToggle}
                onCustomOptimizationUpdate={handleCustomOptimizationUpdate}
                onUpload={handleUpload}
                onReset={resetUpload}
                hasExceededFreeLimit={hasExceededFreeLimit}
                setShowLoginPrompt={onShowLoginPrompt}
              />
            </div>
          )}

          {uploadState.isUploading && (
            <div className="w-full max-w-4xl">
              <div className="bg-primary rounded-xl shadow-lg border border-primary p-10">
                <ProcessingStatus
                  preset={uploadState.preset || undefined}
                  fileName={uploadState.file?.name}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}