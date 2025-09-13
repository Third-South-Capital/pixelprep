import { useState } from 'react';
import { authService, type PixelPrepUser } from '../services/auth';

interface UserHeaderProps {
  user: PixelPrepUser;
  onLogout: () => void;
}

export function UserHeader({ user, onLogout }: UserHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.signOut();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  const displayName = user.display_name || user.github_username;
  const avatarUrl = user.avatar_url || `https://github.com/${user.github_username}.png`;

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 bg-primary rounded-xl px-4 py-2 shadow-lg hover:shadow-xl border border-primary transition-all duration-200 hover:bg-secondary"
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full border-2 border-primary"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=32`;
          }}
        />
        <div className="text-left hidden sm:block">
          <div className="text-sm font-semibold text-primary">{displayName}</div>
          <div className="text-xs accent-primary">Pro User</div>
        </div>
        <svg
          className={`w-4 h-4 text-tertiary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-primary rounded-xl shadow-2xl border border-primary z-50 overflow-hidden">
          <div className="p-4 border-b border-secondary">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full border-2 border-primary"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=40`;
                }}
              />
              <div>
                <div className="font-semibold text-primary">{displayName}</div>
                <div className="text-sm text-secondary">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="px-3 py-2 text-sm text-secondary bg-secondary rounded-lg mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 accent-secondary-bg rounded-full"></div>
                <span className="font-medium">Unlimited optimizations</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing out...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}