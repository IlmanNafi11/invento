import { useCallback, useId } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  addUpload,
  startUpload,
  updateProgress,
  completeUpload,
  errorUpload,
  cancelUpload,
  removeUpload,
  clearCompletedUploads,
  type UploadState,
} from '@/lib/uploadSlice';

export interface UseUploadManagerOptions {
  fileName: string;
  fileType?: string;
}

export function useUploadManager() {
  const dispatch = useAppDispatch();
  const uploads = useAppSelector((state) => state.upload.uploads);
  const uploadId = useId();

  const trackUpload = useCallback(
    (options: UseUploadManagerOptions) => {
      const id = uploadId;
      dispatch(
        addUpload({
          id,
          fileName: options.fileName,
          fileType: options.fileType,
        })
      );
      return id;
    },
    [dispatch, uploadId]
  );

  const markUploading = useCallback(
    (id: string) => {
      dispatch(startUpload({ id }));
    },
    [dispatch]
  );

  const updateUploadProgress = useCallback(
    (id: string, progress: number) => {
      dispatch(updateProgress({ id, progress }));
    },
    [dispatch]
  );

  const markCompleted = useCallback(
    (id: string) => {
      dispatch(completeUpload({ id }));
    },
    [dispatch]
  );

  const markError = useCallback(
    (id: string, error: string) => {
      dispatch(errorUpload({ id, error }));
    },
    [dispatch]
  );

  const cancelUploadItem = useCallback(
    (id: string) => {
      dispatch(cancelUpload({ id }));
    },
    [dispatch]
  );

  const removeUploadItem = useCallback(
    (id: string) => {
      dispatch(removeUpload({ id }));
    },
    [dispatch]
  );

  const clearCompleted = useCallback(() => {
    dispatch(clearCompletedUploads());
  }, [dispatch]);

  const getActiveUploads = useCallback((): UploadState[] => {
    return Object.values(uploads).filter(
      (upload) => upload.status === 'uploading' || upload.status === 'waiting'
    );
  }, [uploads]);

  const getUploadById = useCallback(
    (id: string): UploadState | undefined => {
      return uploads[id];
    },
    [uploads]
  );

  return {
    uploads,
    trackUpload,
    markUploading,
    updateUploadProgress,
    markCompleted,
    markError,
    cancelUploadItem,
    removeUploadItem,
    clearCompleted,
    getActiveUploads,
    getUploadById,
  };
}
