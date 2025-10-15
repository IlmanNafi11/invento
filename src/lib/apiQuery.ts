import type { Pagination } from '@/types';

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  search?: string;
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

export class QueryBuilder {
  private params: Map<string, string | number | boolean>;

  constructor(initialParams?: QueryParams) {
    this.params = new Map();
    if (initialParams) {
      Object.entries(initialParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          this.params.set(key, value);
        }
      });
    }
  }

  setPage(page: number): this {
    if (page > 0) {
      this.params.set('page', page);
    }
    return this;
  }

  setLimit(limit: number): this {
    if (limit > 0 && limit <= 100) {
      this.params.set('limit', limit);
    }
    return this;
  }

  setSearch(search: string): this {
    if (search && search.trim()) {
      this.params.set('search', search.trim());
    } else {
      this.params.delete('search');
    }
    return this;
  }

  setFilter(key: string, value: string | number | boolean): this {
    const filterKey = key.startsWith('filter_') ? key : `filter_${key}`;
    this.params.set(filterKey, value);
    return this;
  }

  setParam(key: string, value: string | number | boolean): this {
    this.params.set(key, value);
    return this;
  }

  removeParam(key: string): this {
    this.params.delete(key);
    return this;
  }

  clear(): this {
    this.params.clear();
    return this;
  }

  build(): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    this.params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  toString(): string {
    const searchParams = new URLSearchParams();
    this.params.forEach((value, key) => {
      searchParams.append(key, String(value));
    });
    return searchParams.toString();
  }

  static fromObject(params: QueryParams): QueryBuilder {
    return new QueryBuilder(params);
  }
}

export class PaginationHelper {
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  static normalizePage(page?: number): number {
    if (!page || page < 1) {
      return this.DEFAULT_PAGE;
    }
    return page;
  }

  static normalizeLimit(limit?: number): number {
    if (!limit || limit < 1) {
      return this.DEFAULT_LIMIT;
    }
    if (limit > this.MAX_LIMIT) {
      return this.MAX_LIMIT;
    }
    return limit;
  }

  static normalize(params?: PaginationParams): Required<PaginationParams> {
    return {
      page: this.normalizePage(params?.page),
      limit: this.normalizeLimit(params?.limit),
    };
  }

  static calculateTotalPages(totalItems: number, limit: number): number {
    return Math.ceil(totalItems / limit);
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static hasNextPage(pagination: Pagination): boolean {
    return pagination.page < pagination.total_pages;
  }

  static hasPreviousPage(pagination: Pagination): boolean {
    return pagination.page > 1;
  }

  static getNextPage(pagination: Pagination): number | null {
    return this.hasNextPage(pagination) ? pagination.page + 1 : null;
  }

  static getPreviousPage(pagination: Pagination): number | null {
    return this.hasPreviousPage(pagination) ? pagination.page - 1 : null;
  }

  static isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  }

  static createPaginationInfo(
    page: number,
    limit: number,
    totalItems: number
  ): Pagination {
    return {
      page: this.normalizePage(page),
      limit: this.normalizeLimit(limit),
      total_items: totalItems,
      total_pages: this.calculateTotalPages(totalItems, limit),
    };
  }
}

export function buildQueryString(params: QueryParams): string {
  return new QueryBuilder(params).toString();
}

export function parseQueryString(queryString: string): QueryParams {
  const params: QueryParams = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach((value, key) => {
    if (key === 'page' || key === 'limit') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        params[key] = numValue;
      }
    } else {
      params[key] = value;
    }
  });

  return params;
}

export function mergeQueryParams(
  base: QueryParams,
  override: QueryParams
): QueryParams {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ),
  };
}

export function createFilterKey(key: string): string {
  return key.startsWith('filter_') ? key : `filter_${key}`;
}

export function extractFilters(params: QueryParams): FilterParams {
  const filters: FilterParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (key.startsWith('filter_')) {
      filters[key] = value;
    }
  });
  return filters;
}

export function removeFilters(params: QueryParams): QueryParams {
  const result: QueryParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (!key.startsWith('filter_')) {
      result[key] = value;
    }
  });
  return result;
}
