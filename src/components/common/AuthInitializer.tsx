import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/lib/authSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        if (isAuthenticated) {
          dispatch(logout());
          navigate('/login');
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
  }, [dispatch, isAuthenticated, navigate]);

  return null;
}