import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PresetSelector } from './components/PresetSelector';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsDisplay } from './components/ResultsDisplay';
import { apiService } from './services/api';
import type { UploadState, ProcessorsResponse, PresetName } from './types';

function App() {
  const [processors, setProcessors] = useState<ProcessorsResponse | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preset: null,
    isUploading: false,
    result: null,
    error: null,
    includeMetadata: true,
  });

  useEffect(() => {
    apiService.getProcessors().then(setProcessors).catch(console.error);
  }, []);

  const handleFileSelect = (file: File) => {
    const validation = apiService.validateFile(file);
    if (!validation.isValid) {
      setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file', file: null }));
      return;
    }

    // Create preview URL for original image
    const originalImageUrl = URL.createObjectURL(file);

    setUploadState(prev => {
      // Clean up previous URLs to prevent memory leaks
      if (prev.originalImageUrl) URL.revokeObjectURL(prev.originalImageUrl);
      if (prev.optimizedImageUrl) URL.revokeObjectURL(prev.optimizedImageUrl);
      
      return { 
        ...prev, 
        file, 
        error: null, 
        result: null,
        originalImageUrl,
        optimizedImageUrl: undefined
      };
    });
  };

  const handlePresetSelect = (preset: PresetName) => {
    setUploadState(prev => ({ ...prev, preset, error: null }));
  };

  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.preset) return;

    setUploadState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      const { blob, metadata, isZip } = await apiService.optimizeImage(
        uploadState.file, 
        uploadState.preset, 
        uploadState.includeMetadata
      );
      
      // Create preview URL for optimized image (only for non-ZIP)
      let optimizedImageUrl: string | undefined;
      if (!isZip) {
        optimizedImageUrl = URL.createObjectURL(blob);
      }
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      if (isZip) {
        a.download = `optimized_${uploadState.file.name.replace(/\.[^/.]+$/, '')}_${uploadState.preset}.zip`;
      } else {
        const extension = metadata.metadata.format.toLowerCase();
        a.download = `${uploadState.file.name.replace(/\.[^/.]+$/, '')}_${uploadState.preset}.${extension}`;
      }
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        result: metadata,
        optimizedImageUrl
      }));
    } catch (error) {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }));
    }
  };

  const resetUpload = () => {
    setUploadState(prev => {
      // Clean up URLs to prevent memory leaks
      if (prev.originalImageUrl) URL.revokeObjectURL(prev.originalImageUrl);
      if (prev.optimizedImageUrl) URL.revokeObjectURL(prev.optimizedImageUrl);
      
      return {
        file: null,
        preset: null,
        isUploading: false,
        result: null,
        error: null,
        includeMetadata: prev.includeMetadata, // Preserve metadata setting
        originalImageUrl: undefined,
        optimizedImageUrl: undefined,
      };
    });
  };

  const handleMetadataToggle = (includeMetadata: boolean) => {
    setUploadState(prev => ({ ...prev, includeMetadata }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PixelPrep</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional image optimization for artists. Resize and optimize your artwork for Instagram, jury submissions, websites, and more.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {uploadState.result ? (
            <ResultsDisplay 
              result={uploadState.result}
              originalFile={uploadState.file!}
              originalImageUrl={uploadState.originalImageUrl}
              optimizedImageUrl={uploadState.optimizedImageUrl}
              onReset={resetUpload}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-8">
                <UploadZone 
                  onFileSelect={handleFileSelect}
                  selectedFile={uploadState.file}
                  error={uploadState.error}
                />

                {uploadState.file && processors && (
                  <PresetSelector
                    processors={processors}
                    selectedPreset={uploadState.preset}
                    onPresetSelect={handlePresetSelect}
                  />
                )}

                {uploadState.file && uploadState.preset && (
                  <div className="space-y-4">
                    {/* Metadata Toggle */}
                    <div className="flex justify-center">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={uploadState.includeMetadata}
                          onChange={(e) => handleMetadataToggle(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Include metadata (ZIP format)</span>
                      </label>
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleUpload}
                        disabled={uploadState.isUploading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                      >
                        {uploadState.isUploading ? 'Processing...' : 'Optimize Image'}
                      </button>
                    </div>
                  </div>
                )}

                {uploadState.isUploading && <ProcessingStatus />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
