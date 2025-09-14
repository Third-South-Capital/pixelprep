import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PresetSelector } from './components/PresetSelector';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Figmaman } from './components/Figmaman';
import { LoginPrompt } from './components/LoginPrompt';
import { UserHeader } from './components/UserHeader';
import { DarkModeToggle } from './components/DarkModeToggle';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SizePreview } from './components/SizePreview';
import { OnboardingTooltip, OnboardingControls } from './components/OnboardingTooltip';
import { apiService } from './services/api';
import { authService, type PixelPrepUser } from './services/auth';
import { configService } from './services/config';
import { storageService } from './services/storage';
import { getImageDimensions, analyzeImage, recommendPreset } from './utils/imageAnalysis';
import type { UploadState, ProcessorsResponse, PresetName } from './types';

function App() {
  const [processors, setProcessors] = useState<ProcessorsResponse | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preset: null,
    optimizationMode: 'presets',
    customOptimization: {
      strategy: 'quality', // Default as specified
      maxDimension: 'original',
      maxSizeMb: 5.0,
      format: 'JPEG'
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
        try {
          const processorsData = await apiService.getProcessors();
          console.log('🔍 [APP] Processors loaded successfully:', processorsData);
          console.log('🔍 [APP] Custom presets enabled in response:', processorsData?.custom_presets_enabled);
          setProcessors(processorsData);
        } catch (error) {
          console.error('🚨 [APP] Failed to load processors:', error);
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

        <div className="max-w-5xl mx-auto">
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

              <div className="bg-primary rounded-xl shadow-lg border border-primary p-10">
                <div className="space-y-8">
                  <OnboardingTooltip
                    id="upload-zone"
                    title="Start Here!"
                    content="Drag and drop your artwork or click to browse. We support JPEG, PNG, WebP, and TIFF files up to 50MB."
                    position="bottom"
                    onboardingStep={0}
                  >
                    <UploadZone
                      onFileSelect={handleFileSelect}
                      selectedFile={uploadState.file}
                      error={uploadState.error}
                    />
                  </OnboardingTooltip>

                  {uploadState.file && processors && (
                    <OnboardingTooltip
                      id="preset-selector"
                      title="Choose Your Style"
                      content="Each preset is optimized for different uses. The highlighted option is our smart recommendation based on your image dimensions."
                      position="top"
                      onboardingStep={1}
                    >
                      <PresetSelector
                        processors={processors}
                        selectedPreset={uploadState.preset}
                        onPresetSelect={handlePresetSelect}
                        recommendation={uploadState.recommendation}
                        imageAnalysis={uploadState.imageAnalysis}
                      />
                    </OnboardingTooltip>
                  )}

                  {uploadState.file && uploadState.preset && !uploadState.isUploading && (
                    <OnboardingTooltip
                      id="size-preview"
                      title="Size Preview"
                      content="See how much space you'll save before processing! This estimate is based on your file type and selected preset."
                      position="bottom"
                      onboardingStep={2}
                    >
                      <SizePreview
                        originalFile={uploadState.file}
                        preset={uploadState.preset}
                        dimensions={uploadState.imageAnalysis ? {
                          width: uploadState.imageAnalysis.width,
                          height: uploadState.imageAnalysis.height
                        } : undefined}
                      />
                    </OnboardingTooltip>
                  )}

                  {uploadState.file && uploadState.preset && !uploadState.isUploading && (
                    <div className="space-y-6">
                      {/* Metadata Toggle */}
                      <div className="flex justify-center">
                        <label className="group flex items-center space-x-3 text-sm text-secondary cursor-pointer bg-secondary rounded-xl px-4 py-3 hover:bg-tertiary transition-colors">
                          <input
                            type="checkbox"
                            checked={uploadState.includeMetadata}
                            onChange={(e) => handleMetadataToggle(e.target.checked)}
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
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          Click the button below to begin
                        </p>
                      </div>

                      {/* Manual Start Button (in case they want to start early) */}
                      <div className="flex justify-center">
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
                          <OnboardingTooltip
                            id="start-processing"
                            title="Ready to Optimize!"
                            content="Click this button to start optimizing your image. You're in complete control - processing only starts when you click!"
                            position="top"
                            onboardingStep={3}
                          >
                            <button
                              onClick={() => {
                                // Clear any pending timer (shouldn't exist now, but safe cleanup)
                                if (autoProcessTimer) {
                                  clearTimeout(autoProcessTimer);
                                  setAutoProcessTimer(null);
                                }
                                handleUpload();
                              }}
                              disabled={uploadState.isUploading}
                              className="accent-primary-bg text-inverse px-8 py-3 rounded-lg font-semibold accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Optimize Image{!user && usageCount === 0 ? ' (Free)' : ''}
                            </button>
                          </OnboardingTooltip>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadState.isUploading && (
                    <ProcessingStatus
                      preset={uploadState.preset || undefined}
                      fileName={uploadState.file?.name}
                    />
                  )}
              </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Figmaman floating character */}
      <Figmaman />

      {/* Onboarding Controls */}
      <OnboardingControls />

      {/* Login Prompt Modal */}
      {authEnabled && showLoginPrompt && (
        <LoginPrompt
          usageCount={usageCount}
          onClose={handleCloseLoginPrompt}
        />
      )}
    </div>
  );
}

export default App;
