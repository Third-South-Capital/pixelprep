import { storageService, type AuthData } from './storage';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://pixelprep.onrender.com'
  : 'http://localhost:8000';

interface AuthUrlResponse {
  auth_url: string;
  state: string;
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  github_username: string;
  subscription_tier: string | null;
  created_at: string;
  updated_at: string;
}

interface LoginSuccessResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

class AuthService {
  async getLoginUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/github/login`);
    if (!response.ok) {
      throw new Error('Failed to get login URL');
    }

    const data: AuthUrlResponse = await response.json();
    return data.auth_url;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/github/callback?code=${code}&state=${state}`);

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data: LoginSuccessResponse = await response.json();

    // Calculate expiration time
    const expiresAt = Date.now() + (data.expires_in * 1000);

    const authData: AuthData = {
      token: data.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.display_name,
        avatar_url: data.user.avatar_url,
        github_username: data.user.github_username
      },
      expires_at: expiresAt
    };

    storageService.saveAuth(authData);

    // Clear usage count when user successfully authenticates
    storageService.resetUsage();
  }

  async getCurrentUser(): Promise<User | null> {
    const token = storageService.getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token might be invalid, clear auth
        storageService.clearAuth();
        return null;
      }

      return await response.json();
    } catch {
      // Network error or invalid response
      return null;
    }
  }

  async logout(): Promise<void> {
    const token = storageService.getAuthToken();

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch {
        // Logout endpoint might fail, but we still clear local storage
      }
    }

    storageService.clearAuth();
  }

  redirectToLogin(): void {
    this.getLoginUrl().then(url => {
      window.location.href = url;
    }).catch(error => {
      console.error('Failed to redirect to login:', error);
    });
  }

  isAuthenticated(): boolean {
    return storageService.isAuthenticated();
  }

  getUser(): { id: string; email: string; display_name: string | null; avatar_url: string | null; github_username: string } | null {
    const auth = storageService.getAuth();
    return auth?.user || null;
  }

  getToken(): string | null {
    return storageService.getAuthToken();
  }

  // Check URL for OAuth callback parameters
  checkForAuthCallback(): { code: string; state: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      return { code, state };
    }

    return null;
  }

  // Clean up URL after processing callback
  cleanupCallbackUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
  }
}

export const authService = new AuthService();
export type { User, AuthUrlResponse, LoginSuccessResponse };