import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ApiPermission } from '@/types';
import { userAPI } from '@/lib/userAPI';
import { useAppSelector } from './useAppSelector';
import { PermissionsContext } from './PermissionsContext';

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const initializingAuth = useAppSelector((state) => state.auth.initializingAuth);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    if (permissions.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      setError(null);
      const response = await userAPI.getUserPermissions();

      const permissionsData = response.data;

      setPermissions(permissionsData);
    } catch {
      setError('Failed to load permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, permissions.length]);

  const clearPermissions = useCallback(() => {
    setPermissions([]);
    setError(null);
    setLoading(false);
  }, []);

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
    setPermissions([]);
    await fetchPermissions();
  };

  useEffect(() => {
    if (initializingAuth) {
      return;
    }

    if (isAuthenticated && accessToken) {
      if (permissions.length === 0) {
        fetchPermissions();
      } else {
        setLoading(false);
      }
    } else {
      clearPermissions();
    }
  }, [isAuthenticated, initializingAuth, accessToken, permissions.length, fetchPermissions, clearPermissions]);

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