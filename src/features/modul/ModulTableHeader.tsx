import { Search, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModulFilterPopover } from './ModulFilterPopover';

interface ModulTableHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  canUpload: boolean;
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

export function ModulTableHeader({
  search,
  onSearchChange,
  onUploadClick,
  canUpload,
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
}: ModulTableHeaderProps) {
  return (
    <>
      <div className="flex flex-row items-center gap-2 ml-auto md:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari modul..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <ModulFilterPopover
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          pendingFileType={pendingFileType}
          pendingSemester={pendingSemester}
          onFileTypeChange={onFileTypeChange}
          onSemesterChange={onSemesterChange}
          onApply={onFilterApply}
          onReset={onFilterReset}
          fileTypeOptions={fileTypeOptions}
          semesterOptions={semesterOptions}
        />
        {canUpload && (
          <Button onClick={onUploadClick} size="sm">
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between py-3">
        <div>
          <h3 className="text-base font-medium">Modul</h3>
          <p className="text-xs text-muted-foreground">Kelola file modul pembelajaran</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari modul..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <ModulFilterPopover
            open={filterOpen}
            onOpenChange={onFilterOpenChange}
            pendingFileType={pendingFileType}
            pendingSemester={pendingSemester}
            onFileTypeChange={onFileTypeChange}
            onSemesterChange={onSemesterChange}
            onApply={onFilterApply}
            onReset={onFilterReset}
            fileTypeOptions={fileTypeOptions}
            semesterOptions={semesterOptions}
          />
          {canUpload && (
            <Button onClick={onUploadClick} size="sm">
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
