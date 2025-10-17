import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { 
  fetchUsers, 
  updateUserRole, 
  deleteUserAsync, 
  fetchUserFiles,
  downloadUserFiles,
  clearError 
} from '@/lib/userSlice';
import type { UpdateUserRoleRequest } from '@/types';

export function useUser() {
  const dispatch = useAppDispatch();
  const { users, userFiles, loading, error } = useAppSelector((state) => state.user);

  const loadUsers = useCallback(
    async (params?: { search?: string; filter_role?: string; page?: number; limit?: number }) => {
      try {
        await dispatch(fetchUsers(params)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const updateRole = useCallback(
    async (id: number, role: UpdateUserRoleRequest) => {
      try {
        await dispatch(updateUserRole({ id, role })).unwrap();
        await dispatch(fetchUsers({ limit: 10 }));
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const deleteUser = useCallback(
    async (id: number) => {
      try {
        await dispatch(deleteUserAsync(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const loadUserFiles = useCallback(
    async (id: number, params?: { search?: string; page?: number; limit?: number }) => {
      try {
        await dispatch(fetchUserFiles({ id, ...params })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const downloadFiles = useCallback(
    async (userId: number, projectIds: number[], modulIds: number[]) => {
      try {
        await dispatch(downloadUserFiles({ userId, projectIds, modulIds })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const clearUserError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    users,
    userFiles,
    loading,
    error,
    loadUsers,
    updateRole,
    deleteUser,
    loadUserFiles,
    downloadFiles,
    clearError: clearUserError,
  };
}
