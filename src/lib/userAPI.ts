import type {
  UserListResponse,
  UserFilesResponse,
  UpdateUserRoleRequest,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  UserPermissionsResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class UserAPI {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
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

  async getUsers(params?: {
    search?: string;
    filter_role?: string;
    page?: number;
    limit?: number;
  }): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.filter_role) searchParams.append('filter_role', params.filter_role);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/user${query ? `?${query}` : ''}`;

    return this.request<UserListResponse>(endpoint);
  }

  async updateUserRole(id: number, roleData: UpdateUserRoleRequest): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(`/user/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteUser(id: number): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(`/user/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserFiles(
    id: number,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<UserFilesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/user/${id}/files${query ? `?${query}` : ''}`;

    return this.request<UserFilesResponse>(endpoint);
  }

  async getUserPermissions(): Promise<UserPermissionsResponse> {
    return this.request<UserPermissionsResponse>('/user/permissions');
  }

  async getProfile(): Promise<{ email: string; role: string }> {
    const response = await this.request<{ data: { email: string; role: string } }>('/profile');
    return response.data;
  }
}

export const userAPI = new UserAPI();