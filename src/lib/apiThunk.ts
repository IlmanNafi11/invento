import { createAsyncThunk } from '@reduxjs/toolkit';
import { APIErrorHandler } from './apiErrorHandler';
import type { BaseResponse } from '@/types';

interface ThunkConfig {
  rejectValue: string;
}

interface CreateAsyncThunkOptions<TResponse extends BaseResponse, TArg = void> {
  typePrefix: string;
  apiCall: (arg: TArg) => Promise<TResponse>;
  onSuccess?: (response: TResponse, arg: TArg) => void | Promise<void>;
  onError?: (error: unknown, arg: TArg) => void | Promise<void>;
  transformResponse?: (response: TResponse) => unknown;
  transformError?: (error: unknown) => string;
}

export function createAPIThunk<TResponse extends BaseResponse, TArg = void>(
  options: CreateAsyncThunkOptions<TResponse, TArg>
) {
  const {
    typePrefix,
    apiCall,
    onSuccess,
    onError,
    transformResponse,
    transformError,
  } = options;

  return createAsyncThunk<
    TResponse,
    TArg,
    ThunkConfig
  >(typePrefix, async (arg, { rejectWithValue }) => {
    try {
      const response = await apiCall(arg);

      if (onSuccess) {
        await onSuccess(response, arg);
      }

      if (transformResponse) {
        return transformResponse(response) as TResponse;
      }

      return response;
    } catch (error) {
      if (onError) {
        await onError(error, arg);
      }

      const errorMessage = transformError
        ? transformError(error)
        : APIErrorHandler.getErrorMessage(error);

      return rejectWithValue(errorMessage);
    }
  });
}

interface CreateListThunkOptions<TResponse extends BaseResponse, TParams = void> {
  typePrefix: string;
  apiCall: (params: TParams) => Promise<TResponse>;
  cacheKey?: (params: TParams) => string;
  cacheDuration?: number;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

export function createListThunk<TResponse extends BaseResponse, TParams = void>(
  options: CreateListThunkOptions<TResponse, TParams>
) {
  const {
    typePrefix,
    apiCall,
    cacheKey,
    cacheDuration = 0,
  } = options;

  return createAsyncThunk<
    TResponse,
    TParams,
    ThunkConfig
  >(typePrefix, async (params, { rejectWithValue }) => {
    try {
      if (cacheKey && cacheDuration > 0) {
        const key = cacheKey(params);
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          return cached.data as TResponse;
        }
      }

      const response = await apiCall(params);

      if (cacheKey && cacheDuration > 0) {
        const key = cacheKey(params);
        cache.set(key, {
          data: response,
          timestamp: Date.now(),
        });
      }

      return response;
    } catch (error) {
      return rejectWithValue(APIErrorHandler.getErrorMessage(error));
    }
  });
}

interface CreateMutationThunkOptions<TResponse extends BaseResponse, TArg = void> {
  typePrefix: string;
  apiCall: (arg: TArg) => Promise<TResponse>;
  invalidateCache?: string[];
  onSuccess?: (response: TResponse, arg: TArg) => void | Promise<void>;
}

export function createMutationThunk<TResponse extends BaseResponse, TArg = void>(
  options: CreateMutationThunkOptions<TResponse, TArg>
) {
  const {
    typePrefix,
    apiCall,
    invalidateCache,
    onSuccess,
  } = options;

  return createAsyncThunk<
    TResponse,
    TArg,
    ThunkConfig
  >(typePrefix, async (arg, { rejectWithValue }) => {
    try {
      const response = await apiCall(arg);

      if (invalidateCache) {
        invalidateCache.forEach((key) => cache.delete(key));
      }

      if (onSuccess) {
        await onSuccess(response, arg);
      }

      return response;
    } catch (error) {
      return rejectWithValue(APIErrorHandler.getErrorMessage(error));
    }
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function getCacheSize(): number {
  return cache.size;
}

interface ThunkState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function createInitialThunkState<T>(): ThunkState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function handleThunkPending<T>(state: ThunkState<T>): void {
  state.loading = true;
  state.error = null;
}

export function handleThunkFulfilled<T, TPayload>(
  state: ThunkState<T>,
  action: { payload: TPayload }
): void {
  state.loading = false;
  state.data = action.payload as unknown as T;
  state.error = null;
}

export function handleThunkRejected<T>(
  state: ThunkState<T>,
  action: { payload?: string }
): void {
  state.loading = false;
  state.error = action.payload || 'Terjadi kesalahan';
}
