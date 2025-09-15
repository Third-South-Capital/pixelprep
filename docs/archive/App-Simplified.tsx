import { useState, useEffect } from 'react';
import { UploadProvider } from './contexts/UploadContext';
import { ImageOptimizer } from './components/ImageOptimizer';
import { LoginPrompt } from './components/LoginPrompt';
import { UserHeader } from './components/UserHeader';
import { DarkModeToggle } from './components/DarkModeToggle';
import { DebugPanel } from './components/DebugPanel';
import { apiService } from './services/api';
import { authService, type PixelPrepUser } from './services/auth';
import { configService } from './services/config';
import { storageService } from './services/storage';
import type { ProcessorsResponse } from './types';

function AppContent() {
  const [processors, setProcessors] = useState<ProcessorsResponse | null>(null);
  const [apiCallStatus, setApiCallStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiError, setApiError] = useState<string | undefined>(undefined);

  // Auth state
  const [user, setUser] = useState<PixelPrepUser | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        // Check auth configuration
        const authConfig = await configService.getAuthConfig();
        setAuthRequired(authConfig.auth_required);
        setAuthEnabled(authConfig.auth_enabled);

        // Handle OAuth callback if present
        if (authConfig.auth_enabled && authService.hasAuthCallback()) {
          await authService.handleAuthCallback();
        }

        // Load processors
        try {
          const processorsData = await apiService.getProcessors();
          setProcessors(processorsData);
          setApiCallStatus('success');
          setApiError(undefined);
        } catch (error) {
          setApiCallStatus('error');
          setApiError(error instanceof Error ? error.message : 'Unknown error');
        }

        // Set up auth state listener
        if (authConfig.auth_enabled) {
          unsubscribe = authService.onAuthStateChange((user) => {
            setUser(user);
            if (!user && authConfig.auth_required) {
              setUsageCount(storageService.getUsageCount());
            } else if (user) {
              setShowLoginPrompt(false);
              setUsageCount(0);
            }
          });
        }

        // Load initial usage count for anonymous users
        if (authConfig.auth_required && authConfig.auth_enabled && !authService.isAuthenticated()) {
          setUsageCount(storageService.getUsageCount());
        }

        setIsInitializing(false);
      } catch (error) {
        setIsInitializing(false);
      }
    };

    initializeApp();
    return () => unsubscribe?.();
  }, []);

  const handleLogout = () => {
    setUser(null);
    if (authRequired) {
      setUsageCount(storageService.getUsageCount());
    } else {
      setUsageCount(0);
    }
    setShowLoginPrompt(false);
  };

  const handleOptimizationComplete = () => {
    // Track usage for anonymous users and show login prompt if needed
    if (authRequired && authEnabled && !authService.isAuthenticated()) {
      const newUsageCount = storageService.incrementUsage();
      setUsageCount(newUsageCount);

      if (newUsageCount === 1) {
        setTimeout(() => setShowLoginPrompt(true), 2000);
      }
    }
  };

  // Check if user has exceeded free limit
  const hasExceededFreeLimit = authRequired && !user && usageCount >= 1;

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <DarkModeToggle />
          <div className="flex-1"></div>
          {authEnabled && user && <UserHeader user={user} onLogout={handleLogout} />}
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-primary">PixelPrep</h1>
          <p className="text-xl text-secondary mb-4 max-w-3xl mx-auto">
            Professional image optimization designed for <span className="font-semibold accent-primary">artists</span>.
            Transform your artwork for Instagram, jury submissions, websites, and more – with the quality you demand.
          </p>

          {/* Usage indicator */}
          {authEnabled && !user && usageCount > 0 && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-2xl text-sm font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                {usageCount} free optimization{usageCount !== 1 ? 's' : ''} used
                {hasExceededFreeLimit && (
                  <span className="ml-2 text-orange-600">
                    • <button onClick={() => setShowLoginPrompt(true)} className="underline hover:no-underline">
                      Sign in for unlimited use
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Anonymous mode indicator */}
          {!authRequired && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-2xl text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Free unlimited access - no sign-up required
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <ImageOptimizer
          processors={processors}
          hasExceededFreeLimit={hasExceededFreeLimit}
          onOptimizationComplete={handleOptimizationComplete}
          onShowLoginPrompt={() => setShowLoginPrompt(true)}
        />
      </div>

      {/* Login Prompt Modal */}
      {authEnabled && showLoginPrompt && (
        <LoginPrompt usageCount={usageCount} onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* Debug Panel */}
      {import.meta.env.DEV && (
        <DebugPanel
          processors={processors}
          apiCallStatus={apiCallStatus}
          apiError={apiError}
          showDebug={true}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <UploadProvider>
      <AppContent />
    </UploadProvider>
  );
}

export default App;