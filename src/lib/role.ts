import type {
  RoleListResponse,
  RoleDetailResponse,
  RoleCreateRequest,
  RoleCreateResponse,
  RoleUpdateRequest,
  RoleUpdateResponse,
  PermissionsResponse,
} from '@/types';
import { getAccessToken } from './tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class RoleAPI {
  private getAuthHeaders(): HeadersInit {
    const token = getAccessToken();
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
      throw data;
    }

    return data as T;
  }

  async getPermissions(): Promise<PermissionsResponse> {
    return this.request<PermissionsResponse>('/role/permissions');
  }

  async getRoles(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<RoleListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/role${queryString ? `?${queryString}` : ''}`;

    return this.request<RoleListResponse>(endpoint);
  }

  async getRoleDetail(id: number): Promise<RoleDetailResponse> {
    return this.request<RoleDetailResponse>(`/role/${id}`);
  }

  async createRole(roleData: RoleCreateRequest): Promise<RoleCreateResponse> {
    return this.request<RoleCreateResponse>('/role', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(id: number, roleData: RoleUpdateRequest): Promise<RoleUpdateResponse> {
    return this.request<RoleUpdateResponse>(`/role/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(id: number): Promise<{ success: boolean; message: string; code: number; timestamp: string }> {
    return this.request(`/role/${id}`, {
      method: 'DELETE',
    });
  }
}

export const roleAPI = new RoleAPI();