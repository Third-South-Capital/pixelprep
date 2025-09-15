import { PresetSelector } from './PresetSelector';
import { SizePreview } from './SizePreview';
import { CustomOptionsPanel } from './CustomOptionsPanel';
import { SimpleTooltip } from './SimpleTooltip';
import type { UploadState, ProcessorsResponse, PresetName } from '../types';

interface UnifiedWorkflowProps {
  uploadState: UploadState;
  processors: ProcessorsResponse | null;
  onPresetSelect: (preset: PresetName) => void;
  onMetadataToggle: (includeMetadata: boolean) => void;
  onCustomOptimizationUpdate: (customOptimization: any) => void;
  onUpload: () => void;
  onReset: () => void;
  hasExceededFreeLimit: boolean;
  setShowLoginPrompt: (show: boolean) => void;
}

export function UnifiedWorkflow({
  uploadState,
  processors,
  onPresetSelect,
  onMetadataToggle,
  onCustomOptimizationUpdate,
  onUpload,
  onReset,
  hasExceededFreeLimit,
  setShowLoginPrompt
}: UnifiedWorkflowProps) {
  if (!processors || !uploadState.file) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="bg-primary rounded-xl shadow-lg border border-primary p-8">
        {/* Upload Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Upload Successful!
          </h2>
          <p className="text-secondary">
            Your artwork is ready for optimization
          </p>
        </div>

        {/* File Info */}
        <div className="bg-secondary rounded-lg p-4 border border-primary mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-primary">{uploadState.file.name}</h3>
              <p className="text-sm text-secondary">
                {(uploadState.file.size / (1024 * 1024)).toFixed(1)} MB
                {uploadState.imageAnalysis &&
                  ` • ${uploadState.imageAnalysis.width}×${uploadState.imageAnalysis.height}px`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selection Grid with Simple Tooltip */}
        <SimpleTooltip
          title="Choose Your Optimization Style"
          content="Select from our professionally-tuned presets designed for specific platforms. We've analyzed your image and highlighted the best match with a recommendation badge."
          position="top"
        >
          <div className="mb-8">
            <PresetSelector
              processors={processors}
              selectedPreset={uploadState.preset}
              onPresetSelect={onPresetSelect}
              recommendation={uploadState.recommendation}
              imageAnalysis={uploadState.imageAnalysis}
            />
          </div>
        </SimpleTooltip>

        {/* Custom Options Panel - Only show for custom preset */}
        {uploadState.preset === 'custom' && processors.custom_presets_enabled && processors.custom_dimensions_enabled && (
          <div className="mb-8">
            <CustomOptionsPanel
              customOptimization={uploadState.customOptimization || {
                maxSizeMb: 5.0,
                format: 'JPEG',
                quality: 85
              }}
              onUpdate={onCustomOptimizationUpdate}
              processors={processors}
            />
          </div>
        )}

        {/* Size Preview with Simple Tooltip - Only show when preset is selected */}
        {uploadState.preset && uploadState.preset !== 'custom' && (
          <SimpleTooltip
            title="File Size Preview"
            content="See exactly how your file size will change before processing. These estimates are based on your image's characteristics and the selected preset."
            position="top"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-2xl">
                <SizePreview
                  originalFile={uploadState.file}
                  preset={uploadState.preset}
                  dimensions={uploadState.imageAnalysis ? {
                    width: uploadState.imageAnalysis.width,
                    height: uploadState.imageAnalysis.height
                  } : undefined}
                />
              </div>
            </div>
          </SimpleTooltip>
        )}

        {/* Optimization Controls */}
        {uploadState.preset && (
          <div className="space-y-6">
            {/* Metadata Toggle */}
            <div className="flex justify-center">
              <label className="group flex items-center space-x-3 text-sm text-secondary cursor-pointer bg-secondary rounded-xl px-4 py-3 hover:bg-tertiary transition-colors">
                <input
                  type="checkbox"
                  checked={uploadState.includeMetadata}
                  onChange={(e) => onMetadataToggle(e.target.checked)}
                  className="rounded border-primary accent-primary focus:ring-2 focus:ring-accent-primary"
                />
                <div>
                  <span className="font-medium text-primary">Include metadata</span>
                  <div className="text-xs text-tertiary">ZIP format with processing details</div>
                </div>
              </label>
            </div>

            {/* Ready to optimize notification */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-medium border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Ready to optimize your artwork!</span>
              </div>
            </div>

            {/* Optimize Button with Simple Tooltip */}
            <div className="flex justify-center">
              <SimpleTooltip
                title="Start Optimization"
                content="Click here to process your image with the selected preset. Your optimized artwork will be ready for download in seconds!"
                position="top"
              >
                {hasExceededFreeLimit ? (
                  <div className="text-center">
                    <div className="bg-secondary border border-primary rounded-xl p-6 mb-4">
                      <div className="text-2xl mb-3">🔒</div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Free limit reached
                      </h3>
                      <p className="text-secondary text-sm mb-4">
                        You've used your free optimization! Sign in to continue optimizing unlimited images.
                      </p>
                      <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="accent-purple-bg text-inverse px-8 py-3 rounded-lg font-semibold accent-purple-hover transition-colors shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        Sign in with GitHub
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onUpload}
                    className="accent-primary-bg text-inverse px-8 py-3 rounded-lg font-semibold accent-primary-hover transition-colors shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Optimize Image
                  </button>
                )}
              </SimpleTooltip>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!uploadState.preset && (
          <div className="text-center py-8">
            <div className="text-secondary mb-4">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Select a preset above to continue</p>
            </div>
          </div>
        )}

        {/* Start Over Button */}
        <div className="text-center pt-4">
          <button
            onClick={onReset}
            className="text-secondary hover:text-primary text-sm underline hover:no-underline transition-colors"
          >
            Upload a different image
          </button>
        </div>
      </div>
    </div>
  );
}