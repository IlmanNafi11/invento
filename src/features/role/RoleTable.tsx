import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleTableHeader } from './RoleTableHeader';
import { RoleTableRow } from './RoleTableRow';
import { RoleTableFooter } from './RoleTableFooter';
import { EmptyState } from '@/components/common/EmptyState';
import type { RoleListItem } from '@/types';

interface RoleTableProps {
  roles: RoleListItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  onEditClick: (role: RoleListItem) => void;
  onDeleteClick: (role: RoleListItem) => void;
  loading: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

export function RoleTable({
  roles,
  search,
  onSearchChange,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  loading,
  canCreate,
  canEdit,
  canDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onPreviousPage,
  onNextPage,
  canPreviousPage,
  canNextPage,
}: RoleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={4}>
              <RoleTableHeader
                search={search}
                onSearchChange={onSearchChange}
                onCreateClick={onCreateClick}
                loading={loading}
                canCreate={canCreate}
              />
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead>Role</TableHead>
            <TableHead className="text-center">Permission</TableHead>
            <TableHead>Tanggal Diperbarui</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length > 0 ? (
            roles.map((role) => (
              <RoleTableRow
                key={role.id}
                role={role}
                onEdit={onEditClick}
                onDelete={onDeleteClick}
                canEdit={canEdit}
                canDelete={canDelete}
                loading={loading}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="p-0 border-0">
                <EmptyState
                  title="Belum ada role"
                  description="Belum ada role yang dibuat"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              <RoleTableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                displayedItems={roles.length}
                onPageChange={onPageChange}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
