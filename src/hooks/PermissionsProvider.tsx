import { useEffect, useCallback, type ReactNode } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import { fetchPermissions, clearPermissions } from '@/lib/permissionSlice';
import { PermissionsContext } from './PermissionsContext';

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { permissions, loading, error } = useAppSelector(
    (state) => state.permission
  );
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const initializingAuth = useAppSelector((state) => state.auth.initializingAuth);

  const fetchAndSetPermissions = useCallback(async () => {
    if (!isAuthenticated || permissions.length > 0) {
      return;
    }

    await dispatch(fetchPermissions()).unwrap();
  }, [isAuthenticated, permissions.length, dispatch]);

  const clearPermissionsData = useCallback(() => {
    dispatch(clearPermissions());
  }, [dispatch]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    const resourceLower = resource.toLowerCase();
    const actionLower = action.toLowerCase();

    const result = permissions.some(perm =>
      perm.resource.toLowerCase() === resourceLower &&
      perm.actions.some(a => a.toLowerCase() === actionLower)
    );

    return result;
  }, [permissions]);

  const refreshPermissions = async () => {
    dispatch(clearPermissions());
    await dispatch(fetchPermissions()).unwrap();
  };

  useEffect(() => {
    if (initializingAuth) {
      return;
    }

    if (isAuthenticated) {
      if (permissions.length === 0) {
        fetchAndSetPermissions();
      }
    } else {
      clearPermissionsData();
    }
  }, [
    isAuthenticated,
    initializingAuth,
    permissions.length,
    fetchAndSetPermissions,
    clearPermissionsData,
  ]);

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}