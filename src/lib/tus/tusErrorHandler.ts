export interface TUSError {
  code: number;
  message: string;
  type: TUSErrorType;
  correctOffset?: number;
  headers?: Record<string, string>;
}

export const TUSErrorType = {
  OFFSET_MISMATCH: 'OFFSET_MISMATCH',
  UPLOAD_LOCKED: 'UPLOAD_LOCKED',
  QUEUE_FULL: 'QUEUE_FULL',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_METADATA: 'INVALID_METADATA',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UPLOAD_CANCELLED: 'UPLOAD_CANCELLED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type TUSErrorType = typeof TUSErrorType[keyof typeof TUSErrorType];

export class TUSErrorHandler {
  static readonly TUS_VERSION = '1.0.0';

  static async parseResponse(response: Response): Promise<TUSError> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const code = response.status;
    let message = this.getDefaultMessage(code);
    let type = this.getErrorType(code);
    let correctOffset: number | undefined;

    if (code === 409) {
      const offsetHeader = response.headers.get('Upload-Offset');
      if (offsetHeader) {
        correctOffset = parseInt(offsetHeader, 10);
      }
      type = TUSErrorType.OFFSET_MISMATCH;
      message = correctOffset !== undefined
        ? `Offset tidak sesuai. Offset yang benar: ${correctOffset}`
        : 'Offset tidak sesuai dengan server';
    } else if (code === 423) {
      type = TUSErrorType.UPLOAD_LOCKED;
      message = 'Upload tidak aktif. Silakan cek slot upload terlebih dahulu';
    } else if (code === 429) {
      type = TUSErrorType.QUEUE_FULL;
      try {
        const data = await response.json();
        message = data.message || 'Antrian upload penuh';
      } catch {
        message = 'Antrian upload penuh';
      }
    } else if (code === 413) {
      type = TUSErrorType.FILE_TOO_LARGE;
      try {
        const data = await response.json();
        message = data.message || 'Ukuran file terlalu besar';
      } catch {
        message = 'Ukuran file terlalu besar';
      }
    } else if (code === 412) {
      type = TUSErrorType.UNSUPPORTED_VERSION;
      message = 'Versi TUS protocol tidak didukung';
    } else if (code >= 400 && code < 500) {
      try {
        const data = await response.json();
        if (data.message) {
          message = data.message;
        }
      } catch {
        
      }
    }

    return {
      code,
      message,
      type,
      correctOffset,
      headers,
    };
  }

  static getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Request tidak valid',
      401: 'Tidak memiliki akses',
      403: 'Akses ditolak',
      404: 'Upload tidak ditemukan',
      409: 'Offset tidak sesuai',
      412: 'Versi TUS protocol tidak didukung',
      413: 'Ukuran file terlalu besar',
      415: 'Content-Type tidak didukung',
      423: 'Upload tidak aktif',
      429: 'Antrian upload penuh',
      500: 'Terjadi kesalahan pada server',
    };

    return messages[statusCode] || 'Terjadi kesalahan yang tidak diketahui';
  }

  static getErrorType(statusCode: number): TUSErrorType {
    const typeMap: Record<number, TUSErrorType> = {
      401: TUSErrorType.UNAUTHORIZED,
      403: TUSErrorType.FORBIDDEN,
      404: TUSErrorType.NOT_FOUND,
      409: TUSErrorType.OFFSET_MISMATCH,
      412: TUSErrorType.UNSUPPORTED_VERSION,
      413: TUSErrorType.FILE_TOO_LARGE,
      423: TUSErrorType.UPLOAD_LOCKED,
      429: TUSErrorType.QUEUE_FULL,
      500: TUSErrorType.SERVER_ERROR,
    };

    if (statusCode >= 500) {
      return TUSErrorType.SERVER_ERROR;
    }

    return typeMap[statusCode] || TUSErrorType.UNKNOWN;
  }

  static isRetryable(error: TUSError): boolean {
    const retryableTypes: TUSErrorType[] = [
      TUSErrorType.OFFSET_MISMATCH,
      TUSErrorType.UPLOAD_LOCKED,
      TUSErrorType.NETWORK_ERROR,
      TUSErrorType.SERVER_ERROR,
    ];

    return retryableTypes.includes(error.type as TUSErrorType);
  }

  static shouldResetQueue(error: TUSError): boolean {
    return error.type === TUSErrorType.UPLOAD_LOCKED && error.code === 423;
  }

  static shouldWaitForSlot(error: TUSError): boolean {
    return error.type === TUSErrorType.QUEUE_FULL && error.code === 429;
  }

  static createError(
    code: number,
    message: string,
    type: TUSErrorType = TUSErrorType.UNKNOWN,
    correctOffset?: number
  ): TUSError {
    return {
      code,
      message,
      type,
      correctOffset,
    };
  }

  static createNetworkError(message?: string): TUSError {
    return {
      code: 0,
      message: message || 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      type: TUSErrorType.NETWORK_ERROR,
    };
  }

  static createCancelledError(): TUSError {
    return {
      code: 0,
      message: 'Upload dibatalkan',
      type: TUSErrorType.UPLOAD_CANCELLED,
    };
  }

  static formatErrorMessage(error: TUSError): string {
    if (error.type === TUSErrorType.OFFSET_MISMATCH && error.correctOffset !== undefined) {
      return `${error.message} (Offset: ${error.correctOffset})`;
    }
    return error.message;
  }

  static handleError(error: unknown): TUSError {
    if (this.isTUSError(error)) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return this.createCancelledError();
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        return this.createNetworkError(error.message);
      }
      return this.createError(0, error.message, TUSErrorType.UNKNOWN);
    }

    return this.createError(0, 'Terjadi kesalahan yang tidak diketahui', TUSErrorType.UNKNOWN);
  }

  static isTUSError(error: unknown): error is TUSError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'type' in error
    );
  }

  static getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 30000);
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryableErrorCheck?: (error: TUSError) => boolean
  ): Promise<T> {
    let lastError: TUSError | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const tusError = this.handleError(error);
        lastError = tusError;

        const shouldRetry = retryableErrorCheck
          ? retryableErrorCheck(tusError)
          : this.isRetryable(tusError);

        if (!shouldRetry || attempt >= maxRetries) {
          throw tusError;
        }

        const delay = this.getRetryDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || this.createError(0, 'Retry failed', TUSErrorType.UNKNOWN);
  }
}
