import { createContext } from 'react';
import type { ApiPermission } from '@/types';

export interface PermissionsContextType {
  permissions: ApiPermission[];
  loading: boolean;
  error: string | null;
  hasPermission: (resource: string, action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);