import { supabase } from './supabase';
import { storageService } from './storage';
import type { User } from '@supabase/supabase-js';

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
      if (event === 'SIGNED_IN' && session?.user) {
        storageService.resetUsage();
        const pixelPrepUser = this.convertSupabaseUser(session.user);
        this.authStateListeners.forEach(listener => listener(pixelPrepUser));
        this.cleanupAuthHash();
      } else if (event === 'SIGNED_OUT') {
        this.authStateListeners.forEach(listener => listener(null));
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const pixelPrepUser = this.convertSupabaseUser(session.user);
        this.authStateListeners.forEach(listener => listener(pixelPrepUser));
      }
    });
  }

  async signInWithGitHub(): Promise<void> {
    const redirectUrl = import.meta.env.PROD
      ? 'https://third-south-capital.github.io/pixelprep/'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectUrl }
    });

    if (error) {
      throw new Error(`GitHub authentication failed: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<PixelPrepUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ? this.convertSupabaseUser(session.user) : null;
  }

  async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  isAuthenticated(): boolean {
    return Boolean(this.getCachedUser());
  }

  getUser(): PixelPrepUser | null {
    return this.getCachedUser();
  }

  private getCachedUser(): PixelPrepUser | null {
    try {
      // Simple localStorage check for auth state
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('auth') && key.includes('sb-')) {
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

  async handleAuthCallback(): Promise<void> {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('error'))) {
      try {
        await supabase.auth.getSession();
        this.cleanupAuthHash();
      } catch (error) {
        this.cleanupAuthHash();
      }
    }
  }

  private cleanupAuthHash(): void {
    if (window.location.hash && (
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('refresh_token') ||
      window.location.hash.includes('error')
    )) {
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