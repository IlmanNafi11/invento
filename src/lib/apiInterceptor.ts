import type { BaseResponse, ErrorResponse } from '@/types';
import { setAccessToken, clearAuth } from './tokenManager';

export type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
export type ResponseInterceptor<T = BaseResponse> = (response: T) => T | Promise<T>;
export type ErrorInterceptor = (error: unknown) => unknown | Promise<unknown>;

interface InterceptorConfig {
  onRequest?: RequestInterceptor;
  onResponse?: ResponseInterceptor;
  onError?: ErrorInterceptor;
}

export class APIInterceptor {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let modifiedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  async applyResponseInterceptors<T extends BaseResponse>(response: T): Promise<T> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = (await interceptor(modifiedResponse)) as T;
    }
    return modifiedResponse;
  }

  async applyErrorInterceptors(error: unknown): Promise<unknown> {
    let modifiedError = error;
    for (const interceptor of this.errorInterceptors) {
      modifiedError = await interceptor(modifiedError);
    }
    return modifiedError;
  }

  clearRequestInterceptors(): void {
    this.requestInterceptors = [];
  }

  clearResponseInterceptors(): void {
    this.responseInterceptors = [];
  }

  clearErrorInterceptors(): void {
    this.errorInterceptors = [];
  }

  clearAll(): void {
    this.clearRequestInterceptors();
    this.clearResponseInterceptors();
    this.clearErrorInterceptors();
  }
}

export const globalInterceptor = new APIInterceptor();

export function setupDefaultInterceptors(config?: InterceptorConfig): void {
  if (config?.onRequest) {
    globalInterceptor.addRequestInterceptor(config.onRequest);
  }

  if (config?.onResponse) {
    globalInterceptor.addResponseInterceptor(config.onResponse);
  }

  if (config?.onError) {
    globalInterceptor.addErrorInterceptor(config.onError);
  }

  globalInterceptor.addRequestInterceptor((config) => {
    return config;
  });

  globalInterceptor.addResponseInterceptor((response) => {
    return response;
  });

  globalInterceptor.addErrorInterceptor(async (error) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 401
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        clearAuth();
        window.location.href = '/login';
      }
    }
    throw error;
  });
}

export const tokenRefreshInterceptor: ErrorInterceptor = async (error) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 401
  ) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw error;
      }

      const data = await response.json();
      setAccessToken(data.data.access_token);
      return error;
    } catch {
      clearAuth();
      window.location.href = '/login';
      throw error;
    }
  }

  throw error;
};

export const loggingInterceptor = {
  request: (config: RequestInit): RequestInit => {
    return config;
  },

  response: <T extends BaseResponse>(response: T): T => {
    return response;
  },

  error: (error: unknown): unknown => {
    throw error;
  },
};

export const rateLimitInterceptor: ErrorInterceptor = async (error) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 429
  ) {
    const retryAfter = 5000;
    await new Promise((resolve) => setTimeout(resolve, retryAfter));
    throw error;
  }

  throw error;
};

export const networkErrorInterceptor: ErrorInterceptor = async (error) => {
  if (error instanceof TypeError) {
    const networkError: ErrorResponse = {
      success: false,
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      code: 0,
      timestamp: new Date().toISOString(),
    };
    throw networkError;
  }

  throw error;
};
