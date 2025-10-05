"use client";

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Upload, Search, Filter, Edit, Trash2 } from 'lucide-react';
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
import { mockFiles } from '@/data/mock/files';
import { formatFileSize, formatDate } from '@/utils/format';
import type { FileItem, FileType } from '@/types';

const fileTypeOptions: { value: FileType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'ppt', label: 'PPT' },
];

interface FilterForm {
  fileType: FileType | '';
}

interface FileForm {
  files: { file: File; name: string }[];
}

export default function Modul() {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FileItem | null>(null);

  const [pendingFileType, setPendingFileType] = useState<FileType | ''>('');

  const filterForm = useForm<FilterForm>({
    defaultValues: {
      fileType: '',
    },
  });

  const createForm = useForm<FileForm>({
    defaultValues: {
      files: [],
    },
  });

  const editForm = useForm<FileForm>({
    defaultValues: {
      files: [],
    },
  });

  const fileType = useWatch({
    control: filterForm.control,
    name: 'fileType',
  });

  const handleApplyFilter = () => {
    filterForm.setValue('fileType', pendingFileType);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPendingFileType('');
    filterForm.setValue('fileType', '');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreate = createForm.handleSubmit((_data) => {
    setIsCreateOpen(false);
    createForm.reset();
    toast.success('File berhasil ditambahkan');
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = editForm.handleSubmit((_data) => {
    setIsEditOpen(false);
    editForm.reset();
    toast.success('File berhasil diperbarui');
  });

  const handleDelete = () => {
    setIsDeleteOpen(false);
    setDeletingItem(null);
    toast.success('File berhasil dihapus');
  };

  const openEditDialog = (item: FileItem) => {
    editForm.setValue('files', [{ file: new File([], item.name), name: item.name }]);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (item: FileItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nama File',
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
    },
    {
      accessorKey: 'size',
      header: 'Ukuran',
      cell: ({ getValue }) => formatFileSize(getValue<number>()),
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Terakhir Diperbarui',
      cell: ({ getValue }) => formatDate(getValue<Date>()),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    let data = mockFiles;
    if (search) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (fileType) {
      data = data.filter(item =>
        item.category.toLowerCase() === fileType.toLowerCase()
      );
    }
    return data;
  }, [search, fileType]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modul</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
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
          <Button onClick={() => setIsCreateOpen(true)} size="icon">
            <Upload className="h-4 w-4" />
          </Button>
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
            <DialogTitle>Upload</DialogTitle>
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
                        label="Upload File"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Upload</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
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
                        label="Upload File Baru"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingItem?.name}
      />
    </div>
  );
}