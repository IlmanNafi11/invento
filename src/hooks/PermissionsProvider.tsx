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
      setLoading(true);
      setError(null);
      console.log('[PermissionsProvider] Fetching permissions...');
      const response = await userAPI.getUserPermissions();
      console.log('[PermissionsProvider] Raw response:', response);

      const permissionsData = response.data;
      console.log('[PermissionsProvider] Permissions data:', permissionsData);

      setPermissions(permissionsData);
    } catch (err: unknown) {
      console.error('[PermissionsProvider] Failed to fetch permissions:', err);
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

    console.log(`[PermissionsProvider] hasPermission(${resource}, ${action}):`, result);
    return result;
  }, [permissions]);

  const refreshPermissions = async () => {
    setPermissions([]);
    await fetchPermissions();
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (permissions.length === 0) {
        fetchPermissions();
      } else {
        setLoading(false);
      }
    } else {
      clearPermissions();
    }
  }, [isAuthenticated, permissions.length, fetchPermissions, clearPermissions]);

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