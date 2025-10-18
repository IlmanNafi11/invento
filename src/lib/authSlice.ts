import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from './auth';
import { clearProfile } from './profileSlice';
import { handleAPIError } from './apiUtils';
import { tokenRefreshManager } from './tokenRefreshManager';
import type { User, AuthRequest, RegisterRequest, AuthSuccessResponse } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializingAuth: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  initializingAuth: true,
  error: null,
};

export const initializeAuth = createAsyncThunk<
  { access_token: string } | null,
  void,
  { rejectValue: string }
>('auth/initializeAuth', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.refreshToken();
    return { access_token: response.data.access_token };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 400) {
      return null;
    }
    return rejectWithValue('Failed to restore session');
  }
});

export const login = createAsyncThunk<
  AuthSuccessResponse,
  AuthRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue, dispatch }) => {
  try {
    dispatch(clearProfile());
    const response = await authAPI.login(credentials);
    return response;
  } catch (error) {
    const errorInfo = handleAPIError(error);
    
    if (errorInfo.isUnauthorized) {
      return rejectWithValue('Email atau password salah');
    }
    
    return rejectWithValue(errorInfo.message);
  }
});

export const register = createAsyncThunk<
  AuthSuccessResponse,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue, dispatch }) => {
  try {
    dispatch(clearProfile());
    const response = await authAPI.register(userData);
    return response;
  } catch (error) {
    const errorInfo = handleAPIError(error);
    
    if (errorInfo.isConflict) {
      return rejectWithValue('Email sudah terdaftar');
    }
    
    return rejectWithValue(errorInfo.message);
  }
});

interface ConfirmResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export const confirmResetPasswordOTP = createAsyncThunk<
  AuthSuccessResponse,
  ConfirmResetPasswordPayload,
  { rejectValue: string }
>('auth/confirmResetPasswordOTP', async (payload, { rejectWithValue, dispatch }) => {
  try {
    dispatch(clearProfile());
    const response = await authAPI.confirmResetPasswordOTP(payload);
    return response;
  } catch (error) {
    const errorInfo = handleAPIError(error);
    return rejectWithValue(errorInfo.message);
  }
});

interface VerifyRegisterOTPPayload {
  email: string;
  code: string;
}

export const verifyRegisterOTP = createAsyncThunk<
  AuthSuccessResponse,
  VerifyRegisterOTPPayload,
  { rejectValue: string }
>('auth/verifyRegisterOTP', async (payload, { rejectWithValue, dispatch }) => {
  try {
    dispatch(clearProfile());
    const response = await authAPI.verifyRegisterOTP({
      email: payload.email,
      code: payload.code,
      type: 'register',
    });
    return response;
  } catch (error) {
    const errorInfo = handleAPIError(error);
    return rejectWithValue(errorInfo.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    tokenRefreshManager.reset();
    dispatch(clearProfile());
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setInitializingAuth: (state, action: PayloadAction<boolean>) => {
      state.initializingAuth = action.payload;
    },
    clearAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.initializingAuth = false;
      state.error = null;
      tokenRefreshManager.reset();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.initializingAuth = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<{ access_token: string } | null>) => {
        state.initializingAuth = false;
        if (action.payload) {
          state.accessToken = action.payload.access_token;
          state.isAuthenticated = true;
        } else {
          state.accessToken = null;
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.initializingAuth = false;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthSuccessResponse>) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.access_token;
        state.isAuthenticated = true;
        state.error = null;
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
        state.accessToken = action.payload.data.access_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registrasi gagal';
      })
      .addCase(confirmResetPasswordOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmResetPasswordOTP.fulfilled, (state, action: PayloadAction<AuthSuccessResponse>) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.access_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(confirmResetPasswordOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Reset password gagal';
      })
      .addCase(verifyRegisterOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegisterOTP.fulfilled, (state, action: PayloadAction<AuthSuccessResponse>) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.access_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyRegisterOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Verifikasi OTP gagal';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.initializingAuth = false;
      });
  },
});

export const { setAccessToken, setInitializingAuth, clearAuthState, clearError } = authSlice.actions;
export default authSlice.reducer;