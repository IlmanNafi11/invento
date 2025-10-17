import type {
  BaseResponse,
  ErrorResponse,
  ValidationErrorResponse,
} from '@/types';
import { getAccessToken } from './tokenManager';
import { tokenRefreshManager } from './tokenRefreshManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  customHeaders?: HeadersInit;
}

interface DownloadConfig extends RequestConfig {
  extractFilename?: boolean;
}

interface DownloadResult {
  blob: Blob;
  filename: string;
}

type APIError = ErrorResponse | ValidationErrorResponse;

export class APIClient {
  protected baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  protected getAuthToken(): string | null {
    return getAccessToken();
  }

  protected getAuthHeaders(skipAuth: boolean = false): HeadersInit {
    if (skipAuth) {
      return {};
    }
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  protected buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  protected async request<T extends BaseResponse>(
    endpoint: string,
    config: RequestConfig = {},
    retryCount: number = 0
  ): Promise<T> {
    const { skipAuth = false, customHeaders, ...fetchOptions } = config;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(skipAuth),
      ...customHeaders,
    };

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !skipAuth && retryCount === 0) {
          try {
            await tokenRefreshManager.refreshToken();
            return this.request<T>(endpoint, config, retryCount + 1);
          } catch {
            const { store } = await import('./store');
            store.dispatch({ type: 'auth/clearAuthState' });
            throw data as APIError;
          }
        }

        throw data as APIError;
      }

      return data as T;
    } catch (error) {
      if (this.isAPIError(error)) {
        throw error;
      }
      throw this.createNetworkError(error);
    }
  }

  protected async get<T extends BaseResponse>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    config?: RequestConfig
  ): Promise<T> {
    const url = params ? this.buildURL(endpoint, params) : endpoint;
    return this.request<T>(url.replace(this.baseURL, ''), {
      ...config,
      method: 'GET',
    });
  }

  protected async post<T extends BaseResponse>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async put<T extends BaseResponse>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async patch<T extends BaseResponse>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async delete<T extends BaseResponse>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  protected async upload<T extends BaseResponse>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<T> {
    const { skipAuth = false, customHeaders, ...fetchOptions } = config || {};

    const headers: HeadersInit = {
      ...this.getAuthHeaders(skipAuth),
      ...customHeaders,
    };

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw data as APIError;
      }

      return data as T;
    } catch (error) {
      if (this.isAPIError(error)) {
        throw error;
      }
      throw this.createNetworkError(error);
    }
  }

  protected async download(
    endpoint: string,
    body?: unknown,
    config?: DownloadConfig
  ): Promise<DownloadResult> {
    const { skipAuth = false, customHeaders, extractFilename = true, ...fetchOptions } = config || {};

    const authHeaders = this.getAuthHeaders(skipAuth);
    const headers: HeadersInit = {
      ...authHeaders,
      ...customHeaders,
    };

    if (body && typeof headers === 'object' && !Array.isArray(headers)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          throw data as APIError;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const filename = extractFilename
        ? this.extractFilenameFromResponse(response)
        : 'download';

      const clonedResponse = response.clone();
      let blob: Blob;
      
      try {
        blob = await response.blob();
      } catch {
        try {
          const arrayBuffer = await clonedResponse.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          blob = new Blob([arrayBuffer], { type: contentType });
        } catch (arrayBufferError) {
          throw new Error(`Gagal membaca response body: ${arrayBufferError instanceof Error ? arrayBufferError.message : 'Unknown error'}`);
        }
      }
      
      if (blob.size === 0) {
        throw new Error('Response body kosong - file tidak ditemukan atau kosong');
      }

      return { blob, filename };
    } catch (error) {
      console.error('Download catch block error:', error);
      if (this.isAPIError(error)) {
        console.log('Error is APIError, throwing as-is');
        throw error;
      }
      if (error instanceof Error) {
        console.log('Error is Error instance, wrapping:', error.message);
        throw {
          success: false,
          message: error.message,
          code: 0,
          timestamp: new Date().toISOString(),
        } as APIError;
      }
      console.log('Error is unknown type, creating network error');
      throw this.createNetworkError(error);
    }
  }

  private extractFilenameFromResponse(response: Response): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (!contentDisposition) {
      return 'download';
    }

    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      try {
        return decodeURIComponent(filenameStarMatch[1]);
      } catch {
        return filenameStarMatch[1];
      }
    }

    const filenameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (filenameMatch?.[1]) {
      return filenameMatch[1];
    }

    return 'download';
  }

  private isAPIError(error: unknown): error is APIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'success' in error &&
      'message' in error &&
      'code' in error
    );
  }

  private createNetworkError(error: unknown): ErrorResponse {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan jaringan',
      code: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
