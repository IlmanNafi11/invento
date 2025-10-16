import type {
  ErrorResponse,
  ValidationErrorResponse,
  UploadProgress,
} from '@/types';
import { getAccessToken } from './tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const MAX_FILE_SIZE_PROJECT = 500 * 1024 * 1024;
const MAX_FILE_SIZE_MODUL = 50 * 1024 * 1024;
const CHUNK_SIZE = 1024 * 1024;
const TUS_VERSION = '1.0.0';

export interface ProjectUploadMetadata {
  nama_project: string;
  kategori: string;
  semester: string;
  filename: string;
  filetype: string;
}

export interface ModulUploadMetadata {
  nama_file: string;
  tipe: string;
  semester: string;
}

export type UploadMetadata = ProjectUploadMetadata | ModulUploadMetadata;

export interface UploadCallbacks {
  onProgress: (progress: UploadProgress) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export interface UploadOptions {
  metadata: UploadMetadata;
  callbacks: UploadCallbacks;
  isUpdate?: boolean;
  projectId?: number;
  hasMetadataChanged?: boolean;
  type: 'project' | 'modul';
  endpoint?: string;
}

export interface ActiveUpload {
  uploadId: string;
  file: File;
  offset: number;
  length: number;
  isUploading: boolean;
  abortController: AbortController;
  isUpdate?: boolean;
  projectId?: number;
  uploadUrl: string;
}

export interface UploadSlot {
  available: boolean;
  message: string;
  queue_length: number;
  active_upload: boolean;
  max_concurrent: number;
}

export interface UploadSlotResponse {
  success: boolean;
  message: string;
  code: number;
  timestamp: string;
  data: UploadSlot;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  code: number;
  timestamp: string;
  data: {
    upload_id: string;
    upload_url: string;
    offset: number;
    length: number;
  };
}

export class TUSHelper {
  private static instance: TUSHelper;
  private activeUploads = new Map<string, ActiveUpload>();

  static getInstance(): TUSHelper {
    if (!TUSHelper.instance) {
      TUSHelper.instance = new TUSHelper();
    }
    return TUSHelper.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = getAccessToken();
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private getTusHeaders(): HeadersInit {
    return {
      'Tus-Resumable': TUS_VERSION,
      ...this.getAuthHeaders(),
    };
  }

  private encodeMetadata(metadata: Record<string, string>, type: 'project' | 'modul'): string {
    if (type === 'modul') {
      const parts: string[] = [];
      if (metadata.nama_file) {
        parts.push(`nama_file ${btoa(unescape(encodeURIComponent(metadata.nama_file)))}`);
      }
      if (metadata.tipe) {
        parts.push(`tipe ${btoa(unescape(encodeURIComponent(metadata.tipe)))}`);
      }
      if (metadata.semester) {
        parts.push(`semester ${btoa(unescape(encodeURIComponent(metadata.semester)))}`);
      }
      return parts.join(',');
    }
    
    return Object.entries(metadata)
      .map(([key, value]) => `${key} ${btoa(unescape(encodeURIComponent(value)))}`)
      .join(',');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ErrorResponse | ValidationErrorResponse;
    }

    return data as T;
  }

  validateFileSize(file: File, type: 'project' | 'modul' = 'project'): boolean {
    const maxSize = type === 'project' ? MAX_FILE_SIZE_PROJECT : MAX_FILE_SIZE_MODUL;
    return file.size <= maxSize;
  }

  validateFileType(file: File, type: 'project' | 'modul' = 'project'): boolean {
    if (type === 'project') {
      return file.name.toLowerCase().endsWith('.zip');
    }
    
    const modulExtensions = ['.docx', '.xlsx', '.pdf', '.pptx'];
    const fileName = file.name.toLowerCase();
    return modulExtensions.some(ext => fileName.endsWith(ext));
  }

  validateFile(file: File, type: 'project' | 'modul' = 'project'): { valid: boolean; error?: string } {
    const maxSize = type === 'project' ? MAX_FILE_SIZE_PROJECT : MAX_FILE_SIZE_MODUL;
    const maxSizeMB = maxSize / 1024 / 1024;
    
    if (!this.validateFileSize(file, type)) {
      return {
        valid: false,
        error: `Ukuran file melebihi batas maksimal ${maxSizeMB}MB. File saat ini: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    if (!this.validateFileType(file, type)) {
      return {
        valid: false,
        error: type === 'project' 
          ? 'File harus berformat ZIP' 
          : 'File harus berformat DOCX, XLSX, PDF, atau PPTX'
      };
    }

    return { valid: true };
  }

  async checkUploadSlot(endpoint: string = '/project/upload/check-slot'): Promise<UploadSlotResponse> {
    return this.request<UploadSlotResponse>(endpoint);
  }

  async resetUploadQueue(): Promise<{ success: boolean; message: string; code: number; timestamp: string; data: null }> {
    return this.request('/project/upload/reset-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async checkUploadSlotWithRetry(maxRetries = 1): Promise<{ response: UploadSlotResponse; wasReset: boolean }> {
    const slotResponse = await this.checkUploadSlot();
    
    const isStuck = !slotResponse.data.available && 
                    slotResponse.data.queue_length === 0 && 
                    slotResponse.data.active_upload === true;

    if (isStuck && maxRetries > 0) {
      await this.resetUploadQueue();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const retryResult = await this.checkUploadSlotWithRetry(maxRetries - 1);
      return { ...retryResult, wasReset: true };
    }

    return { response: slotResponse, wasReset: false };
  }

  async pollForAvailableSlot(maxWaitTimeMs = 30000, pollIntervalMs = 1000): Promise<UploadSlotResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      const { response: slotResponse } = await this.checkUploadSlotWithRetry();
      
      if (slotResponse.data.available) {
        return slotResponse;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Tidak ada slot upload tersedia setelah menunggu maximal. Silakan coba lagi nanti.');
  }

  private async initiateUpload(
    file: File, 
    metadata: UploadMetadata, 
    type: 'project' | 'modul',
    isUpdate = false, 
    projectId?: number,
    hasMetadataChanged = false,
    customEndpoint?: string
  ): Promise<UploadResponse> {
    const endpoint = customEndpoint || (isUpdate && projectId 
      ? `/project/${projectId}/upload` 
      : '/project/upload');

    const token = getAccessToken();
    const headers: Record<string, string> = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Tus-Resumable': TUS_VERSION,
      'Upload-Length': file.size.toString(),
    };

    if (type === 'modul') {
      const metadataRecord: Record<string, string> = {
        nama_file: (metadata as ModulUploadMetadata).nama_file,
        tipe: (metadata as ModulUploadMetadata).tipe,
        semester: (metadata as ModulUploadMetadata).semester,
      };
      const encodedMetadata = this.encodeMetadata(metadataRecord, 'modul');
      headers['Upload-Metadata'] = encodedMetadata;
    } else {
      if (!isUpdate) {
        const metadataRecord: Record<string, string> = {
          nama_project: (metadata as ProjectUploadMetadata).nama_project,
          kategori: (metadata as ProjectUploadMetadata).kategori,
          semester: (metadata as ProjectUploadMetadata).semester,
          filename: (metadata as ProjectUploadMetadata).filename,
          filetype: (metadata as ProjectUploadMetadata).filetype,
        };
        const encodedMetadata = this.encodeMetadata(metadataRecord, 'project');
        headers['Upload-Metadata'] = encodedMetadata;
      } else if (hasMetadataChanged) {
        const metadataRecord: Record<string, string> = {
          nama_project: (metadata as ProjectUploadMetadata).nama_project,
          kategori: (metadata as ProjectUploadMetadata).kategori,
          semester: (metadata as ProjectUploadMetadata).semester,
        };
        const encodedMetadata = this.encodeMetadata(metadataRecord, 'project');
        headers['Upload-Metadata'] = encodedMetadata;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ErrorResponse | ValidationErrorResponse;
    }

    return data as UploadResponse;
  }

  private async uploadChunk(
    uploadUrl: string,
    chunk: Blob,
    offset: number,
    signal: AbortSignal
  ): Promise<number> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Tus-Resumable': TUS_VERSION,
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': offset.toString(),
    };

    const response = await fetch(`${API_BASE_URL}${uploadUrl}`, {
      method: 'PATCH',
      headers,
      body: chunk,
      signal,
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Bad Request: ${errorText || 'Header tidak valid'}`);
      }
      
      if (response.status === 409) {
        const serverOffset = response.headers.get('Upload-Offset');
        if (serverOffset) {
          return parseInt(serverOffset);
        }
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Upload chunk failed with status ${response.status}: ${errorText}`);
    }

    const newOffset = response.headers.get('Upload-Offset');
    if (!newOffset) {
      throw new Error('Server tidak mengembalikan Upload-Offset');
    }

    return parseInt(newOffset);
  }

  private async uploadChunks(upload: ActiveUpload, callbacks: UploadCallbacks): Promise<void> {
    const { file, uploadId, uploadUrl } = upload;
    let currentOffset = upload.offset;
    const maxRetries = 3;

    try {
      while (currentOffset < upload.length && upload.isUploading) {
        const chunkEnd = Math.min(currentOffset + CHUNK_SIZE, upload.length);
        const chunk = file.slice(currentOffset, chunkEnd);


        let retryCount = 0;
        let chunkUploaded = false;

        while (!chunkUploaded && retryCount < maxRetries) {
          try {
            const newOffset = await this.uploadChunk(
              uploadUrl,
              chunk,
              currentOffset,
              upload.abortController.signal
            );

            currentOffset = newOffset;
            upload.offset = newOffset;
            chunkUploaded = true;

            const percentage = Math.round((currentOffset / upload.length) * 100);
            callbacks.onProgress({
              uploadId,
              fileName: file.name,
              bytesUploaded: currentOffset,
              bytesTotal: upload.length,
              percentage,
            });
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (currentOffset >= upload.length) {
        callbacks.onSuccess();
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          callbacks.onError(new Error('Upload dibatalkan'));
        } else {
          callbacks.onError(error);
        }
      } else {
        callbacks.onError(new Error('Upload gagal'));
      }
    }
  }

  async startUpload(file: File, options: UploadOptions): Promise<string> {
    const type = options.type;
    const validation = this.validateFile(file, type);
    if (!validation.valid) {
      throw new Error(validation.error);
    }


    const initiateResponse = await this.initiateUpload(
      file,
      options.metadata,
      type,
      options.isUpdate,
      options.projectId,
      options.hasMetadataChanged,
      options.endpoint
    );
    
    const { upload_id, upload_url, offset, length } = initiateResponse.data;

    const activeUpload: ActiveUpload = {
      uploadId: upload_id,
      file,
      offset,
      length,
      isUploading: true,
      abortController: new AbortController(),
      isUpdate: options.isUpdate,
      projectId: options.projectId,
      uploadUrl: upload_url,
    };

    this.activeUploads.set(upload_id, activeUpload);

    this.uploadChunks(activeUpload, options.callbacks).catch((error) => {
      options.callbacks.onError(error);
    });

    return upload_id;
  }

  async cancelUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload tidak ditemukan');
    }

    upload.isUploading = false;
    upload.abortController.abort();

    await fetch(`${API_BASE_URL}${upload.uploadUrl}`, {
      method: 'DELETE',
      headers: this.getTusHeaders(),
    });

    this.activeUploads.delete(uploadId);
  }

  async getUploadStatus(uploadUrl: string): Promise<{ offset: number; length: number }> {
    const response = await fetch(`${API_BASE_URL}${uploadUrl}`, {
      method: 'HEAD',
      headers: this.getTusHeaders(),
    });

    if (!response.ok) {
      throw new Error('Gagal mendapatkan status upload');
    }

    const offset = parseInt(response.headers.get('Upload-Offset') || '0');
    const length = parseInt(response.headers.get('Upload-Length') || '0');

    return { offset, length };
  }

  getActiveUpload(uploadId: string): ActiveUpload | undefined {
    return this.activeUploads.get(uploadId);
  }

  getAllActiveUploads(): Map<string, ActiveUpload> {
    return new Map(this.activeUploads);
  }

  removeActiveUpload(uploadId: string): boolean {
    return this.activeUploads.delete(uploadId);
  }
}

export const tusHelper = TUSHelper.getInstance();
