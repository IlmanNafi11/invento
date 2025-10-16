import { APIClient } from './apiClient';
import {
  TUSUploadManager,
  type TUSUploadOptions,
  TUSClient,
  type TUSSlotInfo,
  TUSMetadataValidator,
  type ProjectMetadata,
  TUSErrorHandler,
  TUSErrorType,
} from './tus';
import type {
  ProjectListResponse,
  SuccessResponse,
  ProjectUpdateMetadataRequest,
  ProjectUpdateMetadataResponse,
} from '@/types';

export interface ProjectUploadCallbacks {
  onProgress: (progress: { percentage: number; bytesUploaded: number; bytesTotal: number; speed: number; eta: number }) => void;
  onSuccess: () => void;
  onError: (error: { message: string }) => void;
}

class ProjectAPIClient extends APIClient {
  private tusUploadManager: TUSUploadManager;
  private tusClient: TUSClient;

  constructor() {
    super();
    this.tusUploadManager = new TUSUploadManager();
    this.tusClient = new TUSClient();
  }

  validateProjectFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    const ALLOWED_TYPES = ['zip'];

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Ukuran file project tidak boleh lebih dari 500MB',
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File tidak boleh kosong',
      };
    }

    const fileExt = file.name.toLowerCase().split('.').pop() || '';
    if (!ALLOWED_TYPES.includes(fileExt)) {
      return {
        valid: false,
        error: 'Format file harus ZIP',
      };
    }

    return { valid: true };
  }

  validateProjectMetadata(metadata: Partial<ProjectMetadata>): { valid: boolean; errors?: string[] } {
    const errors = TUSMetadataValidator.validateProjectMetadata(metadata);
    
    if (errors.length > 0) {
      return {
        valid: false,
        errors: errors.map(e => e.message),
      };
    }

    return { valid: true };
  }

  async pollForAvailableSlot(maxWaitTimeMs = 30000, pollIntervalMs = 1000): Promise<TUSSlotInfo> {
    try {
      return await this.tusClient.pollForSlot(
        '/project/upload/check-slot',
        maxWaitTimeMs,
        pollIntervalMs
      );
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      if (tusError.type === TUSErrorType.QUEUE_FULL) {
        throw new Error('Antrian penuh. Maksimal 5 file per user. Silakan tunggu upload selesai.');
      }
      throw tusError;
    }
  }

  async uploadProjectWithChunks(
    file: File,
    metadata: ProjectMetadata,
    callbacks: ProjectUploadCallbacks
  ): Promise<string> {
    const validation = this.validateProjectFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const metadataValidation = this.validateProjectMetadata(metadata);
    if (!metadataValidation.valid) {
      throw new Error(metadataValidation.errors?.join(', '));
    }

    const options: TUSUploadOptions = {
      file,
      endpoint: '/project/upload',
      metadata,
      metadataType: 'project',
      checkSlot: true,
      pollForSlot: false,
      onProgress: (progress) => {
        callbacks.onProgress({
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          bytesTotal: progress.bytesTotal,
          speed: progress.speed || 0,
          eta: progress.remainingTime || 0,
        });
      },
      onSuccess: callbacks.onSuccess,
      onError: (error) => callbacks.onError({ message: error.message }),
    };

    try {
      return await this.tusUploadManager.startUpload(options);
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      callbacks.onError({ message: tusError.message });
      throw tusError;
    }
  }

  async pollAndUploadProjectWithChunks(
    file: File,
    metadata: ProjectMetadata,
    callbacks: ProjectUploadCallbacks
  ): Promise<string> {
    const options: TUSUploadOptions = {
      file,
      endpoint: '/project/upload',
      metadata,
      metadataType: 'project',
      checkSlot: true,
      pollForSlot: true,
      onProgress: (progress) => {
        callbacks.onProgress({
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          bytesTotal: progress.bytesTotal,
          speed: progress.speed || 0,
          eta: progress.remainingTime || 0,
        });
      },
      onSuccess: callbacks.onSuccess,
      onError: (error) => callbacks.onError({ message: error.message }),
    };

    try {
      return await this.tusUploadManager.startUpload(options);
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      callbacks.onError({ message: tusError.message });
      throw tusError;
    }
  }

  async updateProjectWithChunks(
    id: number,
    file: File,
    metadata: ProjectMetadata,
    callbacks: ProjectUploadCallbacks
  ): Promise<string> {
    const validation = this.validateProjectFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const metadataValidation = this.validateProjectMetadata(metadata);
    if (!metadataValidation.valid) {
      throw new Error(metadataValidation.errors?.join(', '));
    }

    const options: TUSUploadOptions = {
      file,
      endpoint: `/project/${id}/upload`,
      metadata,
      metadataType: 'project',
      isUpdate: true,
      resourceId: id,
      checkSlot: true,
      pollForSlot: false,
      onProgress: (progress) => {
        callbacks.onProgress({
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          bytesTotal: progress.bytesTotal,
          speed: progress.speed || 0,
          eta: progress.remainingTime || 0,
        });
      },
      onSuccess: callbacks.onSuccess,
      onError: (error) => callbacks.onError({ message: error.message }),
    };

    try {
      return await this.tusUploadManager.startUpload(options);
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      callbacks.onError({ message: tusError.message });
      throw tusError;
    }
  }

  async pollAndUpdateProjectWithChunks(
    id: number,
    file: File,
    metadata: ProjectMetadata,
    callbacks: ProjectUploadCallbacks
  ): Promise<string> {
    const options: TUSUploadOptions = {
      file,
      endpoint: `/project/${id}/upload`,
      metadata,
      metadataType: 'project',
      isUpdate: true,
      resourceId: id,
      checkSlot: true,
      pollForSlot: true,
      onProgress: (progress) => {
        callbacks.onProgress({
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          bytesTotal: progress.bytesTotal,
          speed: progress.speed || 0,
          eta: progress.remainingTime || 0,
        });
      },
      onSuccess: callbacks.onSuccess,
      onError: (error) => callbacks.onError({ message: error.message }),
    };

    try {
      return await this.tusUploadManager.startUpload(options);
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      callbacks.onError({ message: tusError.message });
      throw tusError;
    }
  }

  async cancelUpload(uploadId: string): Promise<void> {
    await this.tusUploadManager.cancelUpload(uploadId);
  }

  async getProjects(params?: {
    search?: string;
    filter_semester?: number;
    filter_kategori?: string;
    page?: number;
    limit?: number;
  }): Promise<ProjectListResponse> {
    return this.get<ProjectListResponse>('/project', params);
  }

  async updateProjectMetadata(id: number, data: ProjectUpdateMetadataRequest): Promise<ProjectUpdateMetadataResponse> {
    return this.patch<ProjectUpdateMetadataResponse>(`/project/${id}`, data);
  }

  async deleteProject(id: number): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/project/${id}`);
  }

  async downloadProjects(ids: number[]): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${this.baseURL}/project/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'projects.zip'
      : 'projects.zip';

    return { blob, filename };
  }
}

export const projectAPI = new ProjectAPIClient();
