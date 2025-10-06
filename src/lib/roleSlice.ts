import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { roleAPI } from './role';
import type {
  RoleListResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  PermissionsResponse,
  Role,
  RoleListItem,
} from '@/types';

interface RoleState {
  roles: RoleListItem[];
  permissions: PermissionsResponse['data']['items'] | null;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null;
  loading: boolean;
  error: string | null;
  currentRole: Role | null;
}

const initialState: RoleState = {
  roles: [],
  permissions: null,
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
    const response = await roleAPI.getPermissions();
    return response;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    return rejectWithValue(err.message || 'Failed to fetch permissions');
  }
});

export const fetchRoles = createAsyncThunk<
  RoleListResponse,
  { search?: string; page?: number; limit?: number } | undefined,
  { rejectValue: string }
>('role/fetchRoles', async (params, { rejectWithValue }) => {
  try {
    const response = await roleAPI.getRoles(params);
    return response;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    return rejectWithValue(err.message || 'Failed to fetch roles');
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
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    return rejectWithValue(err.message || 'Failed to fetch role detail');
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
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; errors?: { field: string; message: string }[] };
    if (err.code === 409) {
      return rejectWithValue('Nama role sudah ada');
    }
    if (err.code === 400 && err.errors) {
      const validationErrors = err.errors.map((e) => e.message).join(', ');
      return rejectWithValue(validationErrors);
    }
    return rejectWithValue(err.message || 'Failed to create role');
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
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; errors?: { field: string; message: string }[] };
    if (err.code === 409) {
      return rejectWithValue('Nama role sudah ada');
    }
    if (err.code === 400 && err.errors) {
      const validationErrors = err.errors.map((e) => e.message).join(', ');
      return rejectWithValue(validationErrors);
    }
    return rejectWithValue(err.message || 'Failed to update role');
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
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err.code === 404) {
      return rejectWithValue('Role tidak ditemukan');
    }
    return rejectWithValue(err.message || 'Failed to delete role');
  }
});

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRole: (state, action: PayloadAction<Role | null>) => {
      state.currentRole = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action: PayloadAction<PermissionsResponse>) => {
        state.loading = false;
        state.permissions = action.payload.data.items;
        state.error = null;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch permissions';
      })
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<RoleListResponse>) => {
        state.loading = false;
        state.roles = action.payload.data.items;
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch roles';
      })
      .addCase(fetchRoleDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleDetail.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        state.currentRole = action.payload;
        state.error = null;
      })
      .addCase(fetchRoleDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch role detail';
      })
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state) => {
        state.loading = false;
        // Refresh roles list after creation
        // Note: In a real app, you might want to add the new role to the list
        // or refetch the roles. For now, we'll just clear loading state.
        state.error = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create role';
      })
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        // Update the role in the list
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = {
            id: action.payload.id,
            nama_role: action.payload.nama_role,
            jumlah_permission: action.payload.jumlah_permission,
            tanggal_diperbarui: action.payload.updated_at,
          };
        }
        state.error = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update role';
      })
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete role';
      });
  },
});

export const { clearError, setCurrentRole } = roleSlice.actions;
export default roleSlice.reducer;