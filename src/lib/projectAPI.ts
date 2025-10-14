import type {
  ProjectListResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  UploadInfoResponse,
  UploadSlotResponse,
  ProjectUpdateMetadataRequest,
  ProjectUpdateMetadataResponse,
} from '@/types';
import { tusHelper, type ProjectUploadMetadata, type UploadCallbacks, type ActiveUpload } from './tusHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ProjectAPIClient {
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

  private buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  }

  validateFileSize(file: File): boolean {
    return tusHelper.validateFileSize(file);
  }

  validateFileType(file: File): boolean {
    return tusHelper.validateFileType(file);
  }

  async checkUploadSlot(): Promise<UploadSlotResponse> {
    return tusHelper.checkUploadSlot();
  }

  async resetUploadQueue(): Promise<SuccessResponse> {
    return tusHelper.resetUploadQueue();
  }

  async checkUploadSlotWithRetry(maxRetries = 1): Promise<{ response: UploadSlotResponse; wasReset: boolean }> {
    return tusHelper.checkUploadSlotWithRetry(maxRetries);
  }

  async getProjects(params?: {
    search?: string;
    filter_semester?: number;
    filter_kategori?: string;
    page?: number;
    limit?: number;
  }): Promise<ProjectListResponse> {
    const query = this.buildQueryString(params || {});
    const endpoint = `/project${query ? `?${query}` : ''}`;
    return this.request<ProjectListResponse>(endpoint);
  }



  async uploadWithChunks(
    file: File,
    metadata: ProjectUploadMetadata,
    callbacks: UploadCallbacks
  ): Promise<ActiveUpload> {
    const uploadId = await tusHelper.startUpload(file, {
      metadata,
      callbacks,
      isUpdate: false,
      type: 'project'
    });

    const activeUpload = tusHelper.getActiveUpload(uploadId);
    if (!activeUpload) {
      throw new Error('Gagal memulai upload');
    }

    return activeUpload;
  }

  async pollAndUploadWithChunks(
    file: File,
    metadata: ProjectUploadMetadata,
    callbacks: UploadCallbacks
  ): Promise<ActiveUpload> {
    await tusHelper.pollForAvailableSlot();
    return this.uploadWithChunks(file, metadata, callbacks);
  }

  async updateProjectWithChunks(
    id: number,
    file: File,
    metadata: ProjectUploadMetadata,
    callbacks: UploadCallbacks,
    hasMetadataChanged = false
  ): Promise<ActiveUpload> {
    const uploadId = await tusHelper.startUpload(file, {
      metadata,
      callbacks,
      isUpdate: true,
      projectId: id,
      hasMetadataChanged,
      type: 'project'
    });

    const activeUpload = tusHelper.getActiveUpload(uploadId);
    if (!activeUpload) {
      throw new Error('Gagal memulai update upload');
    }

    return activeUpload;
  }

  async pollAndUpdateProjectWithChunks(
    id: number,
    file: File,
    metadata: ProjectUploadMetadata,
    callbacks: UploadCallbacks,
    hasMetadataChanged = false
  ): Promise<ActiveUpload> {
    await tusHelper.pollForAvailableSlot();
    return this.updateProjectWithChunks(id, file, metadata, callbacks, hasMetadataChanged);
  }





  async cancelUpload(uploadId: string): Promise<void> {
    return tusHelper.cancelUpload(uploadId);
  }

  async getUploadInfo(uploadId: string): Promise<UploadInfoResponse> {
    return this.request<UploadInfoResponse>(`/project/upload/${uploadId}`);
  }

  async getUploadStatus(uploadUrl: string): Promise<{ offset: number; length: number }> {
    return tusHelper.getUploadStatus(uploadUrl);
  }

  async updateProjectMetadata(id: number, data: ProjectUpdateMetadataRequest): Promise<ProjectUpdateMetadataResponse> {
    return this.request<ProjectUpdateMetadataResponse>(`/project/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(`/project/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadProjects(ids: number[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/project/download`, {
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
}

export const projectAPI = new ProjectAPIClient();
