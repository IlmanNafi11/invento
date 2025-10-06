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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { formatDate } from '@/utils/format';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchUsers, updateUserRole, deleteUserAsync, fetchUserFiles, clearError } from '@/lib/userSlice';
import { fetchRoles } from '@/lib/roleSlice';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserItem, UserFile } from '@/types';

interface FilterForm {
  role: string;
}

export default function User() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [fileSearch, setFileSearch] = useState('');

  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user.users);
  const userFiles = useAppSelector((state) => state.user.userFiles);
  const error = useAppSelector((state) => state.user.error);
  const roles = useAppSelector((state) => state.role.roles);

  const debouncedSearch = useDebounce(search, 500);

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
    setIsFilterOpen(false);
  });

  const handleResetFilter = () => {
    filterForm.reset();
    setFilterRole('');
    setIsFilterOpen(false);
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
        // Error is handled in slice
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
        // Error is handled in slice
      }
    }
  };

  const openViewDialog = async (user: UserItem) => {
    setViewingUser(user);
    setFileSearch('');
    try {
      await dispatch(fetchUserFiles({ id: parseInt(user.id), limit: 1000 })).unwrap();
    } catch {
      // Error handled in slice
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

  const handleDownload = (fileName: string) => {
    toast.success(`File ${fileName} berhasil didownload`);
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
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewDialog(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
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

  const fileColumns: ColumnDef<UserFile>[] = [
    {
      accessorKey: 'nama_file',
      header: 'Nama File',
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDownload(row.original.nama_file)}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">User</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ml-auto">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filter
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
            {userTable.getHeaderGroups().map((headerGroup) => (
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
                <TableCell colSpan={userColumns.length} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {userTable.getFilteredSelectedRowModel().rows.length} dari{' '}
          {userTable.getFilteredRowModel().rows.length} baris dipilih.
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
                <Label>Files</Label>
                <div className="mt-2">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari file..."
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
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