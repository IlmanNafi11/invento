import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModulTableHeader } from './ModulTableHeader';
import { ModulTableRow } from './ModulTableRow';
import { ModulTableFooter } from './ModulTableFooter';
import { EmptyState } from '@/components/common/EmptyState';
import type { ModulListItem } from '@/types';

interface ModulTableProps {
  moduls: ModulListItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  onEditClick: (modul: ModulListItem) => void;
  onDeleteClick: (modul: ModulListItem) => void;
  onDownloadClick: (modul: ModulListItem) => void;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  pendingFileType: string;
  pendingSemester: string;
  onFileTypeChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onFilterApply: () => void;
  onFilterReset: () => void;
  fileTypeOptions: { value: string; label: string }[];
  semesterOptions: { value: string; label: string }[];
}

export function ModulTable({
  moduls,
  search,
  onSearchChange,
  onUploadClick,
  onEditClick,
  onDeleteClick,
  onDownloadClick,
  canUpload,
  canEdit,
  canDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  filterOpen,
  onFilterOpenChange,
  pendingFileType,
  pendingSemester,
  onFileTypeChange,
  onSemesterChange,
  onFilterApply,
  onFilterReset,
  fileTypeOptions,
  semesterOptions,
}: ModulTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={6}>
              <ModulTableHeader
                search={search}
                onSearchChange={onSearchChange}
                onUploadClick={onUploadClick}
                canUpload={canUpload}
                filterOpen={filterOpen}
                onFilterOpenChange={onFilterOpenChange}
                pendingFileType={pendingFileType}
                pendingSemester={pendingSemester}
                onFileTypeChange={onFileTypeChange}
                onSemesterChange={onSemesterChange}
                onFilterApply={onFilterApply}
                onFilterReset={onFilterReset}
                fileTypeOptions={fileTypeOptions}
                semesterOptions={semesterOptions}
              />
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead>Nama File</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Ukuran</TableHead>
            <TableHead>Terakhir Diperbarui</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moduls.length > 0 ? (
            moduls.map((modul) => (
              <ModulTableRow
                key={modul.id}
                modul={modul}
                onDownload={onDownloadClick}
                onEdit={onEditClick}
                onDelete={onDeleteClick}
                canEdit={canEdit}
                canDelete={canDelete}
                fileTypeOptions={fileTypeOptions}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="p-0 border-0">
                <EmptyState
                  title="Belum ada modul"
                  description="Belum ada modul yang diupload"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              <ModulTableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                displayedItems={moduls.length}
                onPageChange={onPageChange}
                canPreviousPage={currentPage > 1}
                canNextPage={currentPage < totalPages}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
