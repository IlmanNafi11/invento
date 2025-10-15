import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserFilterForm } from './UserFilterForm';
import type { RoleListItem } from '@/types';
import type { UseFormReturn } from 'react-hook-form';

interface FilterForm {
  role: string;
}

interface UserTableHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterForm: UseFormReturn<FilterForm>;
  roles: RoleListItem[];
  onApplyFilter: () => void;
  onResetFilter: () => void;
}

export function UserTableHeader({
  search,
  onSearchChange,
  filterForm,
  roles,
  onApplyFilter,
  onResetFilter,
}: UserTableHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <h3 className="text-base font-medium">User</h3>
        <p className="text-xs text-muted-foreground">Kelola data pengguna</p>
      </div>
      <div className="lg:flex hidden flex-row items-center gap-4">
        <div className="relative min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari user..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-4">
            <UserFilterForm
              form={filterForm}
              roles={roles}
              onApply={onApplyFilter}
              onReset={onResetFilter}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
