import { APIClient } from './apiClient';
import type {
  ModulListResponse,
  SuccessResponse,
  UploadInfoResponse,
} from '@/types';
import {
  TUSUploadManager,
  type TUSUploadOptions,
  type TUSActiveUpload,
  TUSClient,
  type TUSSlotInfo,
  TUSMetadataValidator,
  type ModulMetadata,
  TUSErrorHandler,
  TUSErrorType,
} from './tus';
import { validateModulFile } from '@/utils/fileValidation';

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

export interface ModulUploadCallbacks {
  onProgress: (progress: { percentage: number; bytesUploaded: number; bytesTotal: number; speed: number; eta: number }) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

class ModulAPIClient extends APIClient {
  private tusUploadManager: TUSUploadManager;
  private tusClient: TUSClient;

  constructor() {
    super();
    this.tusUploadManager = new TUSUploadManager();
    this.tusClient = new TUSClient();
  }

  getFileType(file: File): 'docx' | 'xlsx' | 'pdf' | 'pptx' | string {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const typeMap: Record<string, 'docx' | 'xlsx' | 'pdf' | 'pptx'> = {
      'docx': 'docx',
      'xlsx': 'xlsx',
      'pdf': 'pdf',
      'pptx': 'pptx',
    };
    return typeMap[ext] || ext;
  }

  validateModulFile(file: File): { valid: boolean; error?: string } {
    return validateModulFile(file);
  }

  validateModulMetadata(metadata: Partial<ModulMetadata>): { valid: boolean; errors?: string[] } {
    const errors = TUSMetadataValidator.validateModulMetadata(metadata);
    
    if (errors.length > 0) {
      return {
        valid: false,
        errors: errors.map(e => e.message),
      };
    }

    return { valid: true };
  }

  async checkUploadSlot(): Promise<TUSSlotInfo> {
    return this.tusClient.checkSlot('/modul/upload/check-slot');
  }

  async pollForAvailableSlot(maxWaitTimeMs = 30000, pollIntervalMs = 1000): Promise<TUSSlotInfo> {
    try {
      return await this.tusClient.pollForSlot(
        '/modul/upload/check-slot',
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

  async uploadModulWithChunks(
    file: File,
    metadata: ModulMetadata,
    callbacks: ModulUploadCallbacks
  ): Promise<string> {
    const validation = this.validateModulFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const metadataValidation = this.validateModulMetadata(metadata);
    if (!metadataValidation.valid) {
      throw new Error(metadataValidation.errors?.join(', '));
    }

    const options: TUSUploadOptions = {
      file,
      endpoint: '/modul/upload',
      metadata,
      metadataType: 'modul',
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
      onError: (error) => {
        callbacks.onError(new Error(error.message));
      },
    };

    return this.tusUploadManager.startUpload(options);
  }

  async updateModulWithChunks(
    id: number,
    file: File,
    metadata: ModulMetadata,
    callbacks: ModulUploadCallbacks
  ): Promise<string> {
    const validation = this.validateModulFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const metadataValidation = this.validateModulMetadata(metadata);
    if (!metadataValidation.valid) {
      throw new Error(metadataValidation.errors?.join(', '));
    }

    const options: TUSUploadOptions = {
      file,
      endpoint: `/modul/${id}/upload`,
      metadata,
      metadataType: 'modul',
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
      onError: (error) => {
        callbacks.onError(new Error(error.message));
      },
    };

    return this.tusUploadManager.startUpload(options);
  }

  async pollAndUpdateModulWithChunks(
    id: number,
    file: File,
    metadata: ModulMetadata,
    callbacks: ModulUploadCallbacks
  ): Promise<string> {
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

    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nama_file = names[i];
      const semester = semesters[i];

      const uploadPromise = (async () => {
        try {
          await this.pollForAvailableSlot();

          const fileType = this.getFileType(file);
          if (!['docx', 'xlsx', 'pdf', 'pptx'].includes(fileType)) {
            throw new Error(`Tipe file ${fileType} tidak didukung`);
          }

          const metadata: ModulMetadata = {
            nama_file,
            tipe: fileType as 'docx' | 'xlsx' | 'pdf' | 'pptx',
            semester,
          };

          const uploadId = await this.uploadModulWithChunks(
            file,
            metadata,
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

          await this.waitForUploadComplete(uploadId);
        } catch (error) {
          onFileError(i, error as Error);
          throw error;
        }
      })();

      uploadPromises.push(uploadPromise);
    }

    await Promise.all(uploadPromises);
  }

  private async waitForUploadComplete(uploadId: string, maxWaitMs = 300000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 500;

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const upload = this.tusUploadManager.getActiveUpload(uploadId);

        if (!upload || !upload.isUploading) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        if (Date.now() - startTime > maxWaitMs) {
          clearInterval(checkInterval);
          reject(new Error('Upload timeout'));
        }
      }, pollInterval);
    });
  }

  async getModuls(params?: {
    search?: string;
    filter_type?: string;
    filter_semester?: number;
    page?: number;
    limit?: number;
  }): Promise<ModulListResponse> {
    return this.get<ModulListResponse>('/modul', params);
  }

  async updateModulMetadata(id: number, data: ModulUpdateMetadataRequest): Promise<ModulUpdateMetadataResponse> {
    return this.patch<ModulUpdateMetadataResponse>(`/modul/${id}`, data);
  }

  async deleteModul(id: number): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/modul/${id}`);
  }

  async downloadModuls(ids: number[]): Promise<{ blob: Blob; filename: string }> {
    return this.download('/modul/download', { ids });
  }

  async cancelUpload(uploadId: string): Promise<void> {
    return this.tusUploadManager.cancelUpload(uploadId);
  }

  async getUploadInfo(uploadId: string): Promise<UploadInfoResponse> {
    return this.get<UploadInfoResponse>(`/modul/upload/${uploadId}`);
  }

  async getUploadStatus(uploadId: string): Promise<{ offset: number; length: number; progress: number } | null> {
    const upload = this.tusUploadManager.getActiveUpload(uploadId);
    
    if (!upload) {
      return null;
    }

    const progress = upload.progressTracker.getProgress();

    return {
      offset: upload.offset,
      length: upload.length,
      progress: progress.percentage,
    };
  }

  getAllActiveUploads(): Map<string, TUSActiveUpload> {
    return this.tusUploadManager.getAllActiveUploads();
  }

  getUpload(uploadId: string): TUSActiveUpload | undefined {
    return this.tusUploadManager.getActiveUpload(uploadId);
  }
}

export const modulAPI = new ModulAPIClient();
