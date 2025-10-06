import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from './auth';
import type { User, AuthRequest, RegisterRequest, AuthSuccessResponse } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Load initial state from localStorage
const loadAuthState = (): AuthState => {
  try {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        ...initialState,
        user,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
  }
  return initialState;
};

export const login = createAsyncThunk<
  AuthSuccessResponse,
  AuthRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials);
    return response;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; errors?: { message: string }[] };
    if (err.code === 401) {
      return rejectWithValue('Email atau password salah');
    }
    if (err.code === 400 && err.errors) {
      const validationErrors = err.errors.map((e) => e.message).join(', ');
      return rejectWithValue(validationErrors);
    }
    return rejectWithValue(err.message || 'Terjadi kesalahan saat login');
  }
});

export const register = createAsyncThunk<
  AuthSuccessResponse,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData);
    return response;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; errors?: { message: string }[] };
    if (err.code === 409) {
      return rejectWithValue('Email sudah terdaftar');
    }
    if (err.code === 400 && err.errors) {
      const validationErrors = err.errors.map((e) => e.message).join(', ');
      return rejectWithValue(validationErrors);
    }
    return rejectWithValue(err.message || 'Terjadi kesalahan saat registrasi');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: loadAuthState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthSuccessResponse>) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.error = null;

        // Store tokens and user in localStorage
        localStorage.setItem('access_token', action.payload.data.access_token);
        localStorage.setItem('refresh_token', action.payload.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(action.payload.data.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login gagal';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthSuccessResponse>) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.error = null;

        // Store tokens and user in localStorage
        localStorage.setItem('access_token', action.payload.data.access_token);
        localStorage.setItem('refresh_token', action.payload.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(action.payload.data.user));
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registrasi gagal';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;