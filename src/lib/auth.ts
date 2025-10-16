import { APIClient } from './apiUtils';
import type {
  AuthRequest,
  RegisterRequest,
  AuthSuccessResponse,
  RefreshTokenSuccessResponse,
  SuccessResponse,
} from '@/types';

interface ResetPasswordOTPRequest {
  email: string;
}

interface VerifyResetPasswordOTPRequest {
  email: string;
  code: string;
  type: 'register' | 'reset_password';
}

interface ConfirmResetPasswordOTPRequest {
  email: string;
  code: string;
  new_password: string;
}

interface ResendOTPRequest {
  email: string;
  type: 'register' | 'reset_password';
}

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

  async initiateResetPasswordOTP(data: ResetPasswordOTPRequest): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/auth/reset-password/otp', data, { skipAuth: true });
  }

  async verifyResetPasswordOTP(data: VerifyResetPasswordOTPRequest): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/auth/reset-password/verify-otp', data, { skipAuth: true });
  }

  async confirmResetPasswordOTP(data: ConfirmResetPasswordOTPRequest): Promise<AuthSuccessResponse> {
    return this.post<AuthSuccessResponse>('/auth/reset-password/confirm-otp', data, { skipAuth: true });
  }

  async resendResetPasswordOTP(data: ResendOTPRequest): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/auth/reset-password/resend-otp', data, { skipAuth: true });
  }
}

export const authAPI = new AuthAPIClient();