import { useState } from 'react';
import { authAPI } from '@/lib/auth';
import { handleAPIError } from '@/lib/apiErrorHandler';
import type { User, RegisterRequest } from '@/types';

export interface RegisterOTPState {
  name: string;
  email: string;
  password: string;
  otpCode: string;
}

interface InitiateRegisterOTPResult {
  success: boolean;
  error?: string;
  expiresIn?: number;
}

interface VerifyRegisterOTPResult {
  success: boolean;
  error?: string;
  user?: User;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

interface ResendRegisterOTPResult {
  success: boolean;
  error?: string;
}

export interface UseRegisterOTPResult {
  state: RegisterOTPState;
  updateState: (updates: Partial<RegisterOTPState>) => void;
  initiateRegisterOTP: (data: RegisterRequest) => Promise<InitiateRegisterOTPResult>;
  verifyRegisterOTP: (email: string, code: string) => Promise<VerifyRegisterOTPResult>;
  resendRegisterOTP: (email: string) => Promise<ResendRegisterOTPResult>;
  loading: boolean;
  resetState: () => void;
}

export function useRegisterOTP(): UseRegisterOTPResult {
  const [state, setState] = useState<RegisterOTPState>({
    name: '',
    email: '',
    password: '',
    otpCode: '',
  });

  const [loading, setLoading] = useState(false);

  const updateState = (updates: Partial<RegisterOTPState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState({
      name: '',
      email: '',
      password: '',
      otpCode: '',
    });
  };

  const initiateRegisterOTP = async (data: RegisterRequest): Promise<InitiateRegisterOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.registerWithOTP(data);

      if (response.success) {
        updateState({ name: data.name, email: data.email, password: data.password });
        const expiresIn = (response.data as unknown as Record<string, unknown>).expires_in as number | undefined;
        return {
          success: true,
          expiresIn: expiresIn || 600,
        };
      }

      return {
        success: false,
        error: response.message || 'Gagal mengirim OTP',
      };
    } catch (error) {
      const errorData = handleAPIError(error);
      return {
        success: false,
        error: errorData.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyRegisterOTP = async (email: string, code: string): Promise<VerifyRegisterOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.verifyRegisterOTP({ email, code, type: 'register' });

      if (response.success) {
        updateState({ email, otpCode: code });
        return {
          success: true,
          user: response.data.user,
          accessToken: response.data.access_token,
          tokenType: response.data.token_type,
          expiresIn: response.data.expires_in,
        };
      }

      return {
        success: false,
        error: response.message || 'OTP verifikasi gagal',
      };
    } catch (error) {
      const errorData = handleAPIError(error);

      if (errorData.isUnauthorized) {
        return {
          success: false,
          error: 'Kode OTP tidak valid',
        };
      }

      return {
        success: false,
        error: errorData.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const resendRegisterOTP = async (email: string): Promise<ResendRegisterOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.resendRegisterOTP({
        email,
        type: 'register',
      });

      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        error: response.message || 'Gagal mengirim ulang OTP',
      };
    } catch (error) {
      const errorData = handleAPIError(error);
      return {
        success: false,
        error: errorData.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    state,
    updateState,
    initiateRegisterOTP,
    verifyRegisterOTP,
    resendRegisterOTP,
    loading,
    resetState,
  };
}
