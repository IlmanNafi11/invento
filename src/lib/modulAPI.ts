import type {
  ModulListResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  UploadSlotResponse,
  UploadInfoResponse,
} from '@/types';
import { tusHelper, type ModulUploadMetadata, type UploadCallbacks, type ActiveUpload } from './tusHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface ModulUpdateMetadataRequest {
  nama_file: string;
  semester: number;
}

export interface ModulUpdateMetadataResponse {
  success: boolean;
  message: string;
  code: number;
  timestamp: string;
  data: null;
}

class ModulAPIClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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

  getFileType(file: File): string {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const typeMap: Record<string, string> = {
      'docx': 'docx',
      'xlsx': 'xlsx',
      'pdf': 'pdf',
      'pptx': 'pptx',
    };
    return typeMap[ext] || ext;
  }

  validateModulFile(file: File): { valid: boolean; error?: string } {
    return tusHelper.validateFile(file, 'modul');
  }

  async checkUploadSlot(): Promise<UploadSlotResponse> {
    return tusHelper.checkUploadSlot('/modul/upload/check-slot');
  }

  async pollForAvailableSlot(maxWaitTimeMs = 30000, pollIntervalMs = 2000): Promise<UploadSlotResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      const slotResponse = await this.checkUploadSlot();
      
      if (slotResponse.data.available) {
        return slotResponse;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Antrian penuh. Maksimal 5 file per user. Silakan tunggu upload selesai.');
  }

  async uploadModulWithChunks(
    file: File,
    metadata: ModulUploadMetadata,
    callbacks: UploadCallbacks
  ): Promise<ActiveUpload> {
    const validation = this.validateModulFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const uploadId = await tusHelper.startUpload(file, {
      metadata: metadata,
      callbacks,
      type: 'modul',
      endpoint: '/modul/upload',
    });

    const activeUpload = tusHelper.getActiveUpload(uploadId);
    if (!activeUpload) {
      throw new Error('Gagal memulai upload');
    }

    return activeUpload;
  }

  async updateModulWithChunks(
    id: number,
    file: File,
    metadata: ModulUploadMetadata,
    callbacks: UploadCallbacks
  ): Promise<ActiveUpload> {
    const validation = this.validateModulFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const uploadId = await tusHelper.startUpload(file, {
      metadata: metadata,
      callbacks,
      type: 'modul',
      isUpdate: true,
      projectId: id,
      endpoint: `/modul/${id}/upload`,
    });

    const activeUpload = tusHelper.getActiveUpload(uploadId);
    if (!activeUpload) {
      throw new Error('Gagal memulai update upload');
    }

    return activeUpload;
  }

  async pollAndUpdateModulWithChunks(
    id: number,
    file: File,
    metadata: ModulUploadMetadata,
    callbacks: UploadCallbacks
  ): Promise<ActiveUpload> {
    await this.pollForAvailableSlot();
    return this.updateModulWithChunks(id, file, metadata, callbacks);
  }

  async uploadMultipleModuls(
    files: File[],
    names: string[],
    semesters: number[],
    onFileProgress: (fileIndex: number, progress: number) => void,
    onFileComplete: (fileIndex: number) => void,
    onFileError: (fileIndex: number, error: Error) => void
  ): Promise<void> {
    if (files.length > 5) {
      throw new Error('Maksimal 5 file per upload');
    }

    if (files.length !== names.length || files.length !== semesters.length) {
      throw new Error('Jumlah file, nama, dan semester harus sama');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nama_file = names[i];
      const semester = semesters[i];

      try {
        await this.pollForAvailableSlot();

        await this.uploadModulWithChunks(
          file,
          { 
            nama_file, 
            tipe: this.getFileType(file),
            semester: semester.toString()
          },
          {
            onProgress: (progress) => {
              onFileProgress(i, progress.percentage);
            },
            onSuccess: () => {
              onFileComplete(i);
            },
            onError: (error) => {
              onFileError(i, error);
            },
          }
        );

        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            const upload = tusHelper.getActiveUpload(file.name);
            if (!upload || !upload.isUploading) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
        });

      } catch (error) {
        onFileError(i, error as Error);
        throw error;
      }
    }
  }

  async getModuls(params?: {
    search?: string;
    filter_type?: string;
    filter_semester?: number;
    page?: number;
    limit?: number;
  }): Promise<ModulListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.filter_type) searchParams.append('filter_type', params.filter_type);
    if (params?.filter_semester) searchParams.append('filter_semester', params.filter_semester.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/modul${query ? `?${query}` : ''}`;

    return this.request<ModulListResponse>(endpoint);
  }

  async updateModulMetadata(id: number, data: ModulUpdateMetadataRequest): Promise<ModulUpdateMetadataResponse> {
    return this.request<ModulUpdateMetadataResponse>(`/modul/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteModul(id: number): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(`/modul/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadModuls(ids: number[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/modul/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData as ErrorResponse | ValidationErrorResponse;
    }

    return response.blob();
  }

  async cancelUpload(uploadId: string): Promise<void> {
    return tusHelper.cancelUpload(uploadId);
  }

  async getUploadInfo(uploadId: string): Promise<UploadInfoResponse> {
    return this.request<UploadInfoResponse>(`/modul/upload/${uploadId}`);
  }

  async getUploadStatus(uploadUrl: string): Promise<{ offset: number; length: number }> {
    return tusHelper.getUploadStatus(uploadUrl);
  }

  getAllActiveUploads(): Map<string, ActiveUpload> {
    return tusHelper.getAllActiveUploads();
  }
}

export const modulAPI = new ModulAPIClient();
