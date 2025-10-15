import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { modulAPI } from './modulAPI';
import { handleAPIError } from './apiErrorHandler';
import type {
  ModulListResponse,
  ModulListItem,
  Pagination,
} from '@/types';

interface ModulState {
  moduls: ModulListItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  deleteLoading: boolean;
  updateLoading: boolean;
}

const initialState: ModulState = {
  moduls: [],
  pagination: null,
  loading: false,
  error: null,
  deleteLoading: false,
  updateLoading: false,
};

export const fetchModuls = createAsyncThunk<
  ModulListResponse,
  {
    search?: string;
    filter_type?: string;
    filter_semester?: number;
    page?: number;
    limit?: number;
  } | undefined,
  { rejectValue: string }
>('modul/fetchModuls', async (params, { rejectWithValue }) => {
  try {
    return await modulAPI.getModuls(params);
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const deleteModul = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('modul/deleteModul', async (id, { rejectWithValue }) => {
  try {
    await modulAPI.deleteModul(id);
    return id;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

const modulSlice = createSlice({
  name: 'modul',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModuls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModuls.fulfilled, (state, action) => {
        state.loading = false;
        state.moduls = action.payload.data.items;
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchModuls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal mengambil daftar modul';
      })
      .addCase(deleteModul.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteModul.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.moduls = state.moduls.filter(modul => modul.id !== action.payload);
        if (state.pagination) {
          state.pagination.total_items -= 1;
        }
        state.error = null;
      })
      .addCase(deleteModul.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || 'Gagal menghapus modul';
      });
  },
});

export const { clearError } = modulSlice.actions;
export default modulSlice.reducer;
