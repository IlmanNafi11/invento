import { TUSClient, type TUSClientConfig, type TUSInitiateOptions } from './tusClient';
import { TUSProgressTracker, type TUSProgressInfo } from './tusProgress';
import { TUSErrorHandler, TUSErrorType, type TUSError } from './tusErrorHandler';
import type { TUSMetadata } from './tusMetadata';

export interface TUSUploadOptions {
  file: File;
  endpoint: string;
  metadata?: TUSMetadata;
  metadataType?: 'project' | 'modul';
  isUpdate?: boolean;
  resourceId?: number;
  hasMetadataChanged?: boolean;
  onProgress?: (progress: TUSProgressInfo) => void;
  onSuccess?: (uploadId: string) => void;
  onError?: (error: TUSError) => void;
  checkSlot?: boolean;
  pollForSlot?: boolean;
}

export interface TUSActiveUpload {
  uploadId: string;
  uploadUrl: string;
  file: File;
  offset: number;
  length: number;
  isUploading: boolean;
  abortController: AbortController;
  progressTracker: TUSProgressTracker;
  metadata?: TUSMetadata;
  type?: 'project' | 'modul';
}

export class TUSUploadManager {
  private client: TUSClient;
  private activeUploads: Map<string, TUSActiveUpload>;

  constructor(config?: TUSClientConfig) {
    this.client = new TUSClient(config);
    this.activeUploads = new Map();
  }

  async startUpload(options: TUSUploadOptions): Promise<string> {
    if (options.checkSlot) {
      const slotEndpoint = this.getSlotEndpoint(options.endpoint);
      
      if (options.pollForSlot) {
        await this.client.pollForSlot(slotEndpoint);
      } else {
        const { slotInfo } = await this.client.checkSlotWithRetry(slotEndpoint);
        
        if (!slotInfo.available) {
          throw TUSErrorHandler.createError(
            429,
            slotInfo.message || 'Slot upload tidak tersedia',
            TUSErrorType.QUEUE_FULL
          );
        }
      }
    }

    const initiateOptions: TUSInitiateOptions = {
      fileSize: options.file.size,
      metadata: options.metadata,
      metadataType: options.metadataType,
      isUpdate: options.isUpdate,
      resourceId: options.resourceId,
      hasMetadataChanged: options.hasMetadataChanged,
    };

    const uploadInfo = await this.client.initiate(options.endpoint, initiateOptions);

    const progressTracker = new TUSProgressTracker(
      uploadInfo.upload_id,
      options.file.name,
      uploadInfo.length
    );

    const activeUpload: TUSActiveUpload = {
      uploadId: uploadInfo.upload_id,
      uploadUrl: uploadInfo.upload_url,
      file: options.file,
      offset: uploadInfo.offset,
      length: uploadInfo.length,
      isUploading: true,
      abortController: new AbortController(),
      progressTracker,
      metadata: options.metadata,
      type: options.metadataType,
    };

    this.activeUploads.set(uploadInfo.upload_id, activeUpload);

    this.uploadChunks(activeUpload, options).catch((error) => {
      if (options.onError) {
        const tusError = TUSErrorHandler.handleError(error);
        options.onError(tusError);
      }
    });

    return uploadInfo.upload_id;
  }

  private async uploadChunks(
    upload: TUSActiveUpload,
    options: TUSUploadOptions
  ): Promise<void> {
    const chunkSize = this.client.getChunkSize();
    let currentOffset = upload.offset;

    try {
      while (currentOffset < upload.length && upload.isUploading) {
        const chunkEnd = Math.min(currentOffset + chunkSize, upload.length);
        const chunk = upload.file.slice(currentOffset, chunkEnd);

        const newOffset = await this.client.uploadChunkWithRetry(
          upload.uploadUrl,
          chunk,
          currentOffset,
          upload.abortController.signal
        );

        currentOffset = newOffset;
        upload.offset = newOffset;

        const progress = upload.progressTracker.updateProgress(newOffset);
        if (options.onProgress) {
          options.onProgress(progress);
        }
      }

      if (currentOffset >= upload.length && upload.isUploading) {
        if (options.onSuccess) {
          options.onSuccess(upload.uploadId);
        }
        this.activeUploads.delete(upload.uploadId);
      }
    } catch (error) {
      const tusError = TUSErrorHandler.handleError(error);
      
      if (options.onError) {
        options.onError(tusError);
      }

      if (tusError.type !== TUSErrorType.UPLOAD_CANCELLED) {
        upload.isUploading = false;
      }
    }
  }

  async cancelUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw TUSErrorHandler.createError(
        404,
        'Upload tidak ditemukan',
        TUSErrorType.NOT_FOUND
      );
    }

    upload.isUploading = false;
    upload.abortController.abort();

    try {
      await this.client.cancel(upload.uploadUrl);
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  async pauseUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw TUSErrorHandler.createError(
        404,
        'Upload tidak ditemukan',
        TUSErrorType.NOT_FOUND
      );
    }

    upload.isUploading = false;
    upload.abortController.abort();
  }

  async resumeUpload(
    uploadId: string,
    onProgress?: (progress: TUSProgressInfo) => void,
    onSuccess?: (uploadId: string) => void,
    onError?: (error: TUSError) => void
  ): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw TUSErrorHandler.createError(
        404,
        'Upload tidak ditemukan',
        TUSErrorType.NOT_FOUND
      );
    }

    const status = await this.client.getStatus(upload.uploadUrl);
    upload.offset = status.offset;
    upload.isUploading = true;
    upload.abortController = new AbortController();

    this.uploadChunks(upload, {
      file: upload.file,
      endpoint: '',
      metadata: upload.metadata,
      metadataType: upload.type,
      onProgress,
      onSuccess,
      onError,
    }).catch((error) => {
      if (onError) {
        const tusError = TUSErrorHandler.handleError(error);
        onError(tusError);
      }
    });
  }

  async getProgress(uploadId: string): Promise<TUSProgressInfo | null> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      return null;
    }

    return upload.progressTracker.getProgress();
  }

  async getServerStatus(uploadUrl: string): Promise<{
    offset: number;
    length: number;
    progress: number;
  }> {
    return this.client.getStatus(uploadUrl);
  }

  getActiveUpload(uploadId: string): TUSActiveUpload | undefined {
    return this.activeUploads.get(uploadId);
  }

  getAllActiveUploads(): Map<string, TUSActiveUpload> {
    return new Map(this.activeUploads);
  }

  getActiveUploadIds(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  hasActiveUploads(): boolean {
    return this.activeUploads.size > 0;
  }

  getActiveUploadCount(): number {
    return this.activeUploads.size;
  }

  clearFinishedUploads(): void {
    this.activeUploads.forEach((upload, uploadId) => {
      if (!upload.isUploading) {
        this.activeUploads.delete(uploadId);
      }
    });
  }

  async cancelAllUploads(): Promise<void> {
    const cancelPromises = Array.from(this.activeUploads.keys()).map((uploadId) =>
      this.cancelUpload(uploadId).catch(() => undefined)
    );

    await Promise.all(cancelPromises);
    this.activeUploads.clear();
  }

  private getSlotEndpoint(uploadEndpoint: string): string {
    const parts = uploadEndpoint.split('/');
    const resourceType = parts[1];
    return `/${resourceType}/upload/check-slot`;
  }

  getClient(): TUSClient {
    return this.client;
  }
}

export const tusUploadManager = new TUSUploadManager();
