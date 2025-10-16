import { APIClient } from './apiUtils';
import type {
  AuthRequest,
  RegisterRequest,
  AuthSuccessResponse,
  RefreshTokenSuccessResponse,
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
    return this.post<SuccessResponse>('/auth/logout');
  }

  async refreshToken(): Promise<RefreshTokenSuccessResponse> {
    return this.post<RefreshTokenSuccessResponse>('/auth/refresh', undefined, { skipAuth: true });
  }
}

export const authAPI = new AuthAPIClient();