"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { formatDate } from '@/utils/format';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  fetchRoles,
  fetchPermissions,
  fetchRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  clearError
} from '@/lib/roleSlice';
import type { RoleListItem, ResourcePermissions } from '@/types';

interface RoleForm {
  nama_role: string;
  permissions: Record<string, string[]>;
}

export default function Role() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleListItem | null>(null);

  const dispatch = useAppDispatch();
  const { roles, permissions, loading, error, currentRole } = useAppSelector((state) => state.role);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const createForm = useForm<RoleForm>({
    defaultValues: {
      nama_role: '',
      permissions: {},
    },
  });

  const editForm = useForm<RoleForm>({
    defaultValues: {
      nama_role: '',
      permissions: {},
    },
  });

  useEffect(() => {
    if (currentRole && isEditOpen) {
      editForm.setValue('nama_role', currentRole.nama_role);
      const permissionsObj: Record<string, string[]> = {};
      currentRole.permissions.forEach(perm => {
        permissionsObj[perm.resource] = perm.actions;
      });
      editForm.setValue('permissions', permissionsObj);
    }
  }, [currentRole, isEditOpen, editForm]);

  const handleCreate = createForm.handleSubmit(async (data) => {
    try {
      await dispatch(createRole(data)).unwrap();
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('Role berhasil ditambahkan');
      dispatch(fetchRoles());
    } catch {
      // Error is handled by the slice
    }
  });

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (editingRole) {
      try {
        await dispatch(updateRole({ id: editingRole.id, data })).unwrap();
        setIsEditOpen(false);
        setEditingRole(null);
        editForm.reset();
        toast.success('Role berhasil diperbarui');
      } catch {
        // Error is handled by the slice
      }
    }
  });

  const handleDelete = async () => {
    if (deletingRole) {
      try {
        await dispatch(deleteRole(deletingRole.id)).unwrap();
        setIsDeleteOpen(false);
        setDeletingRole(null);
        toast.success('Role berhasil dihapus');
      } catch {
        // Error is handled by the slice
      }
    }
  };

  const openEditDialog = (role: RoleListItem) => {
    dispatch(fetchRoleDetail(role.id));
    setEditingRole(role);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (role: RoleListItem) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<RoleListItem>[] = [
    {
      accessorKey: 'nama_role',
      header: 'Role',
    },
    {
      accessorKey: 'jumlah_permission',
      header: 'Jumlah Permission',
    },
    {
      accessorKey: 'tanggal_diperbarui',
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
            onClick={() => openEditDialog(row.original)}
            disabled={loading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(row.original)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    if (!search) return roles;
    return roles.filter(role =>
      role.nama_role.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, roles]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const PermissionCard = ({
    resource,
    form,
  }: {
    resource: ResourcePermissions;
    form: ReturnType<typeof useForm<RoleForm>>;
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{resource.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resource.permissions.map((perm) => (
            <FormField
              key={perm.action}
              control={form.control}
              name={`permissions.${resource.name}`}
              render={({ field }) => {
                const currentValues = field.value || [];
                const isChecked = currentValues.includes(perm.action);

                return (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...currentValues, perm.action]
                            : currentValues.filter((v: string) => v !== perm.action);
                          field.onChange(newValues);
                        }}
                      />
                    </FormControl>
                    <Label className="text-sm font-normal">
                      {perm.label}
                    </Label>
                  </FormItem>
                );
              }}
            />
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Role & Permission</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shrink-0" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Tambah Role
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
            <DialogTitle>Tambah Role</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-6">
              <FormField
                control={createForm.control}
                name="nama_role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nama Role</Label>
                    <FormControl>
                      <Input placeholder="Masukkan nama role" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {permissions?.map((resource) => (
                <PermissionCard key={resource.name} resource={resource} form={createForm} />
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-6">
              <FormField
                control={editForm.control}
                name="nama_role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nama Role</Label>
                    <FormControl>
                      <Input placeholder="Masukkan nama role" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {permissions?.map((resource) => (
                <PermissionCard key={resource.name} resource={resource} form={editForm} />
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
        itemName={deletingRole?.nama_role}
      />
    </div>
  );
}