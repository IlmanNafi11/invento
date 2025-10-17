import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UploadState {
  id: string;
  fileName: string;
  fileType?: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface UploadSliceState {
  uploads: Record<string, UploadState>;
}

const initialState: UploadSliceState = {
  uploads: {},
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addUpload: (
      state,
      action: PayloadAction<{
        id: string;
        fileName: string;
        fileType?: string;
      }>
    ) => {
      state.uploads[action.payload.id] = {
        id: action.payload.id,
        fileName: action.payload.fileName,
        fileType: action.payload.fileType,
        progress: 0,
        status: 'waiting',
        startedAt: Date.now(),
      };
    },

    startUpload: (state, action: PayloadAction<{ id: string }>) => {
      const upload = state.uploads[action.payload.id];
      if (upload) {
        upload.status = 'uploading';
      }
    },

    updateProgress: (
      state,
      action: PayloadAction<{ id: string; progress: number }>
    ) => {
      const upload = state.uploads[action.payload.id];
      if (upload) {
        upload.progress = Math.min(100, Math.max(0, action.payload.progress));
      }
    },

    completeUpload: (state, action: PayloadAction<{ id: string }>) => {
      const upload = state.uploads[action.payload.id];
      if (upload) {
        upload.status = 'completed';
        upload.progress = 100;
        upload.completedAt = Date.now();
      }
    },

    errorUpload: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      const upload = state.uploads[action.payload.id];
      if (upload) {
        upload.status = 'error';
        upload.error = action.payload.error;
      }
    },

    cancelUpload: (state, action: PayloadAction<{ id: string }>) => {
      const upload = state.uploads[action.payload.id];
      if (upload) {
        upload.status = 'cancelled';
      }
    },

    removeUpload: (state, action: PayloadAction<{ id: string }>) => {
      delete state.uploads[action.payload.id];
    },

    clearCompletedUploads: (state) => {
      Object.keys(state.uploads).forEach((id) => {
        if (state.uploads[id].status === 'completed') {
          delete state.uploads[id];
        }
      });
    },

    clearAllUploads: (state) => {
      state.uploads = {};
    },
  },
});

export const {
  addUpload,
  startUpload,
  updateProgress,
  completeUpload,
  errorUpload,
  cancelUpload,
  removeUpload,
  clearCompletedUploads,
  clearAllUploads,
} = uploadSlice.actions;

export default uploadSlice.reducer;
