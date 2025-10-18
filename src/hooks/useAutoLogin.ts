import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './useAppDispatch';
import { setAccessToken } from '@/lib/authSlice';
import { fetchProfile } from '@/lib/profileSlice';
import { fetchPermissions } from '@/lib/permissionSlice';

interface AutoLoginOptions {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useAutoLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleAutoLogin = useCallback(async (
    accessToken: string,
    options: AutoLoginOptions = {}
  ) => {
    const { redirectTo = '/dashboard', onSuccess, onError } = options;

    try {
      dispatch(setAccessToken(accessToken));

      await Promise.all([
        dispatch(fetchProfile()).unwrap(),
        dispatch(fetchPermissions()).unwrap()
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      onSuccess?.();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menginisialisasi data pengguna';
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }
  }, [dispatch, navigate]);

  return { handleAutoLogin };
}
