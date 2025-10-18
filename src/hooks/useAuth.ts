import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { login, register, logout, clearError } from '@/lib/authSlice';
import { fetchProfile } from '@/lib/profileSlice';
import { fetchPermissions } from '@/lib/permissionSlice';
import type { AuthRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const handleLogin = useCallback(
    async (credentials: AuthRequest) => {
      try {
        await dispatch(login(credentials)).unwrap();
        await Promise.all([
          dispatch(fetchProfile()),
          dispatch(fetchPermissions())
        ]);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const handleRegister = useCallback(
    async (userData: RegisterRequest) => {
      try {
        await dispatch(register(userData)).unwrap();
        await Promise.all([
          dispatch(fetchProfile()),
          dispatch(fetchPermissions())
        ]);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: clearAuthError,
  };
}
