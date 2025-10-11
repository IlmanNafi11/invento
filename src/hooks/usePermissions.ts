import { useContext } from 'react';
import { PermissionsContext, type PermissionsContextType } from './PermissionsContext';

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}