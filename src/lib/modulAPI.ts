import type {
  ModulListResponse,
  ModulCreateResponse,
  ModulUpdateResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  ModulCreateRequest,
  ModulUpdateRequest,
} from '@/types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ModulAPI {
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

  async getModuls(params?: {
    search?: string;
    filter_type?: string;
    page?: number;
    limit?: number;
  }): Promise<ModulListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.filter_type) searchParams.append('filter_type', params.filter_type);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/modul${query ? `?${query}` : ''}`;

    return this.request<ModulListResponse>(endpoint);
  }

  async createModuls(modulData: ModulCreateRequest): Promise<ModulCreateResponse> {
    const formData = new FormData();

    // Add files
    modulData.files.forEach((file) => {
      formData.append('files', file);
    });

    // Add nama_file array
    modulData.nama_file.forEach(name => {
      formData.append('nama_file', name);
    });

    return this.request<ModulCreateResponse>('/modul', {
      method: 'POST',
      body: formData,
    });
  }

  async updateModul(id: number, modulData: ModulUpdateRequest): Promise<ModulUpdateResponse> {
    const formData = new FormData();

    if (modulData.nama_file) {
      formData.append('nama_file', modulData.nama_file);
    }
    if (modulData.file) {
      formData.append('file', modulData.file);
    }

    return this.request<ModulUpdateResponse>(`/modul/${id}`, {
      method: 'PUT',
      body: formData,
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
}

export const modulAPI = new ModulAPI();