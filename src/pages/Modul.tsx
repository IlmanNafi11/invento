"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Upload, Search, Filter, Edit, Trash2, Download, Loader2 } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { FileInput } from '@/components/common/FileInput';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { modulAPI } from '@/lib/modulAPI';
import type { ModulListItem, ErrorResponse, ValidationErrorResponse } from '@/types';

const fileTypeOptions: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'gif', label: 'GIF' },
];

interface FilterForm {
  fileType: string;
}

interface ModulForm {
  files: { file: File; name: string; existingFileSize?: string }[];
}

export default function Modul() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [moduls, setModuls] = useState<ModulListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 0 });
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ModulListItem | null>(null);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ModulListItem | null>(null);

  const [pendingFileType, setPendingFileType] = useState<string>('');

  const filterForm = useForm<FilterForm>({
    defaultValues: {
      fileType: '',
    },
  });

  const createForm = useForm<ModulForm>({
    defaultValues: {
      files: [{ file: undefined, name: '' }],
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
          {hasPermission('modul', 'update') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('modul', 'delete') && (
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
        page?: number;
        limit?: number;
      } = {
        page: pageIndex + 1,
        limit: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (fileType) params.filter_type = fileType;

      const response = await modulAPI.getModuls(params);
      setModuls(response.data.items || []);
      setPagination(response.data.pagination);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      toast.error(err.message || 'Gagal memuat data modul');
    }
  }, [debouncedSearch, fileType]);

  const handleApplyFilter = () => {
    filterForm.setValue('fileType', pendingFileType);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingFileType('');
    filterForm.setValue('fileType', '');
  };

  const handleCreate = createForm.handleSubmit(async (data) => {
    try {
      setIsCreateLoading(true);
      const files = data.files.filter(f => f.file && f.name);
      if (files.length === 0) {
        toast.error('Harap lengkapi nama file untuk setiap file yang diupload');
        return;
      }

      await modulAPI.createModuls({
        files: files.map(f => f.file),
        nama_file: files.map(f => f.name),
      });

      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Modul berhasil ditambahkan');
      fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
    } catch (error) {
      const err = error as ErrorResponse | ValidationErrorResponse;
      if ('errors' in err && err.errors) {
        (err.errors as import('@/types').ValidationError[]).forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || 'Gagal menambahkan modul');
      }
    } finally {
      setIsCreateLoading(false);
    }
  });

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editingItem) return;

    try {
      setIsEditLoading(true);
      const fileData = data.files[0];
      if (!fileData || !fileData.name) {
        toast.error('Harap lengkapi nama file');
        return;
      }

      await modulAPI.updateModul(editingItem.id, {
        nama_file: fileData.name,
        file: fileData.file.size > 0 ? fileData.file : undefined,
      });

      setIsEditOpen(false);
      setEditingItem(null);
      editForm.reset();
      toast.success('Modul berhasil diperbarui');
      fetchModuls(table.getState().pagination.pageIndex, table.getState().pagination.pageSize);
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
    editForm.setValue('files', [{ file: new File([], item.nama_file), name: item.nama_file, existingFileSize: item.ukuran }]);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modul</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-0 max-w-sm">
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
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {fileType && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    1
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
          {hasPermission('modul', 'create') && (
            <Button onClick={() => setIsCreateOpen(true)} size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
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
            <DialogTitle>Upload Modul</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormField
                control={createForm.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        label="Upload Modul"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        showCategory={false}
                        showSemester={false}
                        namePlaceholder="Nama modul"
                        layout="grid"
                        nameLabel="Nama Modul"
                        addButtonLabel="Tambah Modul Lain"
                        fileLabel="File Modul"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isCreateLoading}>
                  {isCreateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                        label="Upload Modul Baru"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        showCategory={false}
                        showSemester={false}
                        namePlaceholder="Nama modul"
                        multiple={false}
                        layout="grid"
                        nameLabel="Nama Modul"
                        fileLabel="File Modul"
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