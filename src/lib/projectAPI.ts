import type {
  ProjectListResponse,
  ProjectCreateResponse,
  ProjectUpdateResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
} from '@/types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ProjectAPI {
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

  async getProjects(params?: {
    search?: string;
    filter_semester?: number;
    filter_kategori?: string;
    page?: number;
    limit?: number;
  }): Promise<ProjectListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.filter_semester) searchParams.append('filter_semester', params.filter_semester.toString());
    if (params?.filter_kategori) searchParams.append('filter_kategori', params.filter_kategori);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/project${query ? `?${query}` : ''}`;

    return this.request<ProjectListResponse>(endpoint);
  }

  async createProjects(projectData: ProjectCreateRequest): Promise<ProjectCreateResponse> {
    const formData = new FormData();

    // Add files
    projectData.files.forEach((file) => {
      formData.append('files', file);
    });

    // Add nama_project array
    projectData.nama_project.forEach(name => {
      formData.append('nama_project', name);
    });

    // Add semester array
    projectData.semester.forEach(sem => {
      formData.append('semester', sem.toString());
    });

    return this.request<ProjectCreateResponse>('/project', {
      method: 'POST',
      body: formData,
    });
  }

  async updateProject(id: number, projectData: ProjectUpdateRequest): Promise<ProjectUpdateResponse> {
    const formData = new FormData();

    if (projectData.nama_project) {
      formData.append('nama_project', projectData.nama_project);
    }
    if (projectData.semester !== undefined) {
      formData.append('semester', projectData.semester.toString());
    }
    if (projectData.file) {
      formData.append('file', projectData.file);
    }

    return this.request<ProjectUpdateResponse>(`/project/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteProject(id: number): Promise<SuccessResponse> {
    return this.request<SuccessResponse>(`/project/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadProjects(ids: number[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/project/download`, {
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

export const projectAPI = new ProjectAPI();