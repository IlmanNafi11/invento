import { APIClient } from './apiUtils';
import type {
  AuthRequest,
  RegisterRequest,
  AuthSuccessResponse,
  SuccessResponse,
} from '@/types';

class AuthAPIClient extends APIClient {
  async login(credentials: AuthRequest): Promise<AuthSuccessResponse> {
    return this.post<AuthSuccessResponse>('/auth/login', credentials, { skipAuth: true });
  }

  async register(userData: RegisterRequest): Promise<AuthSuccessResponse> {
    return this.post<AuthSuccessResponse>('/auth/register', userData, { skipAuth: true });
  }

  async logout(): Promise<SuccessResponse> {
    const refreshToken = this.getRefreshToken();
    return this.post<SuccessResponse>('/auth/logout', undefined, {
      customHeaders: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthSuccessResponse> {
    return this.post<AuthSuccessResponse>('/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true });
  }
}

export const authAPI = new AuthAPIClient();