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
import { Skeleton } from '@/components/ui/skeleton';
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
import { useProject } from '@/hooks/useProject';
import { projectAPI } from '@/lib/projectAPI';
import { ProjectUploadDialog } from '@/features/project/ProjectUploadDialog';
import { ProjectEditDialog } from '@/features/project/ProjectEditDialog';
import { ProjectFilterDialog } from '@/features/project/ProjectFilterDialog';
import type { ProjectListItem, ProjectCategory, ErrorResponse, ValidationErrorResponse } from '@/types';
import { useUploadManager } from '@/hooks/useUploadManager';

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
  ...Array.from({ length: 8 }, (_, i) => ({ value: `${i + 1}`, label: `Semester ${i + 1}` })),
];

export default function Project() {
  const { hasPermission } = usePermissions();
  const { projects, loading, pagination, loadProjects, deleteExistingProject } = useProject();
  const uploadManager = useUploadManager();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [semester, setSemester] = useState('');
  const [pendingCategory, setPendingCategory] = useState<ProjectCategory | ''>('');
  const [pendingSemester, setPendingSemester] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ProjectListItem | null>(null);
  const [editingItem, setEditingItem] = useState<ProjectListItem | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const handleOpenUpload = () => setIsCreateOpen(true);
    window.addEventListener('open-project-upload', handleOpenUpload);
    return () => window.removeEventListener('open-project-upload', handleOpenUpload);
  }, []);

  useEffect(() => {
    const params: {
      search?: string;
      filter_kategori?: string;
      filter_semester?: number;
      page?: number;
      limit?: number;
    } = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.filter_kategori = category;
    if (semester) params.filter_semester = parseInt(semester);

    loadProjects(params);
  }, [debouncedSearch, category, semester, pagination?.page, pagination?.limit, loadProjects]);

  const handleApplyFilter = () => {
    setCategory(pendingCategory);
    setSemester(pendingSemester);
    setFilterOpen(false);
    setMobileFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingCategory('');
    setPendingSemester('');
    setCategory('');
    setSemester('');
  };

  const handleUpload = async (data: { files: { file?: File; name: string; category?: ProjectCategory; semester?: number }[] }) => {
    const files = data.files.filter(f => f.file && f.name && f.category && f.semester);
    if (files.length === 0) {
      toast.error('Harap lengkapi nama project, kategori, dan semester');
      return;
    }

    for (const fileData of files) {
      if (fileData.file) {
        const validation = projectAPI.validateProjectFile(fileData.file);
        if (!validation.valid) {
          toast.error(`${fileData.file.name}: ${validation.error}`);
          return;
        }
      }
    }

    let completedCount = 0;
    let hasError = false;

    const fileData = files[0];
    if (!fileData.file || !fileData.category || !fileData.semester) {
      return;
    }

    const uploadId = uploadManager.trackUpload({
      fileName: fileData.file.name,
      fileType: 'file',
    });

    try {
      uploadManager.markUploading(uploadId);
      toast.info(`Menunggu slot upload untuk ${fileData.file.name}...`);

      await new Promise<void>((resolve, reject) => {
        projectAPI.pollAndUploadProjectWithChunks(
          fileData.file!,
          {
            nama_project: fileData.name,
            kategori: fileData.category!,
            semester: fileData.semester!,
            filename: fileData.file!.name,
            filetype: fileData.file!.type,
          },
          {
            onProgress: (progress) => {
              uploadManager.updateUploadProgress(uploadId, progress.percentage);
            },
            onSuccess: () => {
              uploadManager.markCompleted(uploadId);
              completedCount++;
              resolve();
            },
            onError: (error) => {
              uploadManager.markError(uploadId, error.message);
              toast.error(`${fileData.file!.name}: ${error.message}`);
              hasError = true;
              reject(error);
            },
          }
        ).catch(reject);
      });
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      uploadManager.markError(uploadId, err.message);
      hasError = true;
    }

    if (!hasError && completedCount > 0) {
      setTimeout(() => {
        uploadManager.clearCompleted();
        setIsCreateOpen(false);
        toast.success(`${completedCount} project berhasil diupload`);
        loadProjects();
      }, 1500);
    } else if (!hasError && completedCount === 0) {
      toast.error('Upload gagal, tidak ada project yang berhasil diupload');
    }
  };

  const handleEdit = async (data: { files: { file?: File; name: string; category?: ProjectCategory; semester?: number; existingFileSize?: string }[] }) => {
    if (!editingItem) return;

    const fileData = data.files[0];
    if (!fileData) return;

    setIsEditLoading(true);

    try {
      const isNewFileUploaded = fileData.file && fileData.file.size > 0;
      const metadataChanged = fileData.name !== editingItem.nama_project || 
                             fileData.category !== editingItem.kategori || 
                             fileData.semester !== editingItem.semester;

      if (!isNewFileUploaded && metadataChanged) {
        await projectAPI.updateProjectMetadata(editingItem.id, {
          nama_project: fileData.name,
          kategori: fileData.category!,
          semester: fileData.semester!,
        });
        toast.success('Metadata project berhasil diperbarui');
        setIsEditOpen(false);
        setEditingItem(null);
        loadProjects();
      } else if (isNewFileUploaded) {
        if (!fileData.category || !fileData.semester) {
          toast.error('Harap lengkapi kategori dan semester');
          return;
        }

        const uploadId = uploadManager.trackUpload({
          fileName: fileData.file!.name,
          fileType: 'file',
        });

        try {
          uploadManager.markUploading(uploadId);
          toast.info(`Menunggu slot upload untuk ${fileData.file!.name}...`);

          await projectAPI.pollAndUpdateProjectWithChunks(
            editingItem.id,
            fileData.file!,
            {
              nama_project: fileData.name,
              kategori: fileData.category,
              semester: fileData.semester,
              filename: fileData.file!.name,
              filetype: fileData.file!.type,
            },
            {
              onProgress: (progress) => {
                uploadManager.updateUploadProgress(uploadId, progress.percentage);
              },
              onSuccess: () => {
                uploadManager.markCompleted(uploadId);
                setTimeout(() => {
                  uploadManager.clearCompleted();
                  setIsEditOpen(false);
                  setEditingItem(null);
                  toast.success('Project berhasil diperbarui');
                  loadProjects();
                }, 1000);
              },
              onError: (error) => {
                uploadManager.markError(uploadId, error.message);
                toast.error(error.message);
              },
            }
          );
        } catch (error) {
          const err = error as ErrorResponse | ValidationErrorResponse;
          uploadManager.markError(uploadId, err.message || 'Upload gagal');
        }
      }
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal memperbarui project');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    const result = await deleteExistingProject(deletingItem.id);
    if (result.success) {
      setIsDeleteOpen(false);
      setDeletingItem(null);
      toast.success('Project berhasil dihapus');
    } else {
      toast.error(result.error || 'Gagal menghapus project');
    }
  };

  const handleDownload = async (item: ProjectListItem) => {
    try {
      const result = await projectAPI.downloadProjects([item.id]);
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || item.nama_project;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Project berhasil didownload');
    } catch (error) {
      console.error('Download error details:', error);
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal mendownload project');
    }
  };

  const columns: ColumnDef<ProjectListItem>[] = [
    {
      accessorKey: 'nama_project',
      header: 'Nama Project',
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      cell: ({ getValue }) => {
        const kategori = getValue<ProjectCategory>();
        return categoryOptions.find(option => option.value === kategori)?.label || kategori;
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
          {hasPermission('Project', 'update') && (
            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row.original); setIsEditOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('Project', 'delete') && (
            <Button variant="ghost" size="sm" onClick={() => { setDeletingItem(row.original); setIsDeleteOpen(true); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: projects || [],
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
            placeholder="Cari project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ProjectFilterDialog
          open={mobileFilterOpen}
          onOpenChange={setMobileFilterOpen}
          pendingCategory={pendingCategory}
          pendingSemester={pendingSemester}
          onCategoryChange={setPendingCategory}
          onSemesterChange={setPendingSemester}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
          category={category}
          semester={semester}
          categoryOptions={categoryOptions}
          semesterOptions={semesterOptions}
          isMobile
        />
        {hasPermission('Project', 'create') && (
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
                    <h3 className="text-base font-medium">Project</h3>
                    <p className="text-xs text-muted-foreground">Kelola project mahasiswa</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="relative min-w-0 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari project..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <ProjectFilterDialog
                      open={filterOpen}
                      onOpenChange={setFilterOpen}
                      pendingCategory={pendingCategory}
                      pendingSemester={pendingSemester}
                      onCategoryChange={setPendingCategory}
                      onSemesterChange={setPendingSemester}
                      onApply={handleApplyFilter}
                      onReset={handleResetFilter}
                      category={category}
                      semester={semester}
                      categoryOptions={categoryOptions}
                      semesterOptions={semesterOptions}
                    />
                    {hasPermission('Project', 'create') && (
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
            {loading && (projects ?? []).length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
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
                  <EmptyState title="Belum ada project" description="Belum ada project yang diupload" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {projects?.length || 0} dari {pagination?.total_items || 0} data
                  </div>
                  <div className="space-x-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => table.previousPage()}
                            className={table.getCanPreviousPage() ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                          />
                        </PaginationItem>
                        {pagination && pagination.total_pages > 0 && Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => loadProjects({ page, limit: pagination.limit })}
                              isActive={pagination.page === page}
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
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <ProjectUploadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleUpload}
        categoryOptions={categoryOptions}
      />

      <ProjectEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleEdit}
        editingItem={editingItem}
        isLoading={isEditLoading}
        categoryOptions={categoryOptions}
      />

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingItem?.nama_project}
      />
    </div>
  );
}
