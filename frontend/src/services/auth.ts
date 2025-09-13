import { supabase } from './supabase';
import { storageService } from './storage';
import type { User, Session } from '@supabase/supabase-js';

interface PixelPrepUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  github_username: string;
}

class AuthService {
  private authStateListeners: ((user: PixelPrepUser | null) => void)[] = [];

  constructor() {
    // Listen for auth state changes from Supabase
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 [SUPABASE AUTH] State change:', event, session?.user?.email || 'no user');

      // Debug token lifecycle
      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000);
        const timeUntilExpiry = session.expires_at! * 1000 - Date.now();
        console.log('🔍 [TOKEN] Expires at:', expiresAt.toISOString());
        console.log('🔍 [TOKEN] Time until expiry:', Math.round(timeUntilExpiry / 1000), 'seconds');
        console.log('🔍 [TOKEN] Refresh token present:', !!session.refresh_token);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Clear usage count when user successfully authenticates
        storageService.resetUsage();

        // Notify listeners with user data
        const pixelPrepUser = this.convertSupabaseUser(session.user);
        this.authStateListeners.forEach(listener => listener(pixelPrepUser));

        // Clean up URL hash after successful auth
        this.cleanupAuthHash();
      } else if (event === 'SIGNED_OUT') {
        // Notify listeners that user signed out
        this.authStateListeners.forEach(listener => listener(null));
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔍 [SUPABASE AUTH] Token refreshed successfully');
        // Update listeners with refreshed session
        const pixelPrepUser = this.convertSupabaseUser(session.user);
        this.authStateListeners.forEach(listener => listener(pixelPrepUser));
      }
    });
  }

  async signInWithGitHub(): Promise<void> {
    console.log('🔍 [SUPABASE AUTH] Initiating GitHub OAuth');

    // For GitHub Pages, we need the full URL including the path
    const redirectUrl = import.meta.env.PROD
      ? 'https://third-south-capital.github.io/pixelprep/'
      : window.location.origin;

    console.log('🔍 [SUPABASE AUTH] Redirect URL:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error('🔍 [SUPABASE AUTH] GitHub OAuth error:', error);
      throw new Error(`GitHub authentication failed: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    console.log('🔍 [SUPABASE AUTH] Signing out');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('🔍 [SUPABASE AUTH] Sign out error:', error);
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<PixelPrepUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        return null;
      }

      return this.convertSupabaseUser(session.user);
    } catch (error) {
      console.error('🔍 [SUPABASE AUTH] Get current user error:', error);
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('🔍 [SUPABASE AUTH] Get session error:', error);
        return null;
      }

      // Check if session is valid and not expired
      if (session && session.expires_at) {
        const timeUntilExpiry = (session.expires_at * 1000) - Date.now();

        if (timeUntilExpiry <= 0) {
          console.log('🔍 [SUPABASE AUTH] Session expired, attempting refresh...');
          return await this.refreshSessionIfNeeded();
        }
      }

      return session;
    } catch (error) {
      console.error('🔍 [SUPABASE AUTH] Get session error:', error);
      return null;
    }
  }

  // Refresh session if needed and return new session
  private async refreshSessionIfNeeded(): Promise<Session | null> {
    try {
      console.log('🔍 [SUPABASE AUTH] Refreshing session...');

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('🔍 [SUPABASE AUTH] Session refresh failed:', refreshError);
        return null;
      }

      if (refreshData.session) {
        console.log('🔍 [SUPABASE AUTH] Session refreshed successfully');
        return refreshData.session;
      }

      return null;
    } catch (error) {
      console.error('🔍 [SUPABASE AUTH] Refresh session error:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('🔍 [SUPABASE AUTH] Session retrieval error:', error);
        return null;
      }

      if (!session) {
        console.log('🔍 [SUPABASE AUTH] No active session found');
        return null;
      }

      // Check if token is close to expiry (within 5 minutes)
      const timeUntilExpiry = (session.expires_at! * 1000) - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilExpiry < fiveMinutes) {
        console.log('🔍 [SUPABASE AUTH] Token expires soon, attempting refresh...');

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('🔍 [SUPABASE AUTH] Token refresh failed:', refreshError);
          return session.access_token; // Return current token anyway
        }

        if (refreshData.session) {
          console.log('🔍 [SUPABASE AUTH] Token refreshed successfully');
          return refreshData.session.access_token;
        }
      }

      return session.access_token;
    } catch (error) {
      console.error('🔍 [SUPABASE AUTH] Get access token error:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    // We'll check this synchronously by checking if we have a cached session
    // This is used for immediate UI decisions
    return Boolean(this.getCachedUser());
  }

  getUser(): PixelPrepUser | null {
    return this.getCachedUser();
  }

  private getCachedUser(): PixelPrepUser | null {
    // Get the current session synchronously from Supabase's internal cache
    // This is safe to call synchronously after auth state has been established
    try {
      // Use Supabase's internal client state instead of manually accessing localStorage
      // This is more reliable and handles the correct key format

      // Since getSession() is async but we need sync access, we'll check multiple possible localStorage keys
      const possibleKeys = [
        'sb-zhxhuzcbsvumopxnhfxm-auth-token',
        `sb-zhxhuzcbsvumopxnhfxm-auth-token`, // Current format attempt
        'supabase.auth.token', // Alternative format
        'sb-' + 'zhxhuzcbsvumopxnhfxm' + '-auth-token' // Explicit construction
      ];

      for (const key of possibleKeys) {
        try {
          const storedSession = localStorage.getItem(key);
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            if (parsed.user) {
              return this.convertSupabaseUser(parsed.user);
            }
          }
        } catch {
          continue;
        }
      }

      // As a fallback, also check for any key containing the project ID
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('zhxhuzcbsvumopxnhfxm') && key.includes('auth')) {
          try {
            const storedSession = localStorage.getItem(key);
            if (storedSession) {
              const parsed = JSON.parse(storedSession);
              if (parsed.user) {
                console.log('🔍 [AUTH] Found session in localStorage key:', key);
                return this.convertSupabaseUser(parsed.user);
              }
            }
          } catch {
            continue;
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return null;
  }

  onAuthStateChange(callback: (user: PixelPrepUser | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Immediately call with current user state
    const currentUser = this.getCachedUser();
    callback(currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private convertSupabaseUser(user: User): PixelPrepUser {
    // Extract GitHub info from user metadata
    const githubUsername = user.user_metadata?.user_name ||
                          user.user_metadata?.preferred_username ||
                          user.email?.split('@')[0] ||
                          'user';

    const displayName = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.user_metadata?.display_name ||
                       githubUsername;

    const avatarUrl = user.user_metadata?.avatar_url ||
                     user.user_metadata?.picture ||
                     `https://github.com/${githubUsername}.png`;

    return {
      id: user.id,
      email: user.email || '',
      display_name: displayName,
      avatar_url: avatarUrl,
      github_username: githubUsername
    };
  }

  // Handle OAuth callback tokens from URL hash
  async handleAuthCallback(): Promise<void> {
    const hash = window.location.hash;
    console.log('🔍 [SUPABASE AUTH] Checking URL hash for auth tokens:', hash ? 'present' : 'none');

    if (hash && (hash.includes('access_token') || hash.includes('error'))) {
      console.log('🔍 [SUPABASE AUTH] Processing auth callback from hash immediately');

      try {
        // Force Supabase to process the hash immediately
        // This triggers the auth state change event
        await supabase.auth.getSession();

        // Wait a brief moment for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the session after processing
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('🔍 [SUPABASE AUTH] Session retrieval error:', error);
          throw error;
        }

        if (session) {
          console.log('🔍 [SUPABASE AUTH] Successfully processed callback, user:', session.user.email);

          // Debug the session immediately
          const expiresAt = new Date(session.expires_at! * 1000);
          const timeUntilExpiry = session.expires_at! * 1000 - Date.now();
          console.log('🔍 [CALLBACK] Session established, expires:', expiresAt.toISOString());
          console.log('🔍 [CALLBACK] Time until expiry:', Math.round(timeUntilExpiry / 1000), 'seconds');

          // If token expires very soon, try to refresh immediately
          if (timeUntilExpiry < 60000) { // Less than 1 minute
            console.log('🔍 [CALLBACK] Token expires very soon, refreshing immediately...');
            await supabase.auth.refreshSession();
          }
        } else {
          console.log('🔍 [SUPABASE AUTH] No session found after callback processing');
        }
      } catch (error) {
        console.error('🔍 [SUPABASE AUTH] Callback processing failed:', error);
        this.cleanupAuthHash(); // Clean up even on error
      }
    }
  }

  // Clean up URL hash after authentication
  private cleanupAuthHash(): void {
    if (window.location.hash && (
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('refresh_token') ||
      window.location.hash.includes('error')
    )) {
      console.log('🔍 [SUPABASE AUTH] Cleaning up auth hash from URL');

      // Remove the hash without reloading the page
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  // Check if current URL has auth callback parameters
  hasAuthCallback(): boolean {
    const hash = window.location.hash;
    return Boolean(hash && (hash.includes('access_token') || hash.includes('error')));
  }

  // Legacy method compatibility - now just redirects to Supabase OAuth
  redirectToLogin(): void {
    this.signInWithGitHub().catch(error => {
      console.error('Failed to redirect to login:', error);
    });
  }
}

export const authService = new AuthService();
export type { PixelPrepUser };