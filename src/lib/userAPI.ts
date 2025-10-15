import type {
  UserListResponse,
  UserFilesResponse,
  UpdateUserRoleRequest,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  UserPermissionsResponse,
  ProfileResponse,
  Profile,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

type DownloadFilePayload = {
  blob: Blob;
  filename: string;
};

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

  private extractFilename(contentDisposition: string | null, fallback: string): string {
    if (!contentDisposition) {
      return fallback;
    }

    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      try {
        return decodeURIComponent(filenameStarMatch[1]);
      } catch {
        return filenameStarMatch[1];
      }
    }

    const filenameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (filenameMatch?.[1]) {
      return filenameMatch[1];
    }

    return fallback;
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

  async getProfile(): Promise<Profile> {
    const response = await this.request<ProfileResponse>('/profile');
    return response.data;
  }

  async updateProfile(formData: FormData): Promise<Profile> {
    const url = `${API_BASE_URL}/profile`;

    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ErrorResponse | ValidationErrorResponse;
    }

    return data.data as Profile;
  }

  async downloadUserFiles(
    userId: number,
    projectIds: number[],
    modulIds: number[]
  ): Promise<DownloadFilePayload> {
    const url = `${API_BASE_URL}/user/${userId}/download`;

    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const requestBody: { project_ids?: number[]; modul_ids?: number[] } = {};

    if (projectIds.length > 0) {
      requestBody.project_ids = projectIds;
    }
    if (modulIds.length > 0) {
      requestBody.modul_ids = modulIds;
    }

    if (projectIds.length === 0 && modulIds.length === 0) {
      throw new Error('Project IDs atau Modul IDs harus diisi minimal salah satu');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const data = await response.json();
      throw data as ErrorResponse | ValidationErrorResponse;
    }

    const blob = await response.blob();
    const fallbackName = projectIds.length + modulIds.length > 1 ? `user_${userId}_files.zip` : `user_${userId}_file`;
    const filename = this.extractFilename(response.headers.get('content-disposition'), fallbackName);

    return { blob, filename };
  }
}

export const userAPI = new UserAPI();
