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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #faf5ff 50%, #f0fdfa 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 1rem'
      }}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-teal-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: '1.5rem'
          }}>
            PixelPrep
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Professional image optimization designed for <span className="font-semibold text-purple-600">artists</span>. Transform your artwork for Instagram, jury submissions, websites, and more – with the quality you demand.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {uploadState.result ? (
            <ResultsDisplay 
              result={uploadState.result}
              originalFile={uploadState.file!}
              originalImageUrl={uploadState.originalImageUrl}
              optimizedImageUrl={uploadState.optimizedImageUrl}
              onReset={resetUpload}
            />
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-100 p-10">
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
                  <div className="space-y-6">
                    {/* Metadata Toggle */}
                    <div className="flex justify-center">
                      <label className="group flex items-center space-x-3 text-sm text-gray-700 cursor-pointer bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={uploadState.includeMetadata}
                          onChange={(e) => handleMetadataToggle(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-2"
                        />
                        <div>
                          <span className="font-medium">Include metadata</span>
                          <div className="text-xs text-gray-500">ZIP format with processing details</div>
                        </div>
                      </label>
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleUpload}
                        disabled={uploadState.isUploading}
                        className="group relative bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:from-purple-400 disabled:to-teal-400 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-200"
                      >
                        {uploadState.isUploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Magic...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Optimize My Artwork
                          </>
                        )}
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
