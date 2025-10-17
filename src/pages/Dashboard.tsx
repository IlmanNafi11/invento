import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { usePermissions } from '@/hooks/usePermissions';
import { statisticAPI } from '@/lib/statisticAPI';
import { StatisticCard } from '@/components/common/StatisticCard';
import type { Statistics } from '@/types';

export default function Dashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const { hasPermission } = usePermissions();
  const [statistics, setStatistics] = useState<Statistics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setError(null);
        const response = await statisticAPI.getStatistics();
        setStatistics(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
        setStatistics({});
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const shouldShowProjectCard = hasPermission('Project', 'read');
  const shouldShowModulCard = hasPermission('modul', 'read');
  const shouldShowUserCard = hasPermission('user', 'read');
  const shouldShowRoleCard = hasPermission('Role', 'read');

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl">👋 Welcome back {user?.name || 'User'}</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shouldShowProjectCard && (
          <StatisticCard
            title="Total Projects"
            value={statistics.total_project}
            loading={loading}
          />
        )}

        {shouldShowModulCard && (
          <StatisticCard
            title="Total Modules"
            value={statistics.total_modul}
            loading={loading}
          />
        )}

        {shouldShowUserCard && (
          <StatisticCard
            title="Total Users"
            value={statistics.total_user}
            loading={loading}
          />
        )}

        {shouldShowRoleCard && (
          <StatisticCard
            title="Total Roles"
            value={statistics.total_role}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}