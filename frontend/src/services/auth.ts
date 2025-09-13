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

      if (event === 'SIGNED_IN' && session?.user) {
        // Clear usage count when user successfully authenticates
        storageService.resetUsage();

        // Notify listeners with user data
        const pixelPrepUser = this.convertSupabaseUser(session.user);
        this.authStateListeners.forEach(listener => listener(pixelPrepUser));
      } else if (event === 'SIGNED_OUT') {
        // Notify listeners that user signed out
        this.authStateListeners.forEach(listener => listener(null));
      }
    });
  }

  async signInWithGitHub(): Promise<void> {
    console.log('🔍 [SUPABASE AUTH] Initiating GitHub OAuth');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
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
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('🔍 [SUPABASE AUTH] Get session error:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
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
      // Check localStorage directly for session (Supabase stores session here)
      const storedSession = localStorage.getItem('sb-zhxhuzcbsvumopxnhfxm-auth-token');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed.user) {
          return this.convertSupabaseUser(parsed.user);
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

  // Legacy method compatibility - now just redirects to Supabase OAuth
  redirectToLogin(): void {
    this.signInWithGitHub().catch(error => {
      console.error('Failed to redirect to login:', error);
    });
  }
}

export const authService = new AuthService();
export type { PixelPrepUser };