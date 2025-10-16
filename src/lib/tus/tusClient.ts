import { TUSErrorHandler, TUSErrorType, type TUSError } from './tusErrorHandler';
import { TUSMetadataEncoder, type TUSMetadata } from './tusMetadata';
import { getAccessToken } from '../tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface TUSClientConfig {
  baseURL?: string;
  chunkSize?: number;
  maxRetries?: number;
}

export interface TUSUploadInfo {
  upload_id: string;
  upload_url: string;
  offset: number;
  length: number;
}

export interface TUSUploadStatus {
  offset: number;
  length: number;
  progress: number;
}

export interface TUSSlotInfo {
  available: boolean;
  message: string;
  queue_length: number;
  active_upload?: boolean;
  max_concurrent?: number;
  max_queue?: number;
}

export interface TUSInitiateOptions {
  fileSize: number;
  metadata?: TUSMetadata;
  metadataType?: 'project' | 'modul';
  isUpdate?: boolean;
  resourceId?: number;
  hasMetadataChanged?: boolean;
}

export class TUSClient {
  private readonly baseURL: string;
  private readonly chunkSize: number;
  private readonly maxRetries: number;
  private readonly tusVersion: string = '1.0.0';

  constructor(config: TUSClientConfig = {}) {
    this.baseURL = config.baseURL || API_BASE_URL;
    this.chunkSize = config.chunkSize || 1024 * 1024;
    this.maxRetries = config.maxRetries || 3;
  }

  private getAuthToken(): string | null {
    return getAccessToken();
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getTUSHeaders(): HeadersInit {
    return {
      'Tus-Resumable': this.tusVersion,
      ...this.getAuthHeaders(),
    };
  }

  async checkSlot(endpoint: string): Promise<TUSSlotInfo> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }

    const data = await response.json();
    return data.data as TUSSlotInfo;
  }

  async resetQueue(endpoint: string): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }
  }

  async checkSlotWithRetry(
    endpoint: string,
    maxRetries: number = 1
  ): Promise<{ slotInfo: TUSSlotInfo; wasReset: boolean }> {
    const slotInfo = await this.checkSlot(endpoint);

    const isStuck =
      !slotInfo.available &&
      slotInfo.queue_length === 0 &&
      slotInfo.active_upload === true;

    if (isStuck && maxRetries > 0) {
      const resetEndpoint = endpoint.replace('/check-slot', '/reset-queue');
      await this.resetQueue(resetEndpoint);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const retryResult = await this.checkSlotWithRetry(endpoint, maxRetries - 1);
      return { ...retryResult, wasReset: true };
    }

    return { slotInfo, wasReset: false };
  }

  async pollForSlot(
    endpoint: string,
    maxWaitTimeMs: number = 30000,
    pollIntervalMs: number = 1000
  ): Promise<TUSSlotInfo> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTimeMs) {
      const { slotInfo } = await this.checkSlotWithRetry(endpoint);

      if (slotInfo.available) {
        return slotInfo;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw TUSErrorHandler.createError(
      408,
      'Tidak ada slot upload tersedia setelah menunggu maksimal. Silakan coba lagi nanti.',
      TUSErrorType.QUEUE_FULL
    );
  }

  async initiate(endpoint: string, options: TUSInitiateOptions): Promise<TUSUploadInfo> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.getTUSHeaders(),
      'Upload-Length': options.fileSize.toString(),
    } as Record<string, string>;

    if (options.metadata && options.metadataType) {
      const encodedMetadata = TUSMetadataEncoder.encodeMetadata(
        options.metadata,
        options.metadataType
      );
      headers['Upload-Metadata'] = encodedMetadata;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }

    const data = await response.json();
    return data.data as TUSUploadInfo;
  }

  async uploadChunk(
    uploadUrl: string,
    chunk: Blob,
    offset: number,
    signal?: AbortSignal
  ): Promise<number> {
    const url = `${this.baseURL}${uploadUrl}`;
    const headers = {
      ...this.getTUSHeaders(),
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': offset.toString(),
    } as Record<string, string>;

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: chunk,
      signal,
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }

    const newOffsetHeader = response.headers.get('Upload-Offset');
    if (!newOffsetHeader) {
      throw TUSErrorHandler.createError(
        500,
        'Server tidak mengembalikan Upload-Offset',
        TUSErrorType.SERVER_ERROR
      );
    }

    return parseInt(newOffsetHeader, 10);
  }

  async uploadChunkWithRetry(
    uploadUrl: string,
    chunk: Blob,
    offset: number,
    signal?: AbortSignal
  ): Promise<number> {
    return TUSErrorHandler.retryOperation(
      async () => {
        try {
          return await this.uploadChunk(uploadUrl, chunk, offset, signal);
        } catch (error) {
          const tusError = TUSErrorHandler.handleError(error);

          if (tusError.type === TUSErrorType.OFFSET_MISMATCH && tusError.correctOffset !== undefined) {
            return tusError.correctOffset;
          }

          throw tusError;
        }
      },
      this.maxRetries,
      (error: TUSError) => TUSErrorHandler.isRetryable(error)
    );
  }

  async getStatus(uploadUrl: string): Promise<TUSUploadStatus> {
    const url = `${this.baseURL}${uploadUrl}`;

    const response = await fetch(url, {
      method: 'HEAD',
      headers: this.getTUSHeaders(),
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }

    const offsetHeader = response.headers.get('Upload-Offset');
    const lengthHeader = response.headers.get('Upload-Length');

    if (!offsetHeader || !lengthHeader) {
      throw TUSErrorHandler.createError(
        500,
        'Server tidak mengembalikan Upload-Offset atau Upload-Length',
        TUSErrorType.SERVER_ERROR
      );
    }

    const offset = parseInt(offsetHeader, 10);
    const length = parseInt(lengthHeader, 10);
    const progress = length > 0 ? Math.round((offset / length) * 100) : 0;

    return { offset, length, progress };
  }

  async getInfo(uploadUrl: string): Promise<Record<string, unknown>> {
    const url = `${this.baseURL}${uploadUrl}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }

    const data = await response.json();
    return data.data as Record<string, unknown>;
  }

  async cancel(uploadUrl: string): Promise<void> {
    const url = `${this.baseURL}${uploadUrl}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getTUSHeaders(),
    });

    if (!response.ok) {
      const error = await TUSErrorHandler.parseResponse(response);
      throw error;
    }
  }

  getChunkSize(): number {
    return this.chunkSize;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  getTUSVersion(): string {
    return this.tusVersion;
  }
}
