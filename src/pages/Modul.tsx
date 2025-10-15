import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Search, Upload, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { useModul } from '@/hooks/useModul';
import { modulAPI } from '@/lib/modulAPI';
import { ModulUploadDialog } from '@/features/modul/ModulUploadDialog';
import { ModulEditDialog } from '@/features/modul/ModulEditDialog';
import { ModulFilterDialog } from '@/features/modul/ModulFilterDialog';
import type { ModulListItem, ErrorResponse, ValidationErrorResponse } from '@/types';
import type { FileUploadState } from '@/features/modul/ModulUploadProgress';

const fileTypeOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pptx', label: 'PPTX' },
];

const semesterOptions = [
  { value: 'all', label: 'Semua' },
  ...Array.from({ length: 8 }, (_, i) => ({ value: `${i + 1}`, label: `Semester ${i + 1}` })),
];

export default function Modul() {
  const { hasPermission } = usePermissions();
  const { moduls, pagination, loadModuls, deleteExistingModul } = useModul();

  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [semester, setSemester] = useState('all');
  const [pendingFileType, setPendingFileType] = useState('all');
  const [pendingSemester, setPendingSemester] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ModulListItem | null>(null);
  const [editingItem, setEditingItem] = useState<ModulListItem | null>(null);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const handleOpenUpload = () => setIsCreateOpen(true);
    window.addEventListener('open-modul-upload', handleOpenUpload);
    return () => window.removeEventListener('open-modul-upload', handleOpenUpload);
  }, []);

  useEffect(() => {
    const params: {
      search?: string;
      filter_type?: string;
      filter_semester?: number;
      page?: number;
      limit?: number;
    } = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (fileType && fileType !== 'all') params.filter_type = fileType;
    if (semester && semester !== 'all') params.filter_semester = parseInt(semester);

    loadModuls(params);
  }, [debouncedSearch, fileType, semester, pagination?.page, pagination?.limit, loadModuls]);

  const handleApplyFilter = () => {
    setFileType(pendingFileType);
    setSemester(pendingSemester);
    setFilterOpen(false);
    setMobileFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingFileType('all');
    setPendingSemester('all');
    setFileType('all');
    setSemester('all');
  };

  const handleUpload = async (data: { files: { file?: File; name: string; semester?: number }[] }) => {
    const files = data.files.filter(f => f.file && f.name && f.semester);
    if (files.length === 0) {
      toast.error('Harap lengkapi nama file dan semester');
      return;
    }

    if (files.length > 5) {
      toast.error('Maksimal 5 file per upload');
      return;
    }

    for (const fileData of files) {
      if (fileData.file) {
        const validation = modulAPI.validateModulFile(fileData.file);
        if (!validation.valid) {
          toast.error(`${fileData.file.name}: ${validation.error}`);
          return;
        }
      }
    }

    setIsUploading(true);
    const initialStates: FileUploadState[] = files.map((f, i) => ({
      index: i,
      fileName: f.file!.name,
      progress: 0,
      status: 'waiting',
    }));
    setUploadStates(initialStates);

    try {
      await modulAPI.uploadMultipleModuls(
        files.map(f => f.file!),
        files.map(f => f.name),
        files.map(f => f.semester!),
        (fileIndex, progress) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex ? { ...state, progress, status: 'uploading' } : state
          ));
        },
        (fileIndex) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex ? { ...state, progress: 100, status: 'completed' } : state
          ));
        },
        (fileIndex, error) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex ? { ...state, status: 'error', error: error.message } : state
          ));
          toast.error(`${files[fileIndex].file!.name}: ${error.message}`);
        }
      );

      setTimeout(() => {
        setUploadStates([]);
        setIsCreateOpen(false);
        setIsUploading(false);
        toast.success('Upload selesai');
        loadModuls();
      }, 1000);
    } catch {
      setIsUploading(false);
    }
  };

  const handleEdit = async (data: { files: { file?: File; name: string; semester?: number; existingFileSize?: string }[] }) => {
    if (!editingItem) return;

    const fileData = data.files[0];
    if (!fileData) return;

    setIsEditLoading(true);

    try {
      const isNewFileUploaded = fileData.file && fileData.file.size > 0;
      const metadataChanged = fileData.name !== editingItem.nama_file || fileData.semester !== editingItem.semester;

      if (!isNewFileUploaded && metadataChanged) {
        await modulAPI.updateModulMetadata(editingItem.id, {
          nama_file: fileData.name,
          semester: fileData.semester!,
        });
        toast.success('Metadata modul berhasil diperbarui');
        setIsEditOpen(false);
        setEditingItem(null);
        loadModuls();
      } else if (isNewFileUploaded) {
        const fileType = modulAPI.getFileType(fileData.file!);
        if (!['docx', 'xlsx', 'pdf', 'pptx'].includes(fileType)) {
          toast.error(`Tipe file ${fileType} tidak didukung`);
          return;
        }

        setUploadStates([{ index: 0, fileName: fileData.file!.name, progress: 0, status: 'waiting' }]);

        await modulAPI.pollAndUpdateModulWithChunks(
          editingItem.id,
          fileData.file!,
          {
            nama_file: fileData.name,
            tipe: fileType as 'docx' | 'xlsx' | 'pdf' | 'pptx',
            semester: fileData.semester!,
          },
          {
            onProgress: (progress) => {
              setUploadStates([{ index: 0, fileName: fileData.file!.name, progress: progress.percentage, status: 'uploading' }]);
            },
            onSuccess: () => {
              setUploadStates([{ index: 0, fileName: fileData.file!.name, progress: 100, status: 'completed' }]);
              setTimeout(() => {
                setUploadStates([]);
                setIsEditOpen(false);
                setEditingItem(null);
                toast.success('Modul berhasil diperbarui');
                loadModuls();
              }, 1000);
            },
            onError: (error) => {
              setUploadStates([{ index: 0, fileName: fileData.file!.name, progress: 0, status: 'error', error: error.message }]);
              toast.error(error.message);
            },
          }
        );
      }
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal memperbarui modul');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    const result = await deleteExistingModul(deletingItem.id);
    if (result.success) {
      setIsDeleteOpen(false);
      setDeletingItem(null);
      toast.success('Modul berhasil dihapus');
    } else {
      toast.error(result.error || 'Gagal menghapus modul');
    }
  };

  const handleDownload = async (item: ModulListItem) => {
    try {
      const result = await modulAPI.downloadModuls([item.id]);
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || item.nama_file;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Modul berhasil didownload');
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal mendownload modul');
    }
  };

  const columns: ColumnDef<ModulListItem>[] = [
    {
      accessorKey: 'nama_file',
      header: 'Nama File',
    },
    {
      accessorKey: 'tipe',
      header: 'Tipe',
      cell: ({ getValue }) => {
        const tipe = getValue<string>();
        return fileTypeOptions.find(option => option.value === tipe)?.label || tipe.toUpperCase();
      },
    },
    {
      accessorKey: 'semester',
      header: 'Semester',
      cell: ({ getValue }) => `Semester ${getValue<number>()}`,
    },
    {
      accessorKey: 'ukuran',
      header: 'Ukuran',
    },
    {
      accessorKey: 'terakhir_diperbarui',
      header: 'Terakhir Diperbarui',
      cell: ({ getValue }) => formatDate(new Date(getValue<string>())),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleDownload(row.original)}>
            <Download className="h-4 w-4" />
          </Button>
          {hasPermission('Modul', 'update') && (
            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row.original); setIsEditOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('Modul', 'delete') && (
            <Button variant="ghost" size="sm" onClick={() => { setDeletingItem(row.original); setIsDeleteOpen(true); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: moduls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages || 0,
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-4 ml-auto md:hidden">
        <div className="relative min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari modul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ModulFilterDialog
          open={mobileFilterOpen}
          onOpenChange={setMobileFilterOpen}
          pendingFileType={pendingFileType}
          pendingSemester={pendingSemester}
          onFileTypeChange={setPendingFileType}
          onSemesterChange={setPendingSemester}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
          fileType={fileType}
          semester={semester}
          fileTypeOptions={fileTypeOptions}
          semesterOptions={semesterOptions}
          isMobile
        />
        {hasPermission('Modul', 'create') && (
          <Button onClick={() => setIsCreateOpen(true)} size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={columns.length}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="text-base font-medium">Modul</h3>
                    <p className="text-xs text-muted-foreground">Kelola modul pembelajaran</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="relative min-w-0 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari modul..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <ModulFilterDialog
                      open={filterOpen}
                      onOpenChange={setFilterOpen}
                      pendingFileType={pendingFileType}
                      pendingSemester={pendingSemester}
                      onFileTypeChange={setPendingFileType}
                      onSemesterChange={setPendingSemester}
                      onApply={handleApplyFilter}
                      onReset={handleResetFilter}
                      fileType={fileType}
                      semester={semester}
                      fileTypeOptions={fileTypeOptions}
                      semesterOptions={semesterOptions}
                    />
                    {hasPermission('Modul', 'create') && (
                      <Button onClick={() => setIsCreateOpen(true)} size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </TableHead>
            </TableRow>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                <TableCell colSpan={columns.length} className="p-0 border-0">
                  <EmptyState title="Belum ada modul" description="Belum ada modul yang diupload" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {moduls.length} dari {pagination?.total_items || 0} data
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => table.previousPage()}
                          className={table.getCanPreviousPage() ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination?.total_pages || 0 }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => loadModuls({ ...{ page, limit: pagination?.limit || 10 } })}
                            isActive={pagination?.page === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => table.nextPage()}
                          className={table.getCanNextPage() ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <ModulUploadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleUpload}
        uploadStates={uploadStates}
        isUploading={isUploading}
      />

      <ModulEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleEdit}
        editingItem={editingItem}
        uploadStates={uploadStates}
        isLoading={isEditLoading}
      />

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingItem?.nama_file}
      />
    </div>
  );
}
