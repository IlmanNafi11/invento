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
const mockProjects: ProjectItem[] = [];
import { formatFileSize, formatDate } from '@/utils/format';
import type { ProjectItem, ProjectCategory } from '@/types';

const categoryOptions: { value: ProjectCategory; label: string }[] = [
  { value: '' as ProjectCategory, label: 'Semua' },
  { value: 'website', label: 'Website' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'iot', label: 'IoT' },
  { value: 'machine learning', label: 'Machine Learning' },
  { value: 'deep learning', label: 'Deep Learning' },
];

const semesterOptions: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'Semester 1', label: 'Semester 1' },
  { value: 'Semester 2', label: 'Semester 2' },
  { value: 'Semester 3', label: 'Semester 3' },
  { value: 'Semester 4', label: 'Semester 4' },
  { value: 'Semester 5', label: 'Semester 5' },
  { value: 'Semester 6', label: 'Semester 6' },
  { value: 'Semester 7', label: 'Semester 7' },
  { value: 'Semester 8', label: 'Semester 8' },
];

interface FilterForm {
  semester: string;
  category: ProjectCategory | '';
}

interface ProjectForm {
  files: { file: File; name: string; category: string }[];
}

export default function Project() {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ProjectItem | null>(null);

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
      files: [],
    },
  });

  const editForm = useForm<ProjectForm>({
    defaultValues: {
      files: [],
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreate = createForm.handleSubmit((_data) => {
    setIsCreateOpen(false);
    createForm.reset();
    toast.success('Project berhasil ditambahkan');
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = editForm.handleSubmit((_data) => {
    setIsEditOpen(false);
    editForm.reset();
    toast.success('Project berhasil diperbarui');
  });

  const handleDelete = () => {
    setIsDeleteOpen(false);
    setDeletingItem(null);
    toast.success('Project berhasil dihapus');
  };

  const openEditDialog = (item: ProjectItem) => {
    editForm.setValue('files', [{ file: new File([], item.name), name: item.name, category: item.category }]);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (item: ProjectItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<ProjectItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Project',
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ getValue }) => {
        const cat = getValue<ProjectCategory>();
        return categoryOptions.find(c => c.value === cat)?.label || cat;
      },
    },
    {
      accessorKey: 'size',
      header: 'Ukuran',
      cell: ({ getValue }) => formatFileSize(getValue<number>()),
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Tanggal Diperbarui',
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
    let data = mockProjects;
    if (search) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (semester) {
      data = data.filter(item =>
        item.semester === semester
      );
    }
    if (category) {
      data = data.filter(item =>
        item.category === category
      );
    }
    return data;
  }, [search, semester, category]);

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
            <DialogTitle>Upload Project</DialogTitle>
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
                        label="Upload Project"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        categoryOptions={categoryOptions}
                        editableName={false}
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
            <DialogTitle>Edit Project</DialogTitle>
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
                        label="Upload Project Baru"
                        onChange={(files) => field.onChange(files)}
                        value={field.value}
                        categoryOptions={categoryOptions}
                        editableName={false}
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