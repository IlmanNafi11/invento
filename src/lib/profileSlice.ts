import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from './userAPI';
import type { Profile, UpdateProfileRequest } from '@/types';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>('profile/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const profile = await userAPI.getProfile();
    return profile;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    return rejectWithValue(err.message || 'Failed to fetch profile');
  }
});

export const updateProfile = createAsyncThunk<
  Profile,
  UpdateProfileRequest,
  { rejectValue: string }
>('profile/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('name', profileData.name);
    if (profileData.jenis_kelamin) {
      formData.append('jenis_kelamin', profileData.jenis_kelamin);
    }
    if (profileData.foto_profil) {
      formData.append('foto_profil', profileData.foto_profil);
    }

    const updatedProfile = await userAPI.updateProfile(formData);
    return updatedProfile;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number; errors?: { message: string }[] };
    if (err.errors) {
      const validationErrors = err.errors.map((e) => e.message).join(', ');
      return rejectWithValue(validationErrors);
    }
    return rejectWithValue(err.message || 'Failed to update profile');
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch profile';
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      });
  },
});

export const { setProfile, clearProfile, clearError } = profileSlice.actions;
export default profileSlice.reducer;