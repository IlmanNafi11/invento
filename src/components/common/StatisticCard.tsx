import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticCardProps {
  title: string;
  value: number | undefined;
  loading: boolean;
}

export function StatisticCard({ title, value, loading }: StatisticCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? '...' : value ?? 0}
        </div>
      </CardContent>
    </Card>
  );
}
