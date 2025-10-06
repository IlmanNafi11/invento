import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from './userAPI';
import type { UserItem, UserListItem, UserFile, UpdateUserRoleRequest } from '@/types';

interface UserState {
  users: UserItem[];
  currentUser: UserItem | null;
  userFiles: UserFile[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  userFiles: [],
  loading: false,
  error: null,
};

const convertUserListItemToUserItem = (apiUser: UserListItem): UserItem => ({
  id: apiUser.id.toString(),
  email: apiUser.email,
  role: {
    id: apiUser.role,
    name: apiUser.role,
    permissions: {
      project: { upload: false, update: false, view: false, delete: false },
      modul: { upload: false, update: false, view: false, delete: false },
      user: { upload: false, update: false, view: false, delete: false },
    },
    lastUpdated: apiUser.dibuat_pada,
  },
  files: [],
  createdAt: apiUser.dibuat_pada,
});

export const fetchUsers = createAsyncThunk<
  UserListItem[],
  { search?: string; filter_role?: string; page?: number; limit?: number } | undefined,
  { rejectValue: string }
>('user/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    const response = await userAPI.getUsers(params);
    return response.data.items;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    return rejectWithValue(err.message || 'Failed to fetch users');
  }
});

export const updateUserRole = createAsyncThunk<
  void,
  { id: number; role: UpdateUserRoleRequest },
  { rejectValue: string }
>('user/updateUserRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    await userAPI.updateUserRole(id, role);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    return rejectWithValue(err.message || 'Failed to update user role');
  }
});

export const deleteUserAsync = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('user/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await userAPI.deleteUser(id);
    return id;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    return rejectWithValue(err.message || 'Failed to delete user');
  }
});

export const fetchUserFiles = createAsyncThunk<
  UserFile[],
  { id: number; search?: string; page?: number; limit?: number },
  { rejectValue: string }
>('user/fetchUserFiles', async ({ id, ...params }, { rejectWithValue }) => {
  try {
    const response = await userAPI.getUserFiles(id, params);
    return response.data.items;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    return rejectWithValue(err.message || 'Failed to fetch user files');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<Omit<UserItem, 'id' | 'createdAt'>>) => {
      const newUser: UserItem = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      state.users.push(newUser);
    },
    updateUser: (state, action: PayloadAction<UserItem>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    setCurrentUser: (state, action: PayloadAction<UserItem | null>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserListItem[]>) => {
        state.loading = false;
        state.users = action.payload.map(convertUserListItemToUserItem);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update user role';
      })
      .addCase(deleteUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload.toString());
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete user';
      })
      .addCase(fetchUserFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFiles.fulfilled, (state, action: PayloadAction<UserFile[]>) => {
        state.loading = false;
        state.userFiles = action.payload;
      })
      .addCase(fetchUserFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user files';
      });
  },
});

export const { addUser, updateUser, deleteUser, setCurrentUser, clearError } = userSlice.actions;
export default userSlice.reducer;