import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { fetchProfile, clearProfile, clearError } from '@/lib/profileSlice';

export function useProfile() {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.profile);
  const currentUser = useAppSelector((state) => state.auth.user);
  const lastUserIdRef = useRef<number | null>(null);

  const loadProfile = useCallback(() => {
    if (currentUser) {
      dispatch(fetchProfile());
    }
  }, [dispatch, currentUser]);

  const refreshProfile = useCallback(() => {
    if (currentUser) {
      dispatch(fetchProfile());
    }
  }, [dispatch, currentUser]);

  const resetProfile = useCallback(() => {
    dispatch(clearProfile());
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (!currentUser) {
      if (lastUserIdRef.current !== null) {
        dispatch(clearProfile());
        lastUserIdRef.current = null;
      }
      return;
    }

    if (currentUser.id !== lastUserIdRef.current) {
      dispatch(clearProfile());
      lastUserIdRef.current = currentUser.id;
      dispatch(fetchProfile());
    } else if (!profile && !loading) {
      dispatch(fetchProfile());
    }
  }, [currentUser, profile, loading, dispatch]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    refreshProfile,
    resetProfile,
    resetError,
  };
}
