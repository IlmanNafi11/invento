import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { initializeAuth } from '@/lib/authSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Debug info
  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      console.warn('Authenticated but no access token found');
    }
  }, [isAuthenticated, accessToken]);

  return null;
}