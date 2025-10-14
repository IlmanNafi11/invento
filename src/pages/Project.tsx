import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Upload, Search, Filter, Edit, Trash2, Loader2, Download, X, File } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
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
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { projectAPI } from '@/lib/projectAPI';
import type { ProjectListItem, ProjectCategory, ErrorResponse, ValidationErrorResponse, UploadProgress } from '@/types';

const categoryOptions: { value: ProjectCategory | ''; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'website', label: 'Website' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'iot', label: 'IoT' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'deep_learning', label: 'Deep Learning' },
];

const semesterOptions: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
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
  semester: string;
  category: ProjectCategory | '';
}

interface ProjectForm {
  file?: File;
  name: string;
  category: string;
  semester?: number;
}

interface UploadState {
  fileName: string;
  progress: number;
  error?: string;
  uploadId: string;
  abortController: AbortController;
}

export default function Project() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 0 });
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ProjectListItem | null>(null);
  const [uploadStates, setUploadStates] = useState<Map<string, UploadState>>(new Map());
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectListItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [pendingSemester, setPendingSemester] = useState<string>('');
  const [pendingCategory, setPendingCategory] = useState<ProjectCategory | ''>('');

  const filterForm = useForm<FilterForm>({
    defaultValues: {
      semester: '',
      category: '',
    },
  });

  const createForm = useForm<ProjectForm>({
    defaultValues: {
      file: undefined,
      name: '',
      category: '',
      semester: undefined,
    },
  });

  const editForm = useForm<ProjectForm>({
    defaultValues: {
      file: undefined,
      name: '',
      category: '',
      semester: undefined,
    },
  });

  const semester = useWatch({
    control: filterForm.control,
    name: 'semester',
  });

  const category = useWatch({
    control: filterForm.control,
    name: 'category',
  });

  const debouncedSearch = useDebounce(search, 500);

  const columns: ColumnDef<ProjectListItem>[] = [
    {
      accessorKey: 'nama_project',
      header: 'Nama Project',
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      cell: ({ getValue }) => {
        const cat = getValue<ProjectCategory>();
        return categoryOptions.find(c => c.value === cat)?.label || cat;
      },
    },
    {
      accessorKey: 'ukuran',
      header: 'Ukuran',
    },
    {
      accessorKey: 'terakhir_diperbarui',
      header: 'Tanggal Diperbarui',
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
          {hasPermission('Project', 'update') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('Project', 'delete') && (
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
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
  });

  const fetchProjects = useCallback(async (pageIndex = 0, pageSize = 10) => {
    try {
      const params: {
        search?: string;
        filter_semester?: number;
        filter_kategori?: string;
        page?: number;
        limit?: number;
      } = {
        page: pageIndex + 1,
        limit: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (semester && semester !== '') params.filter_semester = parseInt(semester);
      if (category) params.filter_kategori = category;

      const response = await projectAPI.getProjects(params);
      setProjects(response.data.items || []);
      setPagination(response.data.pagination);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal memuat data project');
    }
  }, [debouncedSearch, semester, category]);

  const handleApplyFilter = () => {
    filterForm.setValue('semester', pendingSemester);
    filterForm.setValue('category', pendingCategory);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingSemester('');
    setPendingCategory('');
    filterForm.setValue('semester', '');
    filterForm.setValue('category', '');
  };

  const handleUploadProgress = (fileId: string, progress: UploadProgress) => {
    setUploadStates(prev => {
      const newStates = new Map(prev);
      const state = newStates.get(fileId);
      if (state) {
        newStates.set(fileId, {
          ...state,
          progress: progress.percentage,
        });
      }
      return newStates;
    });
  };

  const handleUploadSuccess = (fileId: string) => {
    setUploadStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(fileId);
      return newStates;
    });
  };

  const handleUploadError = (fileId: string, error: Error) => {
    setUploadStates(prev => {
      const newStates = new Map(prev);
      const state = newStates.get(fileId);
      if (state) {
        newStates.set(fileId, {
          ...state,
          error: error.message,
        });
      }
      return newStates;
    });
    toast.error(`Gagal mengupload: ${error.message}`);
  };

  const cancelUpload = async (fileId: string) => {
    const state = uploadStates.get(fileId);
    if (state) {
      state.abortController.abort();
      await projectAPI.cancelUpload(state.uploadId);
      setUploadStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(fileId);
        return newStates;
      });
      toast.info('Upload dibatalkan');
    }
  };

  const handleCreate = createForm.handleSubmit(async (data) => {
    if (!data.file || !data.name || !data.semester || !data.category) {
      toast.error('Harap lengkapi semua field');
      return;
    }

    const fileId = `${Date.now()}-${data.file.name}`;

    try {
      toast.info(`Menunggu slot upload untuk ${data.file.name}...`);

      const activeUpload = await projectAPI.pollAndUploadWithChunks(
        data.file,
        {
          nama_project: data.name,
          kategori: data.category,
          semester: data.semester.toString(),
          filename: data.file.name,
          filetype: data.file.type || 'application/zip',
        },
        {
          onProgress: (progress) => handleUploadProgress(fileId, progress),
          onSuccess: () => {
            handleUploadSuccess(fileId);
            fetchProjects(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
          },
          onError: (error) => handleUploadError(fileId, error),
        }
      );

      setUploadStates(prev => new Map([...prev, [fileId, {
        fileName: data.file!.name,
        progress: 0,
        uploadId: activeUpload.uploadId,
        abortController: activeUpload.abortController,
      }]]));

      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Upload dimulai');
    } catch (error) {
      const err = error as Error;
      toast.error(`${data.file.name}: ${err.message}`);
    }
  });

  const hasMetadataChanged = (data: { name: string; category: string; semester?: number }): boolean => {
    if (!editingItem) return false;

    return (
      data.name !== editingItem.nama_project ||
      data.category !== editingItem.kategori ||
      data.semester !== editingItem.semester
    );
  };

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editingItem) return;

    try {
      setIsEditLoading(true);

      if (!data.name || !data.semester || !data.category) {
        toast.error('Harap lengkapi semua field');
        return;
      }

      const isNewFileUploaded = data.file && data.file.size > 0;
      const metadataChanged = hasMetadataChanged(data);

      if (!isNewFileUploaded && !metadataChanged) {
        toast.info('Tidak ada perubahan yang disimpan');
        return;
      }

      if (!isNewFileUploaded && metadataChanged) {
        await projectAPI.updateProjectMetadata(editingItem.id, {
          nama_project: data.name,
          kategori: data.category,
          semester: data.semester,
        });

        setIsEditOpen(false);
        setEditingItem(null);
        editForm.reset();
        toast.success('Metadata project berhasil diperbarui');
        fetchProjects(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
        return;
      }

      if (isNewFileUploaded) {

        const fileId = `${Date.now()}-${data.file!.name}`;

        try {
          toast.info(`Menunggu slot upload untuk update ${data.file!.name}...`);

          const activeUpload = await projectAPI.pollAndUpdateProjectWithChunks(
            editingItem.id,
            data.file!,
            {
              nama_project: data.name,
              kategori: data.category,
              semester: data.semester.toString(),
              filename: data.file!.name,
              filetype: data.file!.type || 'application/zip',
            },
            {
              onProgress: (progress) => handleUploadProgress(fileId, progress),
              onSuccess: () => {
                handleUploadSuccess(fileId);
                fetchProjects(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
                setIsEditOpen(false);
                setEditingItem(null);
                editForm.reset();
                toast.success('Project berhasil diperbarui');
              },
              onError: (error) => handleUploadError(fileId, error),
            },
            metadataChanged
          );

          setUploadStates(prev => new Map([...prev, [fileId, {
            fileName: data.file!.name,
            progress: 0,
            uploadId: activeUpload.uploadId,
            abortController: activeUpload.abortController,
          }]]));

          toast.success('Update dimulai');
        } catch (error) {
          const err = error as Error;
          toast.error(err.message);
        }
      }
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse | Error;

      if ('errors' in err && err.errors) {
        (err.errors as import('@/types').ValidationError[]).forEach((e) => toast.error(e.message));
      } else if ('message' in err) {
        toast.error(err.message || 'Gagal memperbarui project');
      } else {
        toast.error('Gagal memperbarui project');
      }
    } finally {
      setIsEditLoading(false);
    }
  });

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleteLoading(true);
      await projectAPI.deleteProject(deletingItem.id);
      setIsDeleteOpen(false);
      setDeletingItem(null);
      toast.success('Project berhasil dihapus');
      fetchProjects(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal menghapus project');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDownload = async (item: ProjectListItem) => {
    try {
      const blob = await projectAPI.downloadProjects([item.id]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.nama_project}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Project berhasil didownload');
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal mendownload project');
    }
  };

  const openEditDialog = (item: ProjectListItem) => {
    setEditingItem(item);
    setIsCreateMode(false);
    editForm.setValue('file', undefined);
    editForm.setValue('name', item.nama_project);
    editForm.setValue('category', item.kategori);
    editForm.setValue('semester', item.semester);
    setIsEditOpen(true);
  };

  const getExistingFileInfo = () => {
    if (!editingItem || isCreateMode) return null;
    return {
      name: editingItem.nama_project,
      size: editingItem.ukuran
    };
  };

  const openDeleteDialog = (item: ProjectListItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    fetchProjects(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
  }, [fetchProjects, table]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Project</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {(semester || category) && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {(semester ? 1 : 0) + (category ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {pendingSemester
                          ? semesterOptions.find(option => option.value === pendingSemester)?.label
                          : "Pilih semester"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari semester..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada semester ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {semesterOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  setPendingSemester(option.value === pendingSemester ? '' : option.value);
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
                  <Label>Kategori</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {pendingCategory
                          ? categoryOptions.find(option => option.value === pendingCategory)?.label
                          : "Pilih kategori"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari kategori..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada kategori ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {categoryOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  setPendingCategory(option.value === pendingCategory ? '' : option.value);
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
          {hasPermission('Project', 'create') && (
            <Button onClick={() => {
              setIsCreateMode(true);
              setIsCreateOpen(true);
            }} size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {uploadStates.size > 0 && (
        <div className="space-y-2 p-4 border rounded-lg">
          <h3 className="text-sm font-medium">Upload Progress</h3>
          {Array.from(uploadStates.entries()).map(([fileId, state]) => (
            <div key={fileId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{state.fileName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelUpload(fileId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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

      <div className="rounded-md border">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} dari{' '}
          {table.getFilteredRowModel().rows.length} baris dipilih.
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
            <DialogTitle>Upload Project</DialogTitle>
            <DialogDescription>
              Upload project files (max 500MB per file, format ZIP)
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Project</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama project" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.filter(option => option.value !== '').map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                              <SelectItem key={semester} value={semester.toString()}>
                                Semester {semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Project</FormLabel>
                      <FormControl>
                        <Card
                          className={`border-2 border-dashed transition-colors cursor-pointer ${
                            field.value ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                          }`}
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) {
                              field.onChange(files[0]);
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.zip';
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                field.onChange(files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <CardContent className="p-8">
                            <div className="text-center">
                              {field.value ? (
                                <>
                                  <File className="mx-auto h-12 w-12 text-primary mb-4" />
                                  <p className="text-sm font-medium text-primary">{field.value.name}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {(field.value.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-4">
                                    Klik untuk mengganti file atau seret file baru
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                  <p className="text-sm font-medium">
                                    Upload File Project
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Seret dan jatuhkan file ZIP di sini, atau klik untuk memilih
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Maksimal 500MB
                                  </p>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={uploadStates.size > 0}>
                  {uploadStates.size > 0 && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Edit nama, kategori, semester, atau upload file baru (max 500MB, format ZIP)
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Project</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama project" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.filter(option => option.value !== '').map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                              <SelectItem key={semester} value={semester.toString()}>
                                Semester {semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Project (Opsional)</FormLabel>
                      <FormControl>
                        <Card
                          className={`border-2 border-dashed transition-colors cursor-pointer ${
                            field.value ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                          }`}
                          onDrop={(e: React.DragEvent) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) {
                              field.onChange(files[0]);
                            }
                          }}
                          onDragOver={(e: React.DragEvent) => e.preventDefault()}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.zip';
                            input.onchange = (e: Event) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                field.onChange(files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <CardContent className="p-8">
                            <div className="text-center">
                              {field.value ? (
                                <>
                                  <File className="mx-auto h-12 w-12 text-primary mb-4" />
                                  <p className="text-sm font-medium text-primary">{field.value.name}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {(field.value.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-4">
                                    Klik untuk mengganti file atau seret file baru
                                  </p>
                                </>
                              ) : getExistingFileInfo() ? (
                                <>
                                  <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                  <p className="text-sm font-medium">{getExistingFileInfo()!.name}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {getExistingFileInfo()!.size}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-4">
                                    Klik untuk mengganti file atau seret file baru
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                  <p className="text-sm font-medium">
                                    Upload File Project Baru (Opsional)
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Seret dan jatuhkan file ZIP di sini, atau klik untuk memilih
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Maksimal 500MB
                                  </p>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
        itemName={deletingItem?.nama_project}
        loading={isDeleteLoading}
      />
    </div>
  );
}
