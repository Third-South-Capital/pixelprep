/**
 * Configuration service for checking authentication requirements
 */

interface AuthHealthResponse {
  status: string;
  auth_required: boolean;
  auth_enabled: boolean;
  mode: string;
  github_oauth: boolean;
  jwt_configured: boolean;
  supabase_connected: boolean;
}

class ConfigService {
  private authConfig: AuthHealthResponse | null = null;

  async getAuthConfig(): Promise<AuthHealthResponse> {
    if (!this.authConfig) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/health`);
        if (!response.ok) {
          throw new Error(`Failed to fetch auth config: ${response.status}`);
        }
        this.authConfig = await response.json();
      } catch (error) {
        console.error('Failed to load auth configuration:', error);
        // Fallback to auth required mode if we can't reach the server
        this.authConfig = {
          status: 'unknown',
          auth_required: false, // Default to anonymous mode on error
          auth_enabled: false,
          mode: 'anonymous_optional',
          github_oauth: false,
          jwt_configured: false,
          supabase_connected: false
        };
      }
    }
    return this.authConfig!;
  }

  async isAuthRequired(): Promise<boolean> {
    const config = await this.getAuthConfig();
    return config.auth_required;
  }

  async isAuthEnabled(): Promise<boolean> {
    const config = await this.getAuthConfig();
    return config.auth_enabled;
  }

  async getAuthMode(): Promise<string> {
    const config = await this.getAuthConfig();
    return config.mode;
  }

  // Clear cache when needed (e.g., during development)
  clearCache(): void {
    this.authConfig = null;
  }
}

export const configService = new ConfigService();
export type { AuthHealthResponse };