import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roleAPI } from './roleAPI';
import { handleAPIError } from './apiErrorHandler';
import type {
  RoleListResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  PermissionsResponse,
  Role,
  RoleListItem,
  Pagination,
  ResourcePermissions,
} from '@/types';

interface RoleState {
  roles: RoleListItem[];
  permissions: ResourcePermissions[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  currentRole: Role | null;
}

const initialState: RoleState = {
  roles: [],
  permissions: [],
  pagination: null,
  loading: false,
  error: null,
  currentRole: null,
};

export const fetchPermissions = createAsyncThunk<
  PermissionsResponse,
  void,
  { rejectValue: string }
>('role/fetchPermissions', async (_, { rejectWithValue }) => {
  try {
    return await roleAPI.getPermissions();
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const fetchRoles = createAsyncThunk<
  RoleListResponse,
  { search?: string; page?: number; limit?: number } | undefined,
  { rejectValue: string }
>('role/fetchRoles', async (params, { rejectWithValue }) => {
  try {
    return await roleAPI.getRoles(params);
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const fetchRoleDetail = createAsyncThunk<
  Role,
  number,
  { rejectValue: string }
>('role/fetchRoleDetail', async (id, { rejectWithValue }) => {
  try {
    const response = await roleAPI.getRoleDetail(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const createRole = createAsyncThunk<
  Role,
  RoleCreateRequest,
  { rejectValue: string }
>('role/createRole', async (roleData, { rejectWithValue }) => {
  try {
    const response = await roleAPI.createRole(roleData);
    return response.data;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const updateRole = createAsyncThunk<
  Role,
  { id: number; data: RoleUpdateRequest },
  { rejectValue: string }
>('role/updateRole', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await roleAPI.updateRole(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

export const deleteRole = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('role/deleteRole', async (id, { rejectWithValue }) => {
  try {
    await roleAPI.deleteRole(id);
    return id;
  } catch (error) {
    return rejectWithValue(handleAPIError(error).message);
  }
});

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRole: (state) => {
      state.currentRole = null;
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
        state.permissions = action.payload.data.items;
        state.error = null;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal mengambil permissions';
      })
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload.data.items;
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal mengambil daftar role';
      })
      .addCase(fetchRoleDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRole = action.payload;
        state.error = null;
      })
      .addCase(fetchRoleDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal mengambil detail role';
      })
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal membuat role';
      })
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = {
            id: action.payload.id,
            nama_role: action.payload.nama_role,
            jumlah_permission: action.payload.jumlah_permission,
            tanggal_diperbarui: action.payload.updated_at,
          };
        }
        state.currentRole = action.payload;
        state.error = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal memperbarui role';
      })
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Gagal menghapus role';
      });
  },
});

export const { clearError, clearCurrentRole } = roleSlice.actions;
export default roleSlice.reducer;