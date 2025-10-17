import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiPermission } from '@/types';
import { userAPI } from './userAPI';
import { handleAPIError } from './apiErrorHandler';

export interface PermissionState {
  permissions: ApiPermission[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  loading: false,
  error: null,
};

export const fetchPermissions = createAsyncThunk<
  ApiPermission[],
  void,
  { rejectValue: string }
>('permission/fetchPermissions', async (_, { rejectWithValue }) => {
  try {
    const response = await userAPI.getUserPermissions();
    return response.data;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    clearPermissions: (state) => {
      state.permissions = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
        state.error = null;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.permissions = [];
        state.error = action.payload || 'Failed to fetch permissions';
      });
  },
});

export const { clearPermissions, clearError } = permissionSlice.actions;
export default permissionSlice.reducer;
