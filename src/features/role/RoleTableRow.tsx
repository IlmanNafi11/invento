import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/format';
import type { RoleListItem } from '@/types';

interface RoleTableRowProps {
  role: RoleListItem;
  onEdit: (role: RoleListItem) => void;
  onDelete: (role: RoleListItem) => void;
  canEdit: boolean;
  canDelete: boolean;
  loading: boolean;
}

export function RoleTableRow({
  role,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  loading,
}: RoleTableRowProps) {
  return (
    <TableRow>
      <TableCell>{role.nama_role}</TableCell>
      <TableCell className="text-center">{role.jumlah_permission}</TableCell>
      <TableCell>{formatDate(new Date(role.tanggal_diperbarui))}</TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(role)}
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(role)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
