import type {
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  Pagination,
} from '@/types';

export interface ListResponse<T> extends BaseResponse {
  data: {
    items: T[];
    pagination: Pagination;
  };
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}

export class ResponseHandler {
  static isSuccessResponse(response: BaseResponse): boolean {
    return response.success === true && response.code >= 200 && response.code < 300;
  }

  static isErrorResponse(response: BaseResponse): response is ErrorResponse {
    return response.success === false;
  }

  static extractData<T>(response: DataResponse<T>): T {
    return response.data;
  }

  static extractListData<T>(response: ListResponse<T>): T[] {
    return response.data.items;
  }

  static extractPagination<T>(response: ListResponse<T>): Pagination {
    return response.data.pagination;
  }

  static getMessage(response: BaseResponse): string {
    return response.message;
  }

  static getCode(response: BaseResponse): number {
    return response.code;
  }

  static getTimestamp(response: BaseResponse): string {
    return response.timestamp;
  }

  static createSuccessResponse(message: string, code: number = 200): SuccessResponse {
    return {
      success: true,
      message,
      code,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  static createErrorResponse(message: string, code: number = 500): ErrorResponse {
    return {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    };
  }

  static createValidationErrorResponse(
    errors: { field: string; message: string }[]
  ): ValidationErrorResponse {
    return {
      success: false,
      message: 'Data validasi tidak valid',
      code: 400,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

export function isSuccessResponse(response: BaseResponse): boolean {
  return ResponseHandler.isSuccessResponse(response);
}

export function isErrorResponse(response: BaseResponse): response is ErrorResponse {
  return ResponseHandler.isErrorResponse(response);
}

export function extractData<T>(response: DataResponse<T>): T {
  return ResponseHandler.extractData(response);
}

export function extractListData<T>(response: ListResponse<T>): T[] {
  return ResponseHandler.extractListData(response);
}

export function extractPagination<T>(response: ListResponse<T>): Pagination {
  return ResponseHandler.extractPagination(response);
}

export function getMessage(response: BaseResponse): string {
  return ResponseHandler.getMessage(response);
}

export function unwrapResponse<T>(response: DataResponse<T> | T): T {
  if (typeof response === 'object' && response !== null && 'data' in response && 'success' in response) {
    return (response as DataResponse<T>).data;
  }
  return response as T;
}

export function unwrapListResponse<T>(response: ListResponse<T>): { items: T[]; pagination: Pagination } {
  return {
    items: extractListData(response),
    pagination: extractPagination(response),
  };
}

export function transformResponseData<TInput, TOutput>(
  response: DataResponse<TInput>,
  transformer: (data: TInput) => TOutput
): DataResponse<TOutput> {
  return {
    ...response,
    data: transformer(response.data),
  };
}

export function transformListResponseData<TInput, TOutput>(
  response: ListResponse<TInput>,
  transformer: (item: TInput) => TOutput
): ListResponse<TOutput> {
  return {
    ...response,
    data: {
      items: response.data.items.map(transformer),
      pagination: response.data.pagination,
    },
  };
}

export function mergeListResponses<T>(
  responses: ListResponse<T>[]
): ListResponse<T> {
  if (responses.length === 0) {
    return {
      success: true,
      message: 'Data berhasil diambil',
      code: 200,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          total_items: 0,
          total_pages: 0,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  const allItems = responses.flatMap((response) => response.data.items);
  const firstResponse = responses[0];

  return {
    ...firstResponse,
    data: {
      items: allItems,
      pagination: {
        ...firstResponse.data.pagination,
        total_items: allItems.length,
      },
    },
  };
}

export function filterListResponse<T>(
  response: ListResponse<T>,
  predicate: (item: T) => boolean
): ListResponse<T> {
  const filteredItems = response.data.items.filter(predicate);

  return {
    ...response,
    data: {
      items: filteredItems,
      pagination: {
        ...response.data.pagination,
        total_items: filteredItems.length,
        total_pages: Math.ceil(filteredItems.length / response.data.pagination.limit),
      },
    },
  };
}

export function sortListResponse<T>(
  response: ListResponse<T>,
  compareFn: (a: T, b: T) => number
): ListResponse<T> {
  return {
    ...response,
    data: {
      ...response.data,
      items: [...response.data.items].sort(compareFn),
    },
  };
}
