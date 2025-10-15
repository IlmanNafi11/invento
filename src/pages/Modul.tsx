import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Upload, Search, Filter, Edit, Trash2, Download, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { FileInput } from '@/components/common/FileInput';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { modulAPI } from '@/lib/modulAPI';
import type { ModulListItem, ErrorResponse, ValidationErrorResponse } from '@/types';

const fileTypeOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pptx', label: 'PPTX' },
];

const semesterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

interface FilterForm {
  fileType: string;
  semester: string;
}

interface ModulForm {
  files: { file?: File; name: string; semester?: number; existingFileSize?: string }[];
}

interface FileUploadState {
  index: number;
  fileName: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function Modul() {
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const handleOpenUpload = () => setIsCreateOpen(true);
    window.addEventListener('open-modul-upload', handleOpenUpload);
    return () => window.removeEventListener('open-modul-upload', handleOpenUpload);
  }, []);
  const [search, setSearch] = useState('');
  const [moduls, setModuls] = useState<ModulListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 0 });
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ModulListItem | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ModulListItem | null>(null);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [pendingFileType, setPendingFileType] = useState<string>('all');
  const [pendingSemester, setPendingSemester] = useState<string>('all');

  const filterForm = useForm<FilterForm>({
    defaultValues: {
      fileType: 'all',
      semester: 'all',
    },
  });

  const createForm = useForm<ModulForm>({
    defaultValues: {
      files: [{ file: undefined, name: '', semester: undefined }],
    },
  });

  const editForm = useForm<ModulForm>({
    defaultValues: {
      files: [],
    },
  });

  const fileType = useWatch({
    control: filterForm.control,
    name: 'fileType',
  });

  const semester = useWatch({
    control: filterForm.control,
    name: 'semester',
  });

  const debouncedSearch = useDebounce(search, 500);

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
      cell: ({ getValue }) => {
        const sem = getValue<number>();
        return `Semester ${sem}`;
      },
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(row.original)}
          >
            <Download className="h-4 w-4" />
          </Button>
          {hasPermission('Modul', 'update') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('Modul', 'delete') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(row.original)}
            >
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
    pageCount: pagination.total_pages,
  });

  const fetchModuls = useCallback(async (pageIndex = 0, pageSize = 10) => {
    try {
      const params: {
        search?: string;
        filter_type?: string;
        filter_semester?: number;
        page?: number;
        limit?: number;
      } = {
        page: pageIndex + 1,
        limit: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (fileType && fileType !== 'all') params.filter_type = fileType;
      if (semester && semester !== 'all') params.filter_semester = parseInt(semester);

      const response = await modulAPI.getModuls(params);
      setModuls(response.data.items || []);
      setPagination(response.data.pagination);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal memuat data modul');
    }
  }, [debouncedSearch, fileType, semester]);

  const handleApplyFilter = () => {
    filterForm.setValue('fileType', pendingFileType);
    filterForm.setValue('semester', pendingSemester);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingFileType('all');
    setPendingSemester('all');
    filterForm.setValue('fileType', 'all');
    filterForm.setValue('semester', 'all');
  };

  const handleCreate = createForm.handleSubmit(async (data) => {
    const files = data.files.filter(f => f.file && f.name && f.semester);
    if (files.length === 0) {
      toast.error('Harap lengkapi nama file dan semester untuk setiap file yang diupload');
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
      status: 'waiting' as const,
    }));
    setUploadStates(initialStates);

    const filesList = files.map(f => f.file!);
    const namesList = files.map(f => f.name);
    const semestersList = files.map(f => f.semester || 1);

    try {
      await modulAPI.uploadMultipleModuls(
        filesList,
        namesList,
        semestersList,
        (fileIndex, progress) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex
              ? { ...state, progress, status: 'uploading' as const }
              : state
          ));
        },
        (fileIndex) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex
              ? { ...state, progress: 100, status: 'completed' as const }
              : state
          ));
        },
        (fileIndex, error) => {
          setUploadStates(prev => prev.map(state =>
            state.index === fileIndex
              ? { ...state, status: 'error' as const, error: error.message }
              : state
          ));
          toast.error(`${files[fileIndex].file!.name}: ${error.message}`);
        }
      );

      const allCompleted = uploadStates.every(state => state.status === 'completed');
      if (allCompleted) {
        setIsCreateOpen(false);
        createForm.reset();
        setUploadStates([]);
        toast.success('Semua modul berhasil diupload');
        fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Gagal mengupload modul');
    } finally {
      setIsUploading(false);
    }
  });

  const hasMetadataChanged = (fileData: { name: string; semester?: number }): boolean => {
    if (!editingItem) return false;
    return fileData.name !== editingItem.nama_file || fileData.semester !== editingItem.semester;
  };

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editingItem) return;

    try {
      setIsEditLoading(true);
      const fileData = data.files[0];
      
      if (!fileData || !fileData.name || !fileData.semester) {
        toast.error('Harap lengkapi nama file dan semester');
        return;
      }

      const isNewFileUploaded = fileData.file && fileData.file.size > 0;
      const metadataChanged = hasMetadataChanged(fileData);

      if (!isNewFileUploaded && !metadataChanged) {
        toast.info('Tidak ada perubahan yang disimpan');
        return;
      }

      if (!isNewFileUploaded && metadataChanged) {
        await modulAPI.updateModulMetadata(editingItem.id, {
          nama_file: fileData.name,
          semester: fileData.semester || 1,
        });
        
        setIsEditOpen(false);
        setEditingItem(null);
        editForm.reset();
        toast.success('Metadata modul berhasil diperbarui');
        fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
        return;
      }

      if (isNewFileUploaded) {
        const fileType = modulAPI.getFileType(fileData.file!);
        
        const uploadMetadata: { nama_file: string; tipe: string; semester: string } = {
          nama_file: fileData.name,
          tipe: fileType,
          semester: fileData.semester?.toString() || '1',
        };

        setUploadStates([{
          index: 0,
          fileName: fileData.file!.name,
          progress: 0,
          status: 'waiting' as const,
        }]);

        try {
          toast.info(`Menunggu slot upload untuk update ${fileData.file!.name}...`);
          
          await modulAPI.pollAndUpdateModulWithChunks(
            editingItem.id,
            fileData.file!,
            uploadMetadata,
            {
              onProgress: (progress) => {
                setUploadStates([{
                  index: 0,
                  fileName: fileData.file!.name,
                  progress: progress.percentage,
                  status: 'uploading' as const,
                }]);
              },
              onSuccess: () => {
                setUploadStates([{
                  index: 0,
                  fileName: fileData.file!.name,
                  progress: 100,
                  status: 'completed' as const,
                }]);
                
                setTimeout(() => {
                  setUploadStates([]);
                  setIsEditOpen(false);
                  setEditingItem(null);
                  editForm.reset();
                  toast.success('Modul berhasil diperbarui');
                  fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
                }, 1000);
              },
              onError: (error) => {
                setUploadStates([{
                  index: 0,
                  fileName: fileData.file!.name,
                  progress: 0,
                  status: 'error' as const,
                  error: error.message,
                }]);
                toast.error(error.message);
              },
            }
          );
          
          const metadataMsg = metadataChanged 
            ? ' (nama file diperbarui)' 
            : '';
          toast.success(`Update dimulai${metadataMsg}`);
        } catch (error) {
          const err = error as Error;
          setUploadStates([]);
          toast.error(err.message);
        }
      }
      
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      if ('errors' in err && err.errors) {
        (err.errors as import('@/types').ValidationError[]).forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || 'Gagal memperbarui modul');
      }
    } finally {
      setIsEditLoading(false);
    }
  });

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleteLoading(true);
      await modulAPI.deleteModul(deletingItem.id);
      setIsDeleteOpen(false);
      setDeletingItem(null);
      toast.success('Modul berhasil dihapus');
      fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal menghapus modul');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDownload = async (item: ModulListItem) => {
    try {
      const blob = await modulAPI.downloadModuls([item.id]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.nama_file;
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

  const openEditDialog = (item: ModulListItem) => {
    setEditingItem(item);
    editForm.setValue('files', [{ file: new File([], item.nama_file), name: item.nama_file, semester: item.semester, existingFileSize: item.ukuran }]);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (item: ModulListItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
  }, [fetchModuls, table]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-end gap-4">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari modul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {(fileType && fileType !== 'all' || semester && semester !== 'all') && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {[fileType !== 'all' ? fileType : null, semester !== 'all' ? semester : null].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Tipe File</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {pendingFileType
                        ? fileTypeOptions.find(option => option.value === pendingFileType)?.label
                        : "Pilih tipe file"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari tipe file..." />
                      <CommandList>
                        <CommandEmpty>Tidak ada tipe file ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {fileTypeOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                setPendingFileType(option.value === pendingFileType ? '' : option.value);
                              }}
                            >
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={pendingSemester} onValueChange={setPendingSemester}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilter} className="flex-1">
                  Terapkan
                </Button>
                <Button variant="outline" onClick={handleResetFilter} className="flex-1">
                  Reset
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasPermission('Modul', 'create') && (
          <Button onClick={() => setIsCreateOpen(true)} size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>

      {uploadStates.length > 0 && (
        <div className="space-y-2 p-4 border rounded-lg">
          <h3 className="text-sm font-medium">Upload Progress</h3>
          {uploadStates.map((state) => (
            <div key={state.index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{state.fileName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {state.status === 'waiting' && 'Menunggu...'}
                    {state.status === 'uploading' && `${state.progress}%`}
                    {state.status === 'completed' && 'Selesai'}
                    {state.status === 'error' && 'Error'}
                  </span>
                  {state.status === 'completed' && (
                    <Badge variant="default" className="h-5">✓</Badge>
                  )}
                  {state.status === 'error' && (
                    <Badge variant="destructive" className="h-5">✗</Badge>
                  )}
                </div>
              </div>
              <Progress value={state.progress} />
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border overflow-auto max-h-96">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                  <EmptyState
                    title="Belum ada modul"
                    description="Silahkan upload modul pertama anda"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {moduls.length} dari {pagination.total_items} data
        </div>
        <div className="space-x-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={table.getCanPreviousPage() ? '' : 'pointer-events-none opacity-50'}
                />
              </PaginationItem>
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(page - 1)}
                    isActive={table.getState().pagination.pageIndex === page - 1}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={table.getCanNextPage() ? '' : 'pointer-events-none opacity-50'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Modul</DialogTitle>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upload modul (max 5 file, 50MB per file, format: DOCX, XLSX, PDF, PPTX)
            </AlertDescription>
          </Alert>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormField
                control={createForm.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        label=""
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        showCategory={false}
                        showSemester={true}
                        editableName={true}
                        namePlaceholder="Nama modul"
                        layout="grid"
                        multiple={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Modul</DialogTitle>
            <DialogDescription>
              Edit nama atau upload file baru (max 50MB, format: DOCX, XLSX, PDF, PPTX)
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-4">
              <FormField
                control={editForm.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        label=""
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        showCategory={false}
                        showSemester={true}
                        editableName={true}
                        namePlaceholder="Nama modul"
                        multiple={false}
                        layout="grid"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isEditLoading}>
                  {isEditLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingItem?.nama_file}
        loading={isDeleteLoading}
      />
    </div>
  );
}
