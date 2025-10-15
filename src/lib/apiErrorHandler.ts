import type {
  ErrorResponse,
  ValidationErrorResponse,
  ValidationError,
} from '@/types';

type APIError = ErrorResponse | ValidationErrorResponse;

export class APIErrorHandler {
  static isValidationError(error: APIError): error is ValidationErrorResponse {
    return 'errors' in error && Array.isArray(error.errors);
  }

  static isErrorResponse(error: unknown): error is APIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'success' in error &&
      'message' in error &&
      'code' in error
    );
  }

  static getErrorMessage(error: unknown): string {
    if (!this.isErrorResponse(error)) {
      if (error instanceof Error) {
        return error.message;
      }
      return 'Terjadi kesalahan yang tidak diketahui';
    }

    if (this.isValidationError(error)) {
      return this.formatValidationErrors(error.errors);
    }

    return error.message;
  }

  static formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return 'Data validasi tidak valid';
    }

    if (errors.length === 1) {
      return errors[0].message;
    }

    return errors.map((err) => err.message).join(', ');
  }

  static getValidationErrors(error: unknown): ValidationError[] {
    if (!this.isErrorResponse(error)) {
      return [];
    }

    if (this.isValidationError(error)) {
      return error.errors;
    }

    return [];
  }

  static getErrorCode(error: unknown): number {
    if (this.isErrorResponse(error)) {
      return error.code;
    }
    return 0;
  }

  static isNetworkError(error: unknown): boolean {
    return error instanceof TypeError || (this.isErrorResponse(error) && error.code === 0);
  }

  static isUnauthorizedError(error: unknown): boolean {
    return this.isErrorResponse(error) && error.code === 401;
  }

  static isForbiddenError(error: unknown): boolean {
    return this.isErrorResponse(error) && error.code === 403;
  }

  static isNotFoundError(error: unknown): boolean {
    return this.isErrorResponse(error) && error.code === 404;
  }

  static isConflictError(error: unknown): boolean {
    return this.isErrorResponse(error) && error.code === 409;
  }

  static isServerError(error: unknown): boolean {
    return this.isErrorResponse(error) && error.code >= 500;
  }

  static handleError(error: unknown): {
    message: string;
    code: number;
    validationErrors: ValidationError[];
    isValidation: boolean;
    isUnauthorized: boolean;
    isForbidden: boolean;
    isNotFound: boolean;
    isConflict: boolean;
    isServerError: boolean;
    isNetworkError: boolean;
  } {
    return {
      message: this.getErrorMessage(error),
      code: this.getErrorCode(error),
      validationErrors: this.getValidationErrors(error),
      isValidation: this.isErrorResponse(error) && this.isValidationError(error),
      isUnauthorized: this.isUnauthorizedError(error),
      isForbidden: this.isForbiddenError(error),
      isNotFound: this.isNotFoundError(error),
      isConflict: this.isConflictError(error),
      isServerError: this.isServerError(error),
      isNetworkError: this.isNetworkError(error),
    };
  }
}

export const handleAPIError = APIErrorHandler.handleError.bind(APIErrorHandler);
export const getErrorMessage = APIErrorHandler.getErrorMessage.bind(APIErrorHandler);
export const getValidationErrors = APIErrorHandler.getValidationErrors.bind(APIErrorHandler);
export const isValidationError = APIErrorHandler.isValidationError.bind(APIErrorHandler);
export const isUnauthorizedError = APIErrorHandler.isUnauthorizedError.bind(APIErrorHandler);
export const isForbiddenError = APIErrorHandler.isForbiddenError.bind(APIErrorHandler);
export const isNotFoundError = APIErrorHandler.isNotFoundError.bind(APIErrorHandler);
export const isConflictError = APIErrorHandler.isConflictError.bind(APIErrorHandler);
export const isServerError = APIErrorHandler.isServerError.bind(APIErrorHandler);
export const isNetworkError = APIErrorHandler.isNetworkError.bind(APIErrorHandler);
