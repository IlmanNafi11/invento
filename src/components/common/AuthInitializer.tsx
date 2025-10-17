import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setInitializingAuth } from '@/lib/authSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setInitializingAuth(false));
  }, [dispatch]);

  return null;
}