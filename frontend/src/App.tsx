import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PresetSelector } from './components/PresetSelector';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Figmaman } from './components/Figmaman';
import { LoginPrompt } from './components/LoginPrompt';
import { UserHeader } from './components/UserHeader';
import { DarkModeToggle } from './components/DarkModeToggle';
import { apiService } from './services/api';
import { authService, type PixelPrepUser } from './services/auth';
import { storageService } from './services/storage';
import type { UploadState, ProcessorsResponse, PresetName } from './types';

function App() {
  const [processors, setProcessors] = useState<ProcessorsResponse | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preset: null,
    isUploading: false,
    result: null,
    error: null,
    includeMetadata: false,
  });

  // Authentication state
  const [user, setUser] = useState<PixelPrepUser | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Initialize the app
    const initializeApp = async () => {
      try {
        // First, check if this is an OAuth callback
        if (authService.hasAuthCallback()) {
          console.log('🔍 [APP] OAuth callback detected, processing...');
          await authService.handleAuthCallback();
        }

        // Load processors
        const processorsData = await apiService.getProcessors();
        setProcessors(processorsData);

        // Set up Supabase auth state listener
        unsubscribe = authService.onAuthStateChange((user) => {
          console.log('🔍 [AUTH STATE] User changed:', user?.email || 'anonymous');
          setUser(user);

          // If user signed out, reload usage count
          if (!user) {
            const currentUsage = storageService.getUsageCount();
            setUsageCount(currentUsage);
            console.log('🔍 [DEBUG] User signed out, usage count:', currentUsage);
          } else {
            // User signed in, close any login prompts
            setShowLoginPrompt(false);
            console.log('🔍 [DEBUG] User signed in, closing prompts');
          }
        });

        // Load initial usage count for anonymous users
        if (!authService.isAuthenticated()) {
          const currentUsage = storageService.getUsageCount();
          setUsageCount(currentUsage);
          console.log('🔍 [DEBUG] Initial usage count:', currentUsage);
        } else {
          console.log('🔍 [DEBUG] User is already authenticated');
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

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        result: metadata,
        optimizedImageUrl,
        optimizedBlob: blob,
        isZip
      }));

      // Track usage for anonymous users and show login prompt if needed
      if (!authService.isAuthenticated()) {
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
          console.log('🔍 [DEBUG] Usage count is', newUsageCount, '- should show limit if >= 1');
        }
      } else {
        console.log('🔍 [DEBUG] User is authenticated - no usage tracking needed');
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

  const handleLogout = () => {
    setUser(null);
    setUsageCount(storageService.getUsageCount());
    setShowLoginPrompt(false);
  };

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Check if user has exceeded free limit and should be blocked
  const hasExceededFreeLimit = !user && usageCount >= 1;

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
          {user && <UserHeader user={user} onLogout={handleLogout} />}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-primary">
            PixelPrep
          </h1>
          <p className="text-xl text-secondary mb-4 max-w-3xl mx-auto">
            Professional image optimization designed for <span className="font-semibold accent-primary">artists</span>. Transform your artwork for Instagram, jury submissions, websites, and more – with the quality you demand.
          </p>

          {/* Usage indicator for anonymous users */}
          {!user && usageCount > 0 && (
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
        </div>

        <div className="max-w-5xl mx-auto">
          {uploadState.result ? (
            <ResultsDisplay
              result={uploadState.result}
              originalFile={uploadState.file!}
              originalImageUrl={uploadState.originalImageUrl}
              optimizedImageUrl={uploadState.optimizedImageUrl}
              optimizedBlob={uploadState.optimizedBlob}
              isZip={uploadState.isZip}
              onReset={resetUpload}
            />
          ) : (
            <div className="bg-primary rounded-xl shadow-lg border border-primary p-10">
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
                    
                    {/* Upload Button */}
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
                        <button
                          onClick={handleUpload}
                          disabled={uploadState.isUploading}
                          className="accent-primary-bg text-inverse px-8 py-3 rounded-lg font-semibold accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              {user ? 'Optimize My Artwork' : `Optimize My Artwork ${usageCount === 0 ? '(Free)' : ''}`}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {uploadState.isUploading && <ProcessingStatus />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Figmaman floating character */}
      <Figmaman />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPrompt
          usageCount={usageCount}
          onClose={handleCloseLoginPrompt}
        />
      )}
    </div>
  );
}

export default App;
