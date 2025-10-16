import { useState } from 'react';
import { authAPI } from '@/lib/auth';
import { handleAPIError } from '@/lib/apiErrorHandler';
import type { User } from '@/types';

export interface ForgotPasswordState {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

interface InitiateOTPResult {
  success: boolean;
  error?: string;
  expiresIn?: number;
}

interface VerifyOTPResult {
  success: boolean;
  error?: string;
}

interface ConfirmResetPasswordResult {
  success: boolean;
  error?: string;
  user?: User;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

interface ResendOTPResult {
  success: boolean;
  error?: string;
}

export interface UseForgotPasswordResult {
  state: ForgotPasswordState;
  updateState: (updates: Partial<ForgotPasswordState>) => void;
  initiateOTP: (email: string) => Promise<InitiateOTPResult>;
  verifyOTP: (email: string, code: string) => Promise<VerifyOTPResult>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<ConfirmResetPasswordResult>;
  resendOTP: (email: string) => Promise<ResendOTPResult>;
  loading: boolean;
  resetState: () => void;
}

export function useForgotPassword(): UseForgotPasswordResult {
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const updateState = (updates: Partial<ForgotPasswordState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState({
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const initiateOTP = async (email: string): Promise<InitiateOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.initiateResetPasswordOTP({ email });
      
      if (response.success) {
        updateState({ email });
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

  const verifyOTP = async (email: string, code: string): Promise<VerifyOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.verifyResetPasswordOTP({ email, code, type: 'reset_password' });
      
      if (response.success) {
        updateState({ email, otpCode: code });
        return { success: true };
      }
      
      return {
        success: false,
        error: response.message || 'OTP verifikasi gagal',
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

  const confirmResetPassword = async (email: string, code: string, newPassword: string): Promise<ConfirmResetPasswordResult> => {
    try {
      setLoading(true);
      const response = await authAPI.confirmResetPasswordOTP({
        email,
        code,
        new_password: newPassword,
      });
      
      if (response.success) {
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
        error: response.message || 'Gagal mereset password',
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

  const resendOTP = async (email: string): Promise<ResendOTPResult> => {
    try {
      setLoading(true);
      const response = await authAPI.resendResetPasswordOTP({
        email,
        type: 'reset_password',
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
    initiateOTP,
    verifyOTP,
    confirmResetPassword,
    resendOTP,
    loading,
    resetState,
  };
}

