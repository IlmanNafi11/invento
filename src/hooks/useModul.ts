import { useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { fetchModuls, deleteModul, clearError } from '@/lib/modulSlice';

export function useModul() {
  const dispatch = useAppDispatch();
  const { moduls, pagination, loading, error, deleteLoading } = useAppSelector(
    (state) => state.modul
  );

  const loadModuls = useCallback(
    (params?: {
      search?: string;
      filter_type?: string;
      filter_semester?: number;
      page?: number;
      limit?: number;
    }) => {
      return dispatch(fetchModuls(params));
    },
    [dispatch]
  );

  const deleteExistingModul = useCallback(
    async (id: number) => {
      try {
        await dispatch(deleteModul(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const clearModulError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    moduls,
    pagination,
    loading,
    error,
    deleteLoading,
    loadModuls,
    deleteExistingModul,
    clearError: clearModulError,
  };
}
