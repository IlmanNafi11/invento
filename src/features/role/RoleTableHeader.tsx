import { Search, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RoleTableHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  loading: boolean;
  canCreate: boolean;
}

export function RoleTableHeader({
  search,
  onSearchChange,
  onCreateClick,
  loading,
  canCreate,
}: RoleTableHeaderProps) {
  return (
    <>
      <div className="flex flex-row items-center gap-4 ml-auto md:hidden">
        <div className="relative min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari role..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {canCreate && (
          <Button onClick={onCreateClick} size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between py-3">
        <div>
          <h3 className="text-base font-medium">Role & Permission</h3>
          <p className="text-xs text-muted-foreground">Buat dan kelola permission setiap role</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari role..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {canCreate && (
            <Button onClick={onCreateClick} size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
