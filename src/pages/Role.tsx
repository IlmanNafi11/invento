"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
import { addRole, updateRole, deleteRole } from '@/lib/roleSlice';
import type { RoleItem, Permission } from '@/types';

interface RoleForm {
  name: string;
  permissions: {
    project: Permission;
    modul: Permission;
    user: Permission;
  };
}

export default function Role() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);

  const dispatch = useAppDispatch();
  const roles = useAppSelector((state) => state.role.roles);

  const createForm = useForm<RoleForm>({
    defaultValues: {
      name: '',
      permissions: {
        project: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
        modul: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
        user: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
      },
    },
  });

  const editForm = useForm<RoleForm>({
    defaultValues: {
      name: '',
      permissions: {
        project: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
        modul: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
        user: {
          upload: false,
          update: false,
          view: false,
          delete: false,
        },
      },
    },
  });

  const countPermissions = (permissions: { project: Permission; modul: Permission; user: Permission }) => {
    const projectCount = Object.values(permissions.project).filter(Boolean).length;
    const modulCount = Object.values(permissions.modul).filter(Boolean).length;
    const userCount = Object.values(permissions.user).filter(Boolean).length;
    return projectCount + modulCount + userCount;
  };

  const handleCreate = createForm.handleSubmit((data) => {
    dispatch(addRole(data));
    setIsCreateOpen(false);
    createForm.reset();
    toast.success('Role berhasil ditambahkan');
  });

  const handleEdit = editForm.handleSubmit((data) => {
    if (editingRole) {
      dispatch(updateRole({ ...editingRole, ...data }));
      setIsEditOpen(false);
      setEditingRole(null);
      editForm.reset();
      toast.success('Role berhasil diperbarui');
    }
  });

  const handleDelete = () => {
    if (deletingRole) {
      dispatch(deleteRole(deletingRole.id));
      setIsDeleteOpen(false);
      setDeletingRole(null);
      toast.success('Role berhasil dihapus');
    }
  };

  const openEditDialog = (role: RoleItem) => {
    editForm.setValue('name', role.name);
    editForm.setValue('permissions', role.permissions);
    setEditingRole(role);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (role: RoleItem) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<RoleItem>[] = [
    {
      accessorKey: 'name',
      header: 'Role',
    },
    {
      id: 'permissionCount',
      header: 'Jumlah Permission',
      cell: ({ row }) => countPermissions(row.original.permissions),
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
    if (!search) return roles;
    return roles.filter(role =>
      role.name.toLowerCase().includes(search.toLowerCase())
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
    title,
    resource,
    form,
  }: {
    title: string;
    resource: 'project' | 'modul' | 'user';
    form: ReturnType<typeof useForm<RoleForm>>;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(['upload', 'update', 'view', 'delete'] as const).map((action) => (
          <FormField
            key={action}
            control={form.control}
            name={`permissions.${resource}.${action}`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label className="text-sm font-normal capitalize">
                  {action === 'upload' ? 'Upload' :
                   action === 'update' ? 'Perbarui' :
                   action === 'view' ? 'Lihat' : 'Hapus'} {title.toLowerCase()}
                </Label>
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );

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
          <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nama Role</Label>
                    <FormControl>
                      <Input placeholder="Masukkan nama role" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <PermissionCard title="Project" resource="project" form={createForm} />
              <PermissionCard title="Modul" resource="modul" form={createForm} />
              <PermissionCard title="User" resource="user" form={createForm} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nama Role</Label>
                    <FormControl>
                      <Input placeholder="Masukkan nama role" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <PermissionCard title="Project" resource="project" form={editForm} />
              <PermissionCard title="Modul" resource="modul" form={editForm} />
              <PermissionCard title="User" resource="user" form={editForm} />
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
        itemName={deletingRole?.name}
      />
    </div>
  );
}