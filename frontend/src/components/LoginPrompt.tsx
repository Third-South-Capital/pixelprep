import { useState } from 'react';
import { authService } from '../services/auth';

interface LoginPromptProps {
  onClose: () => void;
  usageCount: number;
}

export function LoginPrompt({ onClose, usageCount }: LoginPromptProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await authService.signInWithGitHub();
      // The onAuthStateChange callback will handle closing the modal
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-6 text-white text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h2 className="text-2xl font-bold mb-2">Love PixelPrep?</h2>
          <p className="text-purple-100">
            You've used your free optimization!
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-gray-700 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {usageCount} optimization{usageCount !== 1 ? 's' : ''} used
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Sign in for unlimited use
            </h3>

            <div className="text-gray-600 text-sm space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                <span>Unlimited image optimizations</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                <span>Save your optimization history</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                <span>Access all your processed images</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  Continue with GitHub
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 px-6 py-3 rounded-2xl font-medium transition-colors duration-200"
            >
              Maybe later
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              We never post to your GitHub or access private repos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}