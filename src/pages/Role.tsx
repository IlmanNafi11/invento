import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';
import { RoleTable } from '@/features/role/RoleTable';
import { RoleFormDialog } from '@/features/role/RoleFormDialog';
import type { RoleListItem } from '@/types';

interface RoleFormData {
  nama_role: string;
  permissions: Record<string, string[]>;
}

export default function Role() {
  const { hasPermission } = usePermissions();
  const {
    roles,
    permissions,
    loading,
    error,
    currentRole,
    loadRoles,
    loadPermissions,
    loadRoleDetail,
    createNewRole,
    updateExistingRole,
    deleteExistingRole,
    clearError,
    clearCurrentRole,
  } = useRole();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleListItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles, loadPermissions]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    return roles.filter(role =>
      role.nama_role.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, roles]);

  const handleCreateSubmit = async (data: RoleFormData) => {
    const result = await createNewRole(data);
    if (result.success) {
      setIsCreateOpen(false);
      toast.success('Role berhasil ditambahkan');
    }
  };

  const handleEditSubmit = async (data: RoleFormData) => {
    if (!editingRole) return;
    
    const result = await updateExistingRole(editingRole.id, data);
    if (result.success) {
      setIsEditOpen(false);
      setEditingRole(null);
      clearCurrentRole();
      toast.success('Role berhasil diperbarui');
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    
    const result = await deleteExistingRole(deletingRole.id);
    if (result.success) {
      setIsDeleteOpen(false);
      setDeletingRole(null);
      toast.success('Role berhasil dihapus');
    }
  };

  const openEditDialog = async (role: RoleListItem) => {
    await loadRoleDetail(role.id);
    setEditingRole(role);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (role: RoleListItem) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const handleCloseEditDialog = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingRole(null);
      clearCurrentRole();
    }
  };

  const handleCloseCreateDialog = (open: boolean) => {
    setIsCreateOpen(open);
  };

  const canCreate = hasPermission('Role', 'create') && hasPermission('Permission', 'create');
  const canEdit = hasPermission('Role', 'update') && hasPermission('Permission', 'update');
  const canDelete = hasPermission('Role', 'delete') && hasPermission('Permission', 'delete');

  const itemsPerPage = 10;
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <RoleTable
        roles={paginatedRoles}
        search={search}
        onSearchChange={setSearch}
        onCreateClick={() => setIsCreateOpen(true)}
        onEditClick={openEditDialog}
        onDeleteClick={openDeleteDialog}
        loading={loading}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRoles.length}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        canPreviousPage={currentPage > 1}
        canNextPage={currentPage < totalPages}
      />

      <RoleFormDialog
        open={isCreateOpen}
        onOpenChange={handleCloseCreateDialog}
        onSubmit={handleCreateSubmit}
        permissions={permissions}
        loading={loading}
        title="Tambah Role"
        submitLabel="Simpan"
      />

      <RoleFormDialog
        open={isEditOpen}
        onOpenChange={handleCloseEditDialog}
        onSubmit={handleEditSubmit}
        permissions={permissions}
        loading={loading}
        title="Edit Role"
        submitLabel="Simpan"
        currentRole={currentRole}
      />

      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        itemName={deletingRole?.nama_role}
      />
    </div>
  );
}