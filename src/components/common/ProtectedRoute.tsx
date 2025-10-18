import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingOverlay } from './LoadingOverlay';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requiredPermissions?: Array<{
    resource: string;
    action: string;
  }>;
}

export default function ProtectedRoute({ children, requiredPermission, requiredPermissions }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const initializingAuth = useAppSelector((state) => state.auth.initializingAuth);
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();

  if (initializingAuth) {
    return (
      <LoadingOverlay
        show={true}
        message="Restoring session..."
        subMessage="Memulihkan akses dan preferensi Anda"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if ((requiredPermission || requiredPermissions) && loading) {
    return (
      <LoadingOverlay
        show={true}
        message="Loading permissions..."
        subMessage="Menyesuaikan fitur sesuai peran Anda"
      />
    );
  }

  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    if (!hasPermission(resource, action)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    );
    if (!hasAllPermissions) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
}
