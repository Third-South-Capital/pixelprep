interface UsageData {
  optimizations: number;
  lastOptimization: string;
}

interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    github_username: string;
  };
  expires_at: number;
}

class StorageService {
  private readonly USAGE_KEY = 'pixelprep_usage';
  private readonly AUTH_KEY = 'pixelprep_auth';

  // Usage tracking for anonymous users
  getUsageCount(): number {
    try {
      const data = localStorage.getItem(this.USAGE_KEY);
      if (!data) return 0;

      const parsed: UsageData = JSON.parse(data);
      return parsed.optimizations || 0;
    } catch {
      return 0;
    }
  }

  incrementUsage(): number {
    try {
      const current = this.getUsageCount();
      const newCount = current + 1;

      const usageData: UsageData = {
        optimizations: newCount,
        lastOptimization: new Date().toISOString()
      };

      console.log('🔍 [STORAGE] Incrementing usage from', current, 'to', newCount);
      localStorage.setItem(this.USAGE_KEY, JSON.stringify(usageData));
      console.log('🔍 [STORAGE] Saved to localStorage:', JSON.stringify(usageData));
      return newCount;
    } catch (error) {
      console.error('🔍 [STORAGE] Failed to increment usage:', error);
      return 1; // Return 1 if storage fails
    }
  }

  resetUsage(): void {
    try {
      localStorage.removeItem(this.USAGE_KEY);
    } catch {
      // Silently fail if storage unavailable
    }
  }

  // Authentication storage
  saveAuth(authData: AuthData): void {
    try {
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
    } catch {
      console.warn('Failed to save auth data');
    }
  }

  getAuth(): AuthData | null {
    try {
      const data = localStorage.getItem(this.AUTH_KEY);
      if (!data) return null;

      const parsed: AuthData = JSON.parse(data);

      // Check if token is expired
      if (parsed.expires_at && Date.now() > parsed.expires_at) {
        this.clearAuth();
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  clearAuth(): void {
    try {
      localStorage.removeItem(this.AUTH_KEY);
      // When user logs out, don't clear usage count -
      // they might want to log back in
    } catch {
      // Silently fail
    }
  }

  isAuthenticated(): boolean {
    return this.getAuth() !== null;
  }

  getAuthToken(): string | null {
    const auth = this.getAuth();
    return auth?.token || null;
  }

  hasExceededFreeLimit(): boolean {
    return !this.isAuthenticated() && this.getUsageCount() >= 1;
  }

  shouldPromptLogin(): boolean {
    return this.hasExceededFreeLimit();
  }
}

export const storageService = new StorageService();
export type { AuthData, UsageData };