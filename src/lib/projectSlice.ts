import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { projectAPI } from './projectAPI';
import type { ProjectListItem } from '@/types';

interface ProjectState {
  projects: ProjectListItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
  },
};

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (params?: {
    search?: string;
    filter_semester?: number;
    filter_kategori?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await projectAPI.getProjects(params);
    return response.data;
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (id: number) => {
    await projectAPI.deleteProject(id);
    return id;
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<{
        items: ProjectListItem[];
        pagination: {
          page: number;
          limit: number;
          total_items: number;
          total_pages: number;
        };
      }>) => {
        state.loading = false;
        state.projects = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Gagal memuat project';
      })
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
        state.pagination.total_items -= 1;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Gagal menghapus project';
      });
  },
});

export const { clearError } = projectSlice.actions;
export default projectSlice.reducer;
