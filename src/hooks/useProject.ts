import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store';
import { fetchProjects, deleteProject } from '@/lib/projectSlice';

export function useProject() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading, error, pagination } = useSelector((state: RootState) => state.project);

  const loadProjects = useCallback((params?: {
    search?: string;
    filter_semester?: number;
    filter_kategori?: string;
    page?: number;
    limit?: number;
  }) => {
    dispatch(fetchProjects(params));
  }, [dispatch]);

  const deleteExistingProject = useCallback(async (id: number) => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [dispatch]);

  return {
    projects,
    loading,
    error,
    pagination,
    loadProjects,
    deleteExistingProject,
  };
}
