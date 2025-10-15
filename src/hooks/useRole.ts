import { useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import {
  fetchRoles,
  fetchPermissions,
  fetchRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  clearError,
  clearCurrentRole,
} from '@/lib/roleSlice';
import type { RoleCreateRequest, RoleUpdateRequest } from '@/types';

export function useRole() {
  const dispatch = useAppDispatch();
  const { roles, permissions, loading, error, currentRole, pagination } = useAppSelector(
    (state) => state.role
  );

  const loadRoles = useCallback(
    async (params?: { search?: string; page?: number; limit?: number }) => {
      try {
        await dispatch(fetchRoles(params)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const loadPermissions = useCallback(async () => {
    try {
      await dispatch(fetchPermissions()).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  const loadRoleDetail = useCallback(
    async (id: number) => {
      try {
        await dispatch(fetchRoleDetail(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const createNewRole = useCallback(
    async (roleData: RoleCreateRequest) => {
      try {
        await dispatch(createRole(roleData)).unwrap();
        await dispatch(fetchRoles()).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const updateExistingRole = useCallback(
    async (id: number, roleData: RoleUpdateRequest) => {
      try {
        await dispatch(updateRole({ id, data: roleData })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const deleteExistingRole = useCallback(
    async (id: number) => {
      try {
        await dispatch(deleteRole(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const clearRoleError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetCurrentRole = useCallback(() => {
    dispatch(clearCurrentRole());
  }, [dispatch]);

  return {
    roles,
    permissions,
    loading,
    error,
    currentRole,
    pagination,
    loadRoles,
    loadPermissions,
    loadRoleDetail,
    createNewRole,
    updateExistingRole,
    deleteExistingRole,
    clearError: clearRoleError,
    clearCurrentRole: resetCurrentRole,
  };
}
