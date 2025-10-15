import { Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/format';
import type { ModulListItem } from '@/types';

interface ModulTableRowProps {
  modul: ModulListItem;
  onDownload: (modul: ModulListItem) => void;
  onEdit: (modul: ModulListItem) => void;
  onDelete: (modul: ModulListItem) => void;
  canEdit: boolean;
  canDelete: boolean;
  fileTypeOptions: { value: string; label: string }[];
}

export function ModulTableRow({
  modul,
  onDownload,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  fileTypeOptions,
}: ModulTableRowProps) {
  const getFileTypeLabel = (tipe: string) => {
    return fileTypeOptions.find(option => option.value === tipe)?.label || tipe.toUpperCase();
  };

  return (
    <TableRow>
      <TableCell>{modul.nama_file}</TableCell>
      <TableCell>{getFileTypeLabel(modul.tipe)}</TableCell>
      <TableCell>Semester {modul.semester}</TableCell>
      <TableCell>{modul.ukuran}</TableCell>
      <TableCell>{formatDate(new Date(modul.terakhir_diperbarui))}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(modul)}
          >
            <Download className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(modul)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(modul)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
