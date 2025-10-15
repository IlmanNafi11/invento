import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { projectAPI } from '@/lib/projectAPI';
import { modulAPI } from '@/lib/modulAPI';
import { userAPI } from '@/lib/userAPI';
import { roleAPI } from '@/lib/role';

interface DashboardStats {
  totalProjects: number;
  totalModules: number;
  totalUsers: number;
  totalRoles: number;
}

export default function Dashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalModules: 0,
    totalUsers: 0,
    totalRoles: 0,
  });
  const [loading, setLoading] = useState(true);

  const hasModulRead = hasPermission('modul', 'read');
  const hasProjectRead = hasPermission('Project', 'read');
  const hasUserRead = hasPermission('user', 'read');
  const hasRoleRead = hasPermission('Role', 'read');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [];

        if (hasProjectRead) {
          promises.push(projectAPI.getProjects({ limit: 1 }));
        } else {
          promises.push(Promise.resolve({ data: { pagination: { total_items: 0 } } }));
        }

        if (hasModulRead) {
          promises.push(modulAPI.getModuls({ limit: 1 }));
        } else {
          promises.push(Promise.resolve({ data: { pagination: { total_items: 0 } } }));
        }

        if (hasUserRead) {
          promises.push(userAPI.getUsers({ limit: 1 }));
        } else {
          promises.push(Promise.resolve({ data: { pagination: { total_items: 0 } } }));
        }

        if (hasRoleRead) {
          promises.push(roleAPI.getRoles({ limit: 1 }));
        } else {
          promises.push(Promise.resolve({ data: { pagination: { total_items: 0 } } }));
        }

        const [projectsRes, modulesRes, usersRes, rolesRes] = await Promise.all(promises);

        setStats({
          totalProjects: projectsRes.data.pagination.total_items,
          totalModules: modulesRes.data.pagination.total_items,
          totalUsers: usersRes.data.pagination.total_items,
          totalRoles: rolesRes.data.pagination.total_items,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hasProjectRead, hasModulRead, hasUserRead, hasRoleRead]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl">👋 Welcome back {user?.name || 'User'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasProjectRead && (
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalProjects}
              </div>
            </CardContent>
          </Card>
        )}

        {hasModulRead && (
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalModules}
              </div>
            </CardContent>
          </Card>
        )}

        {hasUserRead && (
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalUsers}
              </div>
            </CardContent>
          </Card>
        )}

        {hasRoleRead && (
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalRoles}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}