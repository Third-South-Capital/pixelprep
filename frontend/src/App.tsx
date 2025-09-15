import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoginPrompt } from './components/LoginPrompt';
import { UserHeader } from './components/UserHeader';
import { DarkModeToggle } from './components/DarkModeToggle';
import { ProgressIndicator } from './components/ProgressIndicator';
import { DebugPanel } from './components/DebugPanel';
import { UnifiedWorkflow } from './components/UnifiedWorkflow';
import { SimpleTooltip } from './components/SimpleTooltip';
import { apiService } from './services/api';
import { authService, type PixelPrepUser } from './services/auth';
import { configService } from './services/config';
import { storageService } from './services/storage';
import { getImageDimensions, analyzeImage, recommendPreset } from './utils/imageAnalysis';
import type { UploadState, ProcessorsResponse, PresetName, CustomOptimization } from './types';

function App() {
  const [processors, setProcessors] = useState<ProcessorsResponse | null>(null);
  const [apiCallStatus, setApiCallStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiError, setApiError] = useState<string | undefined>(undefined);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preset: null,
    optimizationMode: 'presets',
    customOptimization: {
      maxSizeMb: 5.0,
      format: 'JPEG',
      quality: 85 // Default quality level
    },
    isUploading: false,
    result: null,
    error: null,
    includeMetadata: false,
  });

  // Auto-processing state
  const [autoProcessTimer, setAutoProcessTimer] = useState<NodeJS.Timeout | null>(null);

  // Global function to cancel auto-processing (called when tour is skipped)
  const cancelAutoProcessing = () => {
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
      console.log('🚫 [APP] Auto-processing cancelled (tour skipped)');
    }
  };

  // Expose cancelAutoProcessing globally for tour skip
  useEffect(() => {
    (window as any).cancelAutoProcessing = cancelAutoProcessing;
    return () => {
      delete (window as any).cancelAutoProcessing;
    };
  }, [autoProcessTimer]);

  // Authentication state
  const [user, setUser] = useState<PixelPrepUser | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Initialize the app
    const initializeApp = async () => {
      try {
        // Check auth configuration first
        console.log('🔍 [APP] Checking auth configuration...');
        const authConfig = await configService.getAuthConfig();
        setAuthRequired(authConfig.auth_required);
        setAuthEnabled(authConfig.auth_enabled);
        console.log('🔍 [APP] Auth config:', {
          required: authConfig.auth_required,
          enabled: authConfig.auth_enabled,
          mode: authConfig.mode
        });

        // First, check if this is an OAuth callback (only if auth is enabled)
        if (authConfig.auth_enabled && authService.hasAuthCallback()) {
          console.log('🔍 [APP] OAuth callback detected, processing...');
          await authService.handleAuthCallback();
        }

        // Load processors
        console.log('🔍 [APP] Loading processors from API...');
        setApiCallStatus('loading');
        try {
          const processorsData = await apiService.getProcessors();
          console.log('🔍 [APP] Processors loaded successfully:', processorsData);
          console.log('🔍 [APP] Custom presets enabled in response:', processorsData?.custom_presets_enabled);
          setProcessors(processorsData);
          setApiCallStatus('success');
          setApiError(undefined);
        } catch (error) {
          console.error('🚨 [APP] Failed to load processors:', error);
          setApiCallStatus('error');
          setApiError(error instanceof Error ? error.message : 'Unknown error');
        }

        // Set up Supabase auth state listener (only if auth is enabled)
        if (authConfig.auth_enabled) {
          unsubscribe = authService.onAuthStateChange((user) => {
            console.log('🔍 [AUTH STATE] User changed:', user?.email || 'anonymous');
            setUser(user);

            // If user signed out, reload usage count (only if auth is required)
            if (!user && authConfig.auth_required) {
              const currentUsage = storageService.getUsageCount();
              setUsageCount(currentUsage);
              console.log('🔍 [DEBUG] User signed out, usage count:', currentUsage);
            } else if (user) {
              // User signed in, close any login prompts and reset usage count
              setShowLoginPrompt(false);
              setUsageCount(0);
              console.log('🔍 [DEBUG] User signed in, closing prompts');
            }
          });
        }

        // Load initial usage count for anonymous users (only if auth is required)
        if (authConfig.auth_required && authConfig.auth_enabled && !authService.isAuthenticated()) {
          const currentUsage = storageService.getUsageCount();
          setUsageCount(currentUsage);
          console.log('🔍 [DEBUG] Initial usage count:', currentUsage);
        } else {
          console.log('🔍 [DEBUG] Auth not required or user authenticated - no usage tracking');
        }

        setIsInitializing(false);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Cleanup auto-process timer on unmount
  useEffect(() => {
    return () => {
      if (autoProcessTimer) {
        clearTimeout(autoProcessTimer);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    const validation = apiService.validateFile(file);
    if (!validation.isValid) {
      setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file', file: null }));
      return;
    }

    // Create preview URL for original image
    const originalImageUrl = URL.createObjectURL(file);

    // Initial state update
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
        optimizedImageUrl: undefined,
        imageAnalysis: undefined,
        recommendation: undefined,
        preset: null // Clear previous preset selection
      };
    });

    // Analyze image dimensions and recommend preset
    try {
      const dimensions = await getImageDimensions(file);
      const analysis = analyzeImage(dimensions.width, dimensions.height);
      const recommendation = recommendPreset(analysis);

      console.log('🔍 [IMAGE ANALYSIS]', {
        file: file.name,
        dimensions: `${dimensions.width}x${dimensions.height}`,
        analysis,
        recommendation
      });

      setUploadState(prev => ({
        ...prev,
        imageAnalysis: analysis,
        recommendation,
        preset: recommendation.preset // Auto-select recommended preset
      }));
    } catch (error) {
      console.warn('Failed to analyze image dimensions:', error);
      // Don't block the flow, just skip auto-selection
    }
  };


  const handlePresetSelect = (preset: PresetName, shouldAutoProcess: boolean = false) => {
    console.log('🎯 [PRESET SELECT] Called with:', { preset, shouldAutoProcess });

    setUploadState(prev => ({
      ...prev,
      preset,
      error: null,
      // Switch to custom mode when custom preset is selected
      optimizationMode: preset === 'custom' ? 'custom' : 'presets'
    }));

    // Clear any existing auto-processing timer
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
      console.log('🎯 [PRESET SELECT] Cleared existing auto-process timer');
    }

    // AUTO-PROCESSING DISABLED: Users must explicitly click "Optimize Image" button
    // This ensures full user control over when image processing starts
    console.log('🎯 [PRESET SELECT] Auto-processing disabled - user must click optimize button');
  };

  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.preset) return;

    setUploadState(prev => ({ ...prev, isUploading: true, error: null }));

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

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        result: metadata,
        optimizedImageUrl,
        optimizedBlob: blob,
        originalFileSize,
        isZip
      }));

      // Auto-scroll to results after state update
      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results]');
        if (resultsElement) {
          resultsElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        } else {
          // Fallback - scroll to bottom of page
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 300); // Allow time for DOM to update

      // Track usage for anonymous users and show login prompt if needed (only if auth is required)
      if (authRequired && authEnabled && !authService.isAuthenticated()) {
        const newUsageCount = storageService.incrementUsage();
        setUsageCount(newUsageCount);
        console.log('🔍 [DEBUG] Incremented usage count to:', newUsageCount);
        console.log('🔍 [DEBUG] localStorage content:', localStorage.getItem('pixelprep_usage'));

        // Show login prompt after first optimization
        if (newUsageCount === 1) {
          console.log('🔍 [DEBUG] First optimization completed - will show login prompt in 2 seconds');
          setTimeout(() => {
            console.log('🔍 [DEBUG] Showing login prompt now');
            setShowLoginPrompt(true);
          }, 2000); // Show prompt 2 seconds after successful optimization
        } else {
          console.log('🔍 [DEBUG] Usage count is', newUsageCount);
        }
      } else {
        console.log('🔍 [DEBUG] Auth not required or user authenticated - no usage tracking needed');
      }
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
      // Clean up URLs and timers to prevent memory leaks
      if (prev.originalImageUrl) URL.revokeObjectURL(prev.originalImageUrl);
      if (prev.optimizedImageUrl) URL.revokeObjectURL(prev.optimizedImageUrl);

      return {
        file: null,
        preset: null,
        optimizationMode: 'presets',
        isUploading: false,
        result: null,
        error: null,
        includeMetadata: prev.includeMetadata, // Preserve metadata setting
        originalImageUrl: undefined,
        optimizedImageUrl: undefined,
      };
    });

    // Clear any pending auto-process timer
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
    }
  };

  const handleMetadataToggle = (includeMetadata: boolean) => {
    setUploadState(prev => ({ ...prev, includeMetadata }));
  };

  const handleCustomOptimizationUpdate = (customOptimization: CustomOptimization & { quality?: number }) => {
    setUploadState(prev => ({ ...prev, customOptimization }));
  };

  const handleLogout = () => {
    setUser(null);
    // Only load usage count if auth is required
    if (authRequired) {
      setUsageCount(storageService.getUsageCount());
    } else {
      setUsageCount(0);
    }
    setShowLoginPrompt(false);
  };

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Check if user has exceeded free limit and should be blocked
  // Only apply usage limits when auth is required; otherwise allow unlimited access
  const hasExceededFreeLimit = authRequired && !user && usageCount >= 1;

  // Debug logging for state changes
  console.log('🔍 [DEBUG] Current state:', {
    user: !!user,
    usageCount,
    hasExceededFreeLimit,
    showLoginPrompt,
    isAuthenticated: authService.isAuthenticated()
  });

  // Show initialization loading screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 accent-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-primary mb-2">Loading PixelPrep...</h2>
          <p className="text-secondary">Setting up your workspace</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-primary">
      <div className="py-16 mx-auto max-w-5xl px-4">
        {/* Header with user info and dark mode toggle */}
        <div className="flex justify-between items-center mb-6">
          <DarkModeToggle />
          <div className="flex-1"></div>
          {authEnabled && user && <UserHeader user={user} onLogout={handleLogout} />}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-primary">
            PixelPrep
          </h1>
          <p className="text-xl text-secondary mb-4 max-w-3xl mx-auto">
            Professional image optimization designed for <span className="font-semibold accent-primary">artists</span>. Transform your artwork for Instagram, jury submissions, websites, and more – with the quality you demand.
          </p>

          {/* Usage indicator for anonymous users (only show if auth is enabled) */}
          {authEnabled && !user && usageCount > 0 && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-2xl text-sm font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                {usageCount} free optimization{usageCount !== 1 ? 's' : ''} used
                {hasExceededFreeLimit && (
                  <span className="ml-2 text-orange-600">
                    • <button
                      onClick={() => setShowLoginPrompt(true)}
                      className="underline hover:no-underline"
                    >
                      Sign in for unlimited use
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Anonymous mode indicator (when auth not required) */}
          {!authRequired && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-2xl text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Free unlimited access - no sign-up required
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          {uploadState.result ? (
            <div data-results>
              {/* Progress Indicator */}
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
              {/* Progress Indicator */}
              <ProgressIndicator
                currentStep={!uploadState.file ? 'upload' : 'preset'}
                isProcessing={uploadState.isUploading}
              />

              {/* Upload Zone - Only show when no file is selected */}
              {!uploadState.file && (
                <SimpleTooltip
                  title="Upload Your Artwork"
                  content="Drag & drop your image here or click to browse. We support JPEG, PNG, WebP, and TIFF files up to 10MB. Your image stays private and secure."
                  position="bottom"
                >
                  <div className="bg-primary rounded-xl shadow-lg border border-primary p-10">
                    <UploadZone
                      onFileSelect={handleFileSelect}
                      selectedFile={uploadState.file}
                      error={uploadState.error}
                    />
                  </div>
                </SimpleTooltip>
              )}

              {/* Unified Workflow - Show when file is uploaded but not processing */}
              {uploadState.file && !uploadState.isUploading && (
                <UnifiedWorkflow
                  uploadState={uploadState}
                  processors={processors}
                  onPresetSelect={handlePresetSelect}
                  onMetadataToggle={handleMetadataToggle}
                  onCustomOptimizationUpdate={handleCustomOptimizationUpdate}
                  onUpload={handleUpload}
                  onReset={resetUpload}
                  hasExceededFreeLimit={hasExceededFreeLimit}
                  setShowLoginPrompt={setShowLoginPrompt}
                />
              )}

              {/* Processing Status - Show during upload */}
              {uploadState.isUploading && (
                <div className="bg-primary rounded-xl shadow-lg border border-primary p-10">
                  <ProcessingStatus
                    preset={uploadState.preset || undefined}
                    fileName={uploadState.file?.name}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>



      {/* Login Prompt Modal */}
      {authEnabled && showLoginPrompt && (
        <LoginPrompt
          usageCount={usageCount}
          onClose={handleCloseLoginPrompt}
        />
      )}

      {/* Debug Panel - Show in both dev and production for debugging custom presets issue */}
      <DebugPanel
        processors={processors}
        apiCallStatus={apiCallStatus}
        apiError={apiError}
        showDebug={true} // Always show for now to debug production issue
      />
    </div>
  );
}

export default App;
