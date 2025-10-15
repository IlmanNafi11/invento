import { APIClient } from './apiClient';
import type {
  RoleListResponse,
  RoleDetailResponse,
  RoleCreateRequest,
  RoleCreateResponse,
  RoleUpdateRequest,
  RoleUpdateResponse,
  PermissionsResponse,
  SuccessResponse,
} from '@/types';

class RoleAPIClient extends APIClient {
  async getPermissions(): Promise<PermissionsResponse> {
    return this.get<PermissionsResponse>('/role/permissions');
  }

  async getRoles(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<RoleListResponse> {
    return this.get<RoleListResponse>('/role', params);
  }

  async getRoleDetail(id: number): Promise<RoleDetailResponse> {
    return this.get<RoleDetailResponse>(`/role/${id}`);
  }

  async createRole(roleData: RoleCreateRequest): Promise<RoleCreateResponse> {
    return this.post<RoleCreateResponse>('/role', roleData);
  }

  async updateRole(id: number, roleData: RoleUpdateRequest): Promise<RoleUpdateResponse> {
    return this.put<RoleUpdateResponse>(`/role/${id}`, roleData);
  }

  async deleteRole(id: number): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/role/${id}`);
  }
}

export const roleAPI = new RoleAPIClient();
