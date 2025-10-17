import { setAccessToken, clearAuth } from './tokenManager';

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

class TokenRefreshManager {
  private refreshPromise: Promise<string> | null = null;
  private subscribers: RefreshSubscriber[] = [];

  isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }

  subscribe(onTokenRefreshed: (token: string) => void, onTokenRefreshFailed: (error: Error) => void): void {
    this.subscribers.push({
      resolve: onTokenRefreshed,
      reject: onTokenRefreshFailed,
    });
  }

  private notifySubscribers(token: string): void {
    this.subscribers.forEach((subscriber) => {
      subscriber.resolve(token);
    });
    this.subscribers = [];
  }

  private notifySubscribersOfFailure(error: Error): void {
    this.subscribers.forEach((subscriber) => {
      subscriber.reject(error);
    });
    this.subscribers = [];
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      const token = await this.refreshPromise;
      this.notifySubscribers(token);
      return token;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      this.notifySubscribersOfFailure(err);
      throw err;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (!data.data?.access_token) {
        throw new Error('No access token in refresh response');
      }

      setAccessToken(data.data.access_token);
      return data.data.access_token;
    } catch (error) {
      clearAuth();

      throw error instanceof Error ? error : new Error('Token refresh failed');
    }
  }

  reset(): void {
    this.refreshPromise = null;
    this.subscribers = [];
  }
}

export const tokenRefreshManager = new TokenRefreshManager();
