import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TUSProgressInfo } from './tusProgress';
import type { TUSError } from './tusErrorHandler';
import type { TUSSlotInfo } from './tusClient';

export interface TUSUploadState {
  uploadId: string;
  fileName: string;
  status: 'initiating' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: TUSProgressInfo | null;
  error: TUSError | null;
}

export interface TUSSlotState {
  loading: boolean;
  data: TUSSlotInfo | null;
  error: string | null;
}

export interface TUSState {
  uploads: Record<string, TUSUploadState>;
  projectSlot: TUSSlotState;
  modulSlot: TUSSlotState;
}

const initialSlotState: TUSSlotState = {
  loading: false,
  data: null,
  error: null,
};

const initialState: TUSState = {
  uploads: {},
  projectSlot: initialSlotState,
  modulSlot: initialSlotState,
};

const tusSlice = createSlice({
  name: 'tus',
  initialState,
  reducers: {
    initiateUpload: (
      state,
      action: PayloadAction<{ uploadId: string; fileName: string }>
    ) => {
      state.uploads[action.payload.uploadId] = {
        uploadId: action.payload.uploadId,
        fileName: action.payload.fileName,
        status: 'initiating',
        progress: null,
        error: null,
      };
    },

    startUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'uploading';
      }
    },

    updateProgress: (
      state,
      action: PayloadAction<{ uploadId: string; progress: TUSProgressInfo }>
    ) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.progress = action.payload.progress;
      }
    },

    pauseUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'paused';
      }
    },

    resumeUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'uploading';
        upload.error = null;
      }
    },

    completeUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'completed';
      }
    },

    failUpload: (
      state,
      action: PayloadAction<{ uploadId: string; error: TUSError }>
    ) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'failed';
        upload.error = action.payload.error;
      }
    },

    cancelUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      const upload = state.uploads[action.payload.uploadId];
      if (upload) {
        upload.status = 'cancelled';
      }
    },

    removeUpload: (state, action: PayloadAction<{ uploadId: string }>) => {
      delete state.uploads[action.payload.uploadId];
    },

    clearCompletedUploads: (state) => {
      Object.keys(state.uploads).forEach((uploadId) => {
        if (state.uploads[uploadId].status === 'completed') {
          delete state.uploads[uploadId];
        }
      });
    },

    clearFailedUploads: (state) => {
      Object.keys(state.uploads).forEach((uploadId) => {
        if (state.uploads[uploadId].status === 'failed') {
          delete state.uploads[uploadId];
        }
      });
    },

    clearAllUploads: (state) => {
      state.uploads = {};
    },

    fetchProjectSlotRequest: (state) => {
      state.projectSlot.loading = true;
      state.projectSlot.error = null;
    },

    fetchProjectSlotSuccess: (state, action: PayloadAction<TUSSlotInfo>) => {
      state.projectSlot.loading = false;
      state.projectSlot.data = action.payload;
      state.projectSlot.error = null;
    },

    fetchProjectSlotFailure: (state, action: PayloadAction<string>) => {
      state.projectSlot.loading = false;
      state.projectSlot.error = action.payload;
    },

    fetchModulSlotRequest: (state) => {
      state.modulSlot.loading = true;
      state.modulSlot.error = null;
    },

    fetchModulSlotSuccess: (state, action: PayloadAction<TUSSlotInfo>) => {
      state.modulSlot.loading = false;
      state.modulSlot.data = action.payload;
      state.modulSlot.error = null;
    },

    fetchModulSlotFailure: (state, action: PayloadAction<string>) => {
      state.modulSlot.loading = false;
      state.modulSlot.error = action.payload;
    },

    clearProjectSlot: (state) => {
      state.projectSlot = initialSlotState;
    },

    clearModulSlot: (state) => {
      state.modulSlot = initialSlotState;
    },
  },
});

export const {
  initiateUpload,
  startUpload,
  updateProgress,
  pauseUpload,
  resumeUpload,
  completeUpload,
  failUpload,
  cancelUpload,
  removeUpload,
  clearCompletedUploads,
  clearFailedUploads,
  clearAllUploads,
  fetchProjectSlotRequest,
  fetchProjectSlotSuccess,
  fetchProjectSlotFailure,
  fetchModulSlotRequest,
  fetchModulSlotSuccess,
  fetchModulSlotFailure,
  clearProjectSlot,
  clearModulSlot,
} = tusSlice.actions;

export default tusSlice.reducer;
