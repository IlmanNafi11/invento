import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { initializeAuth } from '@/lib/authSlice';
import { fetchProfile } from '@/lib/profileSlice';
import { fetchPermissions } from '@/lib/permissionSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    if (isAuthenticated) {
      initializedRef.current = true;
      return;
    }

    const initialize = async () => {
      initializedRef.current = true;
      const result = await dispatch(initializeAuth());
      
      if (initializeAuth.fulfilled.match(result) && result.payload) {
        await Promise.all([
          dispatch(fetchProfile()),
          dispatch(fetchPermissions())
        ]);
      }
    };
    
    initialize();
  }, [dispatch, isAuthenticated]);

  return null;
}