import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './useAppDispatch';
import { setAccessToken, logout } from '@/lib/authSlice';
import { authAPI } from '@/lib/auth';

const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

export function useTokenRefresh() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAccessToken = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    try {
      const response = await authAPI.refreshToken();
      dispatch(setAccessToken(response.data.access_token));
    } catch (error) {
      console.error('Failed to refresh token:', error);
      dispatch(logout());
    }
  }, [isAuthenticated, accessToken, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated, accessToken, refreshAccessToken]);

  return { refreshAccessToken };
}
