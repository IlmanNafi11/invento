import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { initializeAuth } from '@/lib/authSlice';
import { fetchProfile } from '@/lib/profileSlice';
import { fetchPermissions } from '@/lib/permissionSlice';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile.profile);
  const permissions = useAppSelector((state) => state.permission.permissions);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const initialize = async () => {
      initializedRef.current = true;
      const result = await dispatch(initializeAuth());
      
      if (initializeAuth.fulfilled.match(result) && result.payload) {
        const fetchPromises = [];
        
        if (!profile) {
          fetchPromises.push(dispatch(fetchProfile()));
        }
        
        if (permissions.length === 0) {
          fetchPromises.push(dispatch(fetchPermissions()));
        }
        
        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
      }
    };
    
    initialize();
  }, [dispatch, profile, permissions]);

  return null;
}