import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/lib/authSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        if (isAuthenticated) {
          dispatch(logout());
        }
        return;
      }

      if (!isAuthenticated) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return;
      }
    };

    checkTokenValidity();
  }, [dispatch, isAuthenticated]);

  return null;
}