import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

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
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if ((requiredPermission || requiredPermissions) && loading) {
    console.log('[ProtectedRoute] Permissions loading for protected route...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    console.log(`[ProtectedRoute] Checking required permission: ${resource}.${action}`);
    if (!hasPermission(resource, action)) {
      console.log(`[ProtectedRoute] Permission denied: ${resource}.${action}`);
      return <Navigate to="/forbidden" replace />;
    }
  }

  if (requiredPermissions) {
    console.log('[ProtectedRoute] Checking multiple required permissions:', requiredPermissions);
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    );
    if (!hasAllPermissions) {
      console.log('[ProtectedRoute] Some permissions denied');
      return <Navigate to="/forbidden" replace />;
    }
  }

  console.log('[ProtectedRoute] Access granted');
  return <>{children}</>;
}