import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { UserTableHeader } from './UserTableHeader';
import type { UserItem, Pagination as PaginationType, RoleListItem } from '@/types';
import type { UseFormReturn } from 'react-hook-form';

interface FilterForm {
  role: string;
}

interface UserTableProps {
  users: UserItem[];
  pagination: PaginationType | null;
  search: string;
  onSearchChange: (value: string) => void;
  filterForm: UseFormReturn<FilterForm>;
  roles: RoleListItem[];
  onApplyFilter: () => void;
  onResetFilter: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onView: (user: UserItem) => void;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const SKELETON_ROWS = 10;
const COLUMNS = 4;

export function UserTable({
  users,
  pagination,
  search,
  onSearchChange,
  filterForm,
  roles,
  onApplyFilter,
  onResetFilter,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
  loading,
  onPageChange,
}: UserTableProps) {
  const renderSkeletonRows = () => {
    return Array.from({ length: SKELETON_ROWS }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell className="text-center">
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderUsers = () => {
    if (loading) {
      return renderSkeletonRows();
    }

    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={COLUMNS} className="p-0 border-0">
            <EmptyState
              title="Belum ada user"
              description="Belum ada user yang terdaftar"
            />
          </TableCell>
        </TableRow>
      );
    }

    return users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role.name}</TableCell>
        <TableCell>{formatDate(new Date(user.createdAt))}</TableCell>
        <TableCell className="text-center">
          <div className="flex gap-2 justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(user)}
              disabled={loading}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(user)}
                disabled={loading}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(user)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.total_pages || 1;
  const totalItems = pagination?.total_items || 0;

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={COLUMNS}>
              <UserTableHeader
                search={search}
                onSearchChange={onSearchChange}
                filterForm={filterForm}
                roles={roles}
                onApplyFilter={onApplyFilter}
                onResetFilter={onResetFilter}
              />
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Dibuat Pada</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderUsers()}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={COLUMNS} className="text-center">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {users.length} dari {totalItems} data
                </div>
                <div className="space-x-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onPageChange(currentPage - 1)}
                          className={canPreviousPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => onPageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => onPageChange(currentPage + 1)}
                          className={canNextPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
