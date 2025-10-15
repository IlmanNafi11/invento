import { Eye, Edit, Trash2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
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
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { UserTableHeader } from './UserTableHeader';
import type { UserItem, RoleListItem } from '@/types';
import type { UseFormReturn } from 'react-hook-form';

interface FilterForm {
  role: string;
}

interface UserTableProps {
  users: UserItem[];
  totalUsers: number;
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
}

export function UserTable({
  users,
  totalUsers,
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
}: UserTableProps) {
  const userColumns: ColumnDef<UserItem>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role.name',
      header: 'Role',
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat Pada',
      cell: ({ getValue }) => formatDate(new Date(getValue<string>())),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const userTable = useReactTable({
    data: users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={userColumns.length}>
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
          {userTable.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {userTable.getRowModel().rows?.length ? (
            userTable.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={userColumns.length} className="p-0 border-0">
                <EmptyState
                  title="Belum ada user"
                  description="Belum ada user yang terdaftar"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={userColumns.length} className="text-center">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {userTable.getFilteredRowModel().rows.length} dari {totalUsers} data
                </div>
                <div className="space-x-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => userTable.previousPage()}
                          className={userTable.getCanPreviousPage() ? '' : 'pointer-events-none opacity-50'}
                        />
                      </PaginationItem>
                      {Array.from({ length: userTable.getPageCount() }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => userTable.setPageIndex(page - 1)}
                            isActive={userTable.getState().pagination.pageIndex === page - 1}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => userTable.nextPage()}
                          className={userTable.getCanNextPage() ? '' : 'pointer-events-none opacity-50'}
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
