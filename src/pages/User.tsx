"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { usePermissions } from '@/hooks/usePermissions';
import { useUser } from '@/hooks/useUser';
import { fetchRoles } from '@/lib/roleSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { UserMobileFilter } from '@/components/user/UserMobileFilter';
import { UserTable } from '@/components/user/UserTable';
import { UserViewDialog } from '@/components/user/UserViewDialog';
import { UserEditDialog } from '@/components/user/UserEditDialog';
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

  const dispatch = useAppDispatch();
  const { users, userFiles, loading, error, loadUsers, updateRole, deleteUser, loadUserFiles, downloadFiles, clearError } = useUser();
  const roles = useAppSelector((state) => state.role.roles);

  const debouncedSearch = useDebounce(search, 500);
  const canDownloadUserFiles = hasPermission('user', 'download');

  useEffect(() => {
    void loadUsers({ limit: 1000 });
    dispatch(fetchRoles({ limit: 1000 }));
  }, [dispatch, loadUsers]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

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
      const result = await updateRole(parseInt(editingUser.id), { role: data.role });
      if (result.success) {
        setIsEditOpen(false);
        setEditingUser(null);
        editForm.reset();
        toast.success('User berhasil diperbarui');
      } else {
        toast.error(result.error || 'Gagal memperbarui user');
      }
    }
  });

  const handleDelete = async () => {
    if (deletingUser) {
      const result = await deleteUser(parseInt(deletingUser.id));
      if (result.success) {
        setIsDeleteOpen(false);
        setDeletingUser(null);
        toast.success('User berhasil dihapus');
      } else {
        toast.error(result.error || 'Gagal menghapus user');
      }
    }
  };

  const openViewDialog = async (user: UserItem) => {
    setViewingUser(user);
    const result = await loadUserFiles(parseInt(user.id), { limit: 1000 });
    if (!result.success) {
      toast.error(result.error || 'Gagal memuat file user');
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

  const handleDownloadFiles = async (files: UserFile[], successMessage: string): Promise<boolean> => {
    if (!viewingUser || !canDownloadUserFiles) return false;

    const { projectIds, modulIds } = partitionFilesByCategory(files);

    if (projectIds.length === 0 && modulIds.length === 0) {
      toast.error('Tidak ada file yang dapat didownload');
      return false;
    }

    const result = await downloadFiles(parseInt(viewingUser.id), projectIds, modulIds);
    if (result.success) {
      toast.success(successMessage);
      return true;
    } else {
      toast.error(result.error || 'Gagal mendownload file');
      return false;
    }
  };

  const handleDownload = (file: UserFile) => {
    void handleDownloadFiles([file], `File ${file.nama_file} berhasil didownload`);
  };

  const handleBulkDownload = (files: UserFile[]) => {
    void handleDownloadFiles(files, `${files.length} file berhasil didownload`);
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

  return (
    <div className="flex flex-1 flex-col gap-4">
      <UserMobileFilter
        search={search}
        onSearchChange={setSearch}
        filterForm={filterForm}
        roles={roles}
        onApplyFilter={handleApplyFilter}
        onResetFilter={handleResetFilter}
      />

      <UserTable
        users={filteredUsers}
        totalUsers={users.length}
        search={search}
        onSearchChange={setSearch}
        filterForm={filterForm}
        roles={roles}
        onApplyFilter={handleApplyFilter}
        onResetFilter={handleResetFilter}
        canUpdate={hasPermission('user', 'update')}
        canDelete={hasPermission('user', 'delete')}
        onView={openViewDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

            <UserViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        user={viewingUser}
        files={userFiles}
        loading={loading}
        canDownload={canDownloadUserFiles}
        onDownloadFile={handleDownload}
        onBulkDownload={handleBulkDownload}
      />

      <UserEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={editingUser}
        form={editForm}
        roles={roles}
        onSubmit={handleEdit}
        onCancel={() => setIsEditOpen(false)}
      />

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingUser?.email}
      />
    </div>
  );
}
