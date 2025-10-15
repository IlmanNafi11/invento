"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Eye, Edit, Trash2, Download, Filter } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { usePermissions } from '@/hooks/usePermissions';
import { fetchUsers, updateUserRole, deleteUserAsync, fetchUserFiles, clearError, downloadUserFiles } from '@/lib/userSlice';
import { fetchRoles } from '@/lib/roleSlice';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserItem, UserFile } from '@/types';

interface FilterForm {
  role: string;
}

export default function User() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user.users);
  const userFiles = useAppSelector((state) => state.user.userFiles);
  const error = useAppSelector((state) => state.user.error);
  const roles = useAppSelector((state) => state.role.roles);

  const debouncedSearch = useDebounce(search, 500);
  const canDownloadUserFiles = hasPermission('user', 'download');

  useEffect(() => {
    dispatch(fetchUsers({ limit: 1000 }));
    dispatch(fetchRoles({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filterForm = useForm<FilterForm>({
    defaultValues: {
      role: '',
    },
  });

  const editForm = useForm<{ role: string }>({
    defaultValues: {
      role: '',
    },
  });

  const handleApplyFilter = filterForm.handleSubmit((data) => {
    setFilterRole(data.role);
  });

  const handleResetFilter = () => {
    filterForm.reset();
    setFilterRole('');
  };

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (editingUser) {
      try {
        await dispatch(updateUserRole({ id: parseInt(editingUser.id), role: { role: data.role } })).unwrap();
        dispatch(fetchUsers({ limit: 1000 }));
        setIsEditOpen(false);
        setEditingUser(null);
        editForm.reset();
        toast.success('User berhasil diperbarui');
      } catch {
        toast.error('Gagal memperbarui user');
      }
    }
  });

  const handleDelete = async () => {
    if (deletingUser) {
      try {
        await dispatch(deleteUserAsync(parseInt(deletingUser.id))).unwrap();
        setIsDeleteOpen(false);
        setDeletingUser(null);
        toast.success('User berhasil dihapus');
      } catch {
        toast.error('Gagal menghapus user');
      }
    }
  };

  const openViewDialog = async (user: UserItem) => {
    setViewingUser(user);
    setFileSearch('');
    setSelectedFiles(new Set());
    try {
      await dispatch(fetchUserFiles({ id: parseInt(user.id), limit: 1000 })).unwrap();
    } catch {
      toast.error('Gagal memuat file user');
    }
    setIsViewOpen(true);
  };

  const openEditDialog = (user: UserItem) => {
    editForm.setValue('role', user.role.name);
    setEditingUser(user);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: UserItem) => {
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  const getFileKey = (file: UserFile) => `${file.kategori.toLowerCase()}:${file.id}`;

  const partitionFilesByCategory = (files: UserFile[]) => {
    const projectIds: number[] = [];
    const modulIds: number[] = [];

    files.forEach((file) => {
      const category = file.kategori.toLowerCase();
      if (category === 'project') {
        projectIds.push(file.id);
      } else if (category === 'modul') {
        modulIds.push(file.id);
      }
    });

    return { projectIds, modulIds };
  };

  const downloadFiles = async (files: UserFile[], successMessage: string): Promise<boolean> => {
    if (!viewingUser || !canDownloadUserFiles) return false;

    const { projectIds, modulIds } = partitionFilesByCategory(files);

    if (projectIds.length === 0 && modulIds.length === 0) {
      toast.error('Tidak ada file yang dapat didownload');
      return false;
    }

    try {
      await dispatch(downloadUserFiles({
        userId: parseInt(viewingUser.id),
        projectIds,
        modulIds,
      })).unwrap();
      toast.success(successMessage);
      return true;
    } catch {
      toast.error('Gagal mendownload file');
      return false;
    }
  };

  const handleDownload = (file: UserFile) => {
    void downloadFiles([file], `File ${file.nama_file} berhasil didownload`);
  };

  const handleFileSelect = (file: UserFile, checked: boolean) => {
    const key = getFileKey(file);
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedFiles(new Set(filteredFiles.map((file) => getFileKey(file))));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFileCount === 0) return;

    const filesToDownload = Array.from(selectedFiles)
      .map((key) => fileLookup.get(key))
      .filter((file): file is UserFile => Boolean(file));
    
    if (filesToDownload.length === 0) return;
    
    const success = await downloadFiles(
      filesToDownload, 
      `${filesToDownload.length} file berhasil didownload`
    );
    
    if (success) {
      setSelectedFiles(new Set());
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (debouncedSearch) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (filterRole) {
      filtered = filtered.filter(user => user.role.name === filterRole);
    }

    return filtered;
  }, [debouncedSearch, filterRole, users]);

  const debouncedFileSearch = useDebounce(fileSearch, 500);

  const filteredFiles = useMemo(() => {
    if (!debouncedFileSearch) return userFiles;
    return userFiles.filter(file =>
      file.nama_file.toLowerCase().includes(debouncedFileSearch.toLowerCase()) ||
      file.kategori.toLowerCase().includes(debouncedFileSearch.toLowerCase())
    );
  }, [userFiles, debouncedFileSearch]);

  const fileLookup = useMemo(() => {
    const map = new Map<string, UserFile>();
    userFiles.forEach((file) => {
      map.set(getFileKey(file), file);
    });
    return map;
  }, [userFiles]);

  const selectedFileCount = selectedFiles.size;
  const isAllSelected = filteredFiles.length > 0 && filteredFiles.every((file) => selectedFiles.has(getFileKey(file)));
  const headerCheckboxState: boolean | 'indeterminate' = isAllSelected ? true : selectedFileCount > 0 ? 'indeterminate' : false;

  const userColumns: ColumnDef<UserItem>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role.name',
      header: 'Role',
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat Pada',
      cell: ({ getValue }) => formatDate(new Date(getValue<string>())),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewDialog(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {hasPermission('user', 'update') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission('user', 'delete') && (
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

  const fileColumns: ColumnDef<UserFile>[] = [
    ...(canDownloadUserFiles ? [{
      id: 'select',
      header: () => (
        <Checkbox
          checked={headerCheckboxState}
          onCheckedChange={handleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedFiles.has(getFileKey(row.original))}
          onCheckedChange={(checked) => handleFileSelect(row.original, checked === true)}
        />
      ),
    } as ColumnDef<UserFile>] : []),
    {
      accessorKey: 'nama_file',
      header: 'Nama File',
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
    },
    ...(canDownloadUserFiles ? [{
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDownload(row.original)}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    } as ColumnDef<UserFile>] : []),
  ];

  const userTable = useReactTable({
    data: filteredUsers,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const fileTable = useReactTable({
    data: filteredFiles,
    columns: fileColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col lg:hidden sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-row items-center gap-4 ml-auto">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4">
              <Form {...filterForm}>
                <form onSubmit={handleApplyFilter} className="space-y-4">
                  <FormField
                    control={filterForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Role</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Pilih role"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Cari role..." />
                              <CommandList>
                                <CommandEmpty>Role tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {roles.map((role) => (
                                    <CommandItem
                                      key={role.id}
                                      value={role.nama_role}
                                      onSelect={() => {
                                        filterForm.setValue("role", role.nama_role);
                                      }}
                                    >
                                      {role.nama_role}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          role.nama_role === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Terapkan
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetFilter} className="flex-1">
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={userColumns.length}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="text-base font-medium">User</h3>
                    <p className="text-xs text-muted-foreground">Kelola data pengguna</p>
                  </div>
                  <div className="lg:flex hidden flex-row items-center gap-4">
                    <div className="relative min-w-0 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 p-4">
                        <Form {...filterForm}>
                          <form onSubmit={handleApplyFilter} className="space-y-4">
                            <FormField
                              control={filterForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <Label>Role</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value || "Pilih role"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        <CommandInput placeholder="Cari role..." />
                                <CommandList>
                                  <CommandEmpty>Role tidak ditemukan.</CommandEmpty>
                                  <CommandGroup>
                                    {roles.map((role) => (
                                      <CommandItem
                                        key={role.id}
                                        value={role.nama_role}
                                        onSelect={() => {
                                          filterForm.setValue("role", role.nama_role);
                                        }}
                                      >
                                        {role.nama_role}
                                        <Check
                                          className={cn(
                                            "ml-auto",
                                            role.nama_role === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          Terapkan
                        </Button>
                        <Button type="button" variant="outline" onClick={handleResetFilter} className="flex-1">
                          Reset
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DropdownMenuContent>
              </DropdownMenu>
                  </div>
                </div>
              </TableHead>
            </TableRow>
            {userTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
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
            {userTable.getRowModel().rows?.length ? (
              userTable.getRowModel().rows.map((row) => (
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
                <TableCell colSpan={userColumns.length} className="p-0 border-0">
                  <EmptyState
                    title="Belum ada user"
                    description="Belum ada user yang terdaftar"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={userColumns.length} className="text-center">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {userTable.getFilteredRowModel().rows.length} dari {users.length} data
                  </div>
                  <div className="space-x-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => userTable.previousPage()}
                            className={userTable.getCanPreviousPage() ? '' : 'pointer-events-none opacity-50'}
                          />
                        </PaginationItem>
                        {Array.from({ length: userTable.getPageCount() }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => userTable.setPageIndex(page - 1)}
                              isActive={userTable.getState().pagination.pageIndex === page - 1}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => userTable.nextPage()}
                            className={userTable.getCanNextPage() ? '' : 'pointer-events-none opacity-50'}
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="text-sm text-muted-foreground">{viewingUser.role.name}</p>
              </div>
              <div>
                <div className="mt-2">
                  <div className="max-h-96 overflow-y-auto">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead colSpan={fileColumns.length} className="text-left py-2">
                              <div className="flex items-center justify-between">
                                {selectedFileCount > 0 && canDownloadUserFiles && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" aria-label="Download semua">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={handleBulkDownload}>
                                        Download semua
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                                <div className="relative max-w-sm ml-auto">
                                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="Cari file..."
                                    value={fileSearch}
                                    onChange={(e) => setFileSearch(e.target.value)}
                                    className="pl-9"
                                  />
                                </div>
                              </div>
                            </TableHead>
                          </TableRow>
                          {fileTable.getHeaderGroups().map((headerGroup) => (
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
                          {fileTable.getRowModel().rows?.length ? (
                            fileTable.getRowModel().rows.map((row) => (
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
                              <TableCell colSpan={fileColumns.length} className="h-24 text-center">
                                Tidak ada file.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="space-x-2">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => fileTable.previousPage()}
                              className={fileTable.getCanPreviousPage() ? '' : 'pointer-events-none opacity-50'}
                            />
                          </PaginationItem>
                          {Array.from({ length: fileTable.getPageCount() }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => fileTable.setPageIndex(page - 1)}
                                isActive={fileTable.getState().pagination.pageIndex === page - 1}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => fileTable.nextPage()}
                              className={fileTable.getCanNextPage() ? '' : 'pointer-events-none opacity-50'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
              </div>
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Role</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Pilih role"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Cari role..." />
                          <CommandList>
                            <CommandEmpty>Role tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {roles.map((role) => (
                                <CommandItem
                                  key={role.id}
                                  value={role.nama_role}
                                  onSelect={() => {
                                    editForm.setValue("role", role.nama_role);
                                  }}
                                >
                                  {role.nama_role}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      role.nama_role === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  Perbarui
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
        itemName={deletingUser?.email}
      />
    </div>
  );
}
