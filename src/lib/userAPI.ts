import { APIClient } from './apiUtils';
import type {
  UserListResponse,
  UserFilesResponse,
  UpdateUserRoleRequest,
  SuccessResponse,
  UserPermissionsResponse,
  ProfileResponse,
  Profile,
} from '@/types';

export interface DownloadFilePayload {
  blob: Blob;
  filename: string;
}

class UserAPIClient extends APIClient {
  async getUsers(params?: {
    search?: string;
    filter_role?: string;
    page?: number;
    limit?: number;
  }): Promise<UserListResponse> {
    return this.get<UserListResponse>('/user', params);
  }

  async updateUserRole(id: number, roleData: UpdateUserRoleRequest): Promise<SuccessResponse> {
    return this.put<SuccessResponse>(`/user/${id}/role`, roleData);
  }

  async deleteUser(id: number): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/user/${id}`);
  }

  async getUserFiles(
    id: number,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<UserFilesResponse> {
    return this.get<UserFilesResponse>(`/user/${id}/files`, params);
  }

  async getUserPermissions(): Promise<UserPermissionsResponse> {
    return this.get<UserPermissionsResponse>('/user/permissions');
  }

  async getProfile(): Promise<Profile> {
    const response = await this.get<ProfileResponse>('/profile');
    return response.data;
  }

  async updateProfile(formData: FormData): Promise<Profile> {
    const response = await this.upload<ProfileResponse>('/profile', formData, {
      customHeaders: {},
    });
    return response.data;
  }

  async downloadUserFiles(
    userId: number,
    projectIds: number[],
    modulIds: number[]
  ): Promise<DownloadFilePayload> {
    if (projectIds.length === 0 && modulIds.length === 0) {
      throw new Error('Project IDs atau Modul IDs harus diisi minimal salah satu');
    }

    const requestBody: { project_ids?: number[]; modul_ids?: number[] } = {};
    if (projectIds.length > 0) {
      requestBody.project_ids = projectIds;
    }
    if (modulIds.length > 0) {
      requestBody.modul_ids = modulIds;
    }

    const result = await this.download(`/user/${userId}/download`, requestBody);
    return result;
  }
}

export const userAPI = new UserAPIClient();
